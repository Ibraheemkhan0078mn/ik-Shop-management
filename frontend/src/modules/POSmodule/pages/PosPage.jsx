import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";

import { useQarzaAccounts } from "../../qarza/services/qarza.service.js";
import { useOrders, useAddOrder } from "../../orders/services/orders.service.js";
import { useHoldOrders, useCreateHoldOrder, useDeleteHoldOrder, useUpdateHoldOrder } from "../services/holdOrders.service.js";
import { useProducts } from "../../productsModule/services/product.service.js";
import api from "@shared/services/api.js";

import PaginatedList from "@shared/components/PaginatedList.jsx";
import PosCartSidebar from "../components/PosCartSidebar.jsx";
import PosPaymentModal from "../components/PosPayemntModel.jsx";
import BatchSelectionModal from "../components/BatchSelectionModal.jsx";
import PortionModal from "../components/PortionModal.jsx";
import SplitBillModal from "../components/SplitBillModal.jsx";
import FreeFoodModal from "../components/FreeFoodModal.jsx";
import QarzaAccountCreation from "../../qarza/components/QarzaCreation.jsx";

import { showError, showSuccess } from "@shared/utilities/toastHelpers.js";
import { printOrder } from "@shared/utilities/printOrder.js";

// ─────────────────────────────────────────────────────────────────────────────
//  PosPage — main Point of Sale screen
//
//  Layout:
//    LEFT  → product table (click a row to add it to cart)
//    RIGHT → cart sidebar (shows items, subtotal, checkout button)
//
//  Flow:
//    Click product → check batches → (batch modal OR direct add) → cart
//    Cart ready → Proceed to Payment → PaymentModal → order saved → print
//    Hold → saved to hold-orders DB → resume later → checkout → hold deleted
// ─────────────────────────────────────────────────────────────────────────────
export default function PosPage() {

    // ── Auth & language ────────────────────────────────────────────────────
    const authUser = useSelector((s) => s.auth);
    const user = authUser?.role ? authUser : { role: "admin", permissions: { deleteOrders: true } };
    const language = user?.language || "en";

    // ── Data fetching ──────────────────────────────────────────────────────
    const { data: productsRaw, refetch: refetchProducts } = useProducts();
    const products = productsRaw?.data || productsRaw || [];   // used to resolve product images on resume

    const ordersQuery = useOrders();
    const addOrderMutation = useAddOrder();
    const orderHistory = (ordersQuery.data?.data || ordersQuery.data || []);

    const holdOrdersQuery = useHoldOrders();
    const createHoldMutation = useCreateHoldOrder();
    const updateHoldMutation = useUpdateHoldOrder();
    const deleteHoldMutation = useDeleteHoldOrder();
    const holdOrders = holdOrdersQuery.data?.data || holdOrdersQuery.data || [];

    // ── Qarza accounts (for credit/hybrid payments) ────────────────────────
    const { data: fetchedQarza = [], refetch: refetchQarza } = useQarzaAccounts();
    const [localQarza, setLocalQarza] = useState([]);
    const qarzaAccounts = localQarza.length ? localQarza : fetchedQarza;

    // ── Cart ───────────────────────────────────────────────────────────────
    const [cart, setCart] = useState([]);

    // When a held order is resumed, we store its DB _id here.
    // We delete it from the DB only after checkout succeeds — not on resume.
    const [resumedHoldId, setResumedHoldId] = useState(null);

    // Issue 2: hold-order metadata restored on resume so the payment modal
    // can pre-fill customer name, waiter and discount when the cashier
    // re-opens it for a resumed order.
    const [resumedHoldMeta, setResumedHoldMeta] = useState({ customerName: "", waiter: "", discountAmount: 0 });

    // ── Sticky batches (per product) ───────────────────────────────────────
    // If a cashier picks a batch and ticks "Save as default", that batch is
    // reused for every subsequent click on the same product.
    const [stickyBatches, setStickyBatches] = useState({});

    // ── Modal visibility flags ─────────────────────────────────────────────
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [showPortionModal, setShowPortionModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [showFreeFoodModal, setShowFreeFoodModal] = useState(false);
    const [showQarzaModal, setShowQarzaModal] = useState(false);
    const [showHeldOrders, setShowHeldOrders] = useState(false);

    // ── Batch modal — which product was clicked ────────────────────────────
    const [batchProduct, setBatchProduct] = useState(null);

    // ── Portion modal — which cart item is being edited ────────────────────
    const [portionItem, setPortionItem] = useState(null);    // cart item being edited
    const [portionIndex, setPortionIndex] = useState(null);    // its index in cart
    const [portionType, setPortionType] = useState("full");  // selected portion
    const [portionCustomPrice, setPortionCustomPrice] = useState("");     // custom price input

    // ── Fetch qarza accounts once on mount ─────────────────────────────────
    // handled by RTK Query useQarzaAccounts hook above

    // ── Shift+Enter shortcut → open payment modal ──────────────────────────
    useEffect(() => {
        const onKey = (e) => { if (e.shiftKey && e.key === "Enter" && cart.length) setShowPaymentModal(true); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [cart]);

    // ── Cart subtotal ──────────────────────────────────────────────────────
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.qty) || 0), 0);


    // ═════════════════════════════════════════════════════════════════════════
    //  SECTION 1 — CART HELPERS
    // ═════════════════════════════════════════════════════════════════════════

    // Converts a relative image path to a full URL
    const toImageUrl = (img) => {
        if (!img) return null;
        return img.startsWith("http") ? img : `http://localhost:5001${img}`;
    };

    // True when two cart items represent the same line (same product + portion + price + batch)
    const isSameLine = (cartItem, id, pt, up, bid) =>
        cartItem._id === id &&
        cartItem.portionType === pt &&
        cartItem.unitPrice === up &&
        cartItem.batchId === bid;

    // Increase qty of a specific cart line by 1
    const incQty = (id, pt, up, bid) =>
        setCart((prev) => prev.map((i) => isSameLine(i, id, pt, up, bid) ? { ...i, qty: i.qty + 1 } : i));

    // Decrease qty — removes the line if it reaches 0
    const decQty = (id, pt, up, bid) =>
        setCart((prev) =>
            prev
                .map((i) => isSameLine(i, id, pt, up, bid) ? { ...i, qty: i.qty - 1 } : i)
                .filter((i) => i.qty > 0),
        );

    // Remove an entire cart line
    const removeFromCart = (id, pt, up, bid) =>
        setCart((prev) => prev.filter((i) => !isSameLine(i, id, pt, up, bid)));

    // Set an exact qty value for a cart line
    const setCartItemQty = (id, pt, up, bid, value) => {
        if (value < 1) return;
        setCart((prev) => prev.map((i) => isSameLine(i, id, pt, up, bid) ? { ...i, qty: value } : i));
    };

    // Empty the cart
    const clearCart = () => setCart([]);


    // ═════════════════════════════════════════════════════════════════════════
    //  SECTION 2 — ADDING ITEMS TO CART
    // ═════════════════════════════════════════════════════════════════════════

    // Core function — adds (or increments) one product in the cart
    const addItemToCart = (product, portionType = "full", customPriceValue = null, batch = null) => {
        // Calculate base price: use batch selling price if batch provided, otherwise product price
        const basePrice = Number(batch ? batch.sellingPrice : product.price) || 0;
        const discount = Number(product.discount) || 0;
        const priceAfterDisc = basePrice - (basePrice * discount) / 100;

        // Apply portion adjustment
        let finalPrice = priceAfterDisc;
        if (portionType === "half") finalPrice = priceAfterDisc / 2;
        if (portionType === "custom") finalPrice = Number(customPriceValue) || priceAfterDisc;

        const batchId = batch?._id || null;

        setCart((prev) => {
            // If exact same line exists → just increment qty
            const exists = prev.find((i) => isSameLine(i, product._id, portionType, finalPrice, batchId));
            if (exists) {
                return prev.map((i) =>
                    isSameLine(i, product._id, portionType, finalPrice, batchId)
                        ? { ...i, qty: i.qty + 1 }
                        : i,
                );
            }

            // Otherwise add a new line
            return [...prev, {
                ...product,
                qty: 1,
                unitPrice: finalPrice,
                originalPrice: priceAfterDisc,  // full price before portion split — needed for edit
                image: toImageUrl(product.image),
                portionType,
                batchId,
                batchNumber: batch?.batchNumber || null,
            }];
        });
    };

    // Called when a product row is clicked in the table
    // → If a sticky batch exists for this product, use it directly
    // → If product has batches: one batch → auto-add, multiple → show modal
    // → If no batches, show error (batch is required)
    const handleProductClick = useCallback(async (product) => {
        // 1. Sticky batch check
        const sticky = stickyBatches[product._id];
        if (sticky?.quantity > 0) { addItemToCart(product, "full", null, sticky); return; }

        // 2. Fetch batches for this product
        try {
            const { data } = await api.get(`/batches/${product._id}`);
            const batches = data?.data || data || [];

            if (batches.length === 0) {
                // No batches tracked → show error
                showError(language === "en" ? "No batches available. Please create a purchase first." : "کوئی بیچ دستیاب نہیں۔ پہلے خریداری کریں۔");
                return;
            } else if (batches.length === 1) {
                // Only one batch → auto-add to cart
                addItemToCart(product, "full", null, batches[0]);
            } else {
                // Multiple batches → let cashier choose one
                setBatchProduct(product);
                setShowBatchModal(true);
            }
        } catch {
            // API error → show error
            showError(language === "en" ? "Failed to load batches." : "بیچ لوڈ کرنے میں ناکام۔");
        }
    }, [stickyBatches, language]);

    // Called from BatchSelectionModal after cashier picks a batch
    const handleBatchConfirm = (product, batch, makeSticky) => {
        addItemToCart(product, "full", null, batch);

        // Save or clear sticky batch based on checkbox in modal
        if (makeSticky && batch) {
            setStickyBatches((prev) => ({ ...prev, [product._id]: batch }));
        } else {
            setStickyBatches((prev) => { const next = { ...prev }; delete next[product._id]; return next; });
        }
    };


    // ═════════════════════════════════════════════════════════════════════════
    //  SECTION 3 — PORTION MODAL (changing price type of a cart item)
    // ═════════════════════════════════════════════════════════════════════════

    // Opens the modal to change Full / Half / Custom price on a cart item
    const openPortionModal = (item, index) => {
        setPortionItem(item);
        setPortionIndex(index);
        setPortionType(item.portionType || "full");
        setPortionCustomPrice(item.portionType === "custom" ? String(item.unitPrice) : "");
        setShowPortionModal(true);
    };

    const closePortionModal = () => {
        setShowPortionModal(false);
        setPortionItem(null);
        setPortionIndex(null);
        setPortionCustomPrice("");
    };

    // Applies the new portion type to the cart item
    const handlePortionConfirm = () => {
        if (!portionItem || portionIndex === null) return;

        if (portionType === "custom" && (!portionCustomPrice || Number(portionCustomPrice) <= 0)) {
            showError(language === "en" ? "Enter a valid custom price." : "درست کسٹم قیمت درج کریں۔");
            return;
        }

        setCart((prev) => {
            const updated = [...prev];
            const item = updated[portionIndex];
            const savedQty = item.qty;
            const basePrice = Number(item.originalPrice) || Number(item.unitPrice) || 0;

            let newPrice = basePrice;
            if (portionType === "half") newPrice = basePrice / 2;
            if (portionType === "custom") newPrice = Number(portionCustomPrice);

            // Remove the old entry
            updated.splice(portionIndex, 1);

            // If a line with the same new settings already exists → merge qty
            const duplicate = updated.findIndex((i) =>
                i._id === item._id &&
                i.portionType === portionType &&
                i.unitPrice === newPrice &&
                i.batchId === item.batchId,
            );

            if (duplicate > -1) {
                updated[duplicate].qty += savedQty;
            } else {
                updated.push({ ...item, portionType, unitPrice: newPrice, qty: savedQty });
            }

            return updated;
        });

        closePortionModal();
    };


    // ═════════════════════════════════════════════════════════════════════════
    //  SECTION 4 — HOLD ORDER
    // ═════════════════════════════════════════════════════════════════════════

    // Saves the current cart to the hold-orders DB, then clears the cart.
    // Note: does NOT create a real order — just pauses it.
    const handleHoldOrder = async () => {
        if (!cart.length) return showError(language === "en" ? "Cart is empty!" : "کارٹ خالی ہے!");

        try {
            const discountAmt = Math.max(0, Number(resumedHoldMeta.discountAmount) || 0);
            const total = Math.max(0, subtotal - discountAmt);
            const holdBody = {
                items: buildOrderItems(),
                subtotal,
                discountAmount: discountAmt,
                totalAmount: total,
                customerName: resumedHoldMeta.customerName || "",
                waiter: resumedHoldMeta.waiter || "",
            };

            console.log("Holding order with body:", holdBody);

            if (resumedHoldId) {
                // Issue 1 & 5: update the existing hold, preserve its original order number
                console.log("Updating existing hold:", resumedHoldId);
                await updateHoldMutation.mutateAsync({ id: resumedHoldId, body: holdBody });
            } else {
                // New hold — generate a fresh order number
                const { data } = await api.get("/orders/generate-number");
                console.log("Creating new hold with order number:", data.orderNumber);
                await createHoldMutation.mutateAsync({ orderNumber: data.orderNumber, ...holdBody });
            }

            console.log("Hold order successful");
            clearCart();
            setResumedHoldId(null);
            setResumedHoldMeta({ customerName: "", waiter: "", discountAmount: 0 });
            showSuccess(language === "en" ? "Order held!" : "آرڈر روک دیا گیا!");
        } catch (err) {
            console.error("Hold order error:", err);
            showError(err?.message || "Failed to hold order.");
        }
    };

    // Loads a held order back into the cart WITHOUT deleting it from DB yet.
    // It will be deleted only after checkout succeeds (see handleCheckout).
    const handleResumeOrder = (holdOrder) => {
        if (!holdOrder.items?.length) {
            showError(language === "en" ? "No items in this order!" : "اس آرڈر میں آئٹمز نہیں ہیں!");
            return;
        }

        // Issue 3: guard against silently overwriting an active cart
        if (cart.length > 0) {
            const confirmed = window.confirm(
                language === "en"
                    ? "Your current cart has items. Resuming will replace them. Continue?"
                    : "آپ کے موجودہ کارٹ میں آئٹمز ہیں۔ جاری رکھنے سے وہ ہٹ جائیں گے۔ جاری رکھیں؟"
            );
            if (!confirmed) return;
        }

        const restoredCart = holdOrder.items.map((item) => {
            const productData = products.find((p) => p._id === String(item.product));
            return {
                _id:           String(item.product),
                name:          item.name,
                qty:           item.quantity ?? 1,
                unitPrice:     Number(item.unitPrice)     ?? 0,
                originalPrice: Number(item.originalPrice) ?? Number(item.unitPrice) ?? 0,
                image:         toImageUrl(productData?.image),
                portionType:   item.portionType  || "full",
                batchId:       item.batchId      ?? null,
                batchNumber:   item.batchNumber  ?? null,
            };
        });

        setCart(restoredCart);
        setResumedHoldId(holdOrder._id);                      // track for delete-after-checkout
        // Issue 2: restore customer/waiter/discount so payment modal can pre-fill them
        setResumedHoldMeta({
            customerName:   holdOrder.customerName   || "",
            waiter:         holdOrder.waiter         || "",
            discountAmount: holdOrder.discountAmount || 0,
        });
        setShowHeldOrders(false);
    };

    // Manually deletes a held order (cashier clicks delete button)
    const handleDeleteHeldOrder = async (id) => {
        try { await deleteHoldMutation.mutateAsync(id); } catch { }
    };


    // ═════════════════════════════════════════════════════════════════════════
    //  SECTION 5 — CHECKOUT
    // ═════════════════════════════════════════════════════════════════════════

    // Creates the final order in DB, prints the receipt, clears the cart.
    // If this cart was resumed from a held order, the hold is deleted here.
    const handleCheckout = async ({
        customerName, selectedWaiter, orderDiscount,
        paymentMethod, selectedQarzaAccountId, cashReceived,
        onlinePlatform, onlineAmount,
        hybridCash, hybridQarza, hybridQarzaAccountId,
    }) => {
        if (!cart.length) return showError(language === "en" ? "Cart is empty!" : "کارٹ خالی ہے!");

        try {
            console.log("Starting checkout process...");
            
            // Generate order number
            console.log("Generating order number...");
            const { data } = await api.get("/orders/generate-number");
            console.log("Order number generated:", data.orderNumber);
            
            const discountAmt = Math.max(0, Number(orderDiscount) || 0);
            const total = Math.max(0, subtotal - discountAmt);
            const change = Math.max(0, (Number(cashReceived) || 0) - total);

            const orderBody = {
                orderNumber: data.orderNumber,
                createdAt: new Date().toISOString(),
                subtotal,
                discountAmount: discountAmt,
                totalAmount: total,
                items: buildOrderItems(),
                customerName: paymentMethod === "credit" ? "" : customerName,
                waiter: selectedWaiter,
                paymentMethod,
                status: "completed",

                // Cash fields
                cashReceived: paymentMethod === "cash" ? Number(cashReceived) || 0 : 0,
                change: paymentMethod === "cash" ? change : 0,

                // Online fields
                onlinePlatform: paymentMethod === "online" ? onlinePlatform : "",
                onlineAmount: paymentMethod === "online" ? Number(onlineAmount) || 0 : 0,

                // Qarza (credit) fields
                qarzaAccount: paymentMethod === "credit" ? selectedQarzaAccountId : null,

                // Hybrid fields
                hybridCash: paymentMethod === "hybrid" ? Number(hybridCash) || 0 : 0,
                hybridQarza: paymentMethod === "hybrid" ? Number(hybridQarza) || 0 : 0,
                hybridQarzaAccount: paymentMethod === "hybrid" ? hybridQarzaAccountId : null,
            };

            console.log("Creating order with body:", orderBody);
            console.log("Calling addOrderMutation...");
            const res = await addOrderMutation.mutateAsync(orderBody);
            console.log("Order created successfully:", res);

            // Print the receipt
            const selectedAccount = qarzaAccounts.find((a) => a._id === selectedQarzaAccountId);
            printOrder({
                ...orderBody,
                ...res.order,
                orderNumber: res.order?.orderNumber || orderBody.orderNumber,
                createdAt: res.order?.createdAt || orderBody.createdAt,
                qarzaAccount:
                    paymentMethod === "credit" && selectedAccount
                        ? { _id: selectedAccount._id, name: selectedAccount.name }
                        : null,
            });

            // Delete the hold if this cart came from a resumed hold order
            if (resumedHoldId) {
                try { await deleteHoldMutation.mutateAsync(resumedHoldId); } catch { }
                setResumedHoldId(null);
                setResumedHoldMeta({ customerName: "", waiter: "", discountAmount: 0 });
            }

            clearCart();
            setShowPaymentModal(false);
            refetchQarza();
            refetchProducts();
            showSuccess(language === "en" ? "Order completed successfully!" : "آرڈر مکمل ہو گیا!");
        } catch (err) {
            console.error("Checkout error:", err);
            console.error("Error details:", err?.response?.data || err?.message);
            showError(err?.response?.data?.message || err?.message || "Failed to create order.");
        }
    };


    // ═════════════════════════════════════════════════════════════════════════
    //  SECTION 6 — SPLIT BILL
    // ═════════════════════════════════════════════════════════════════════════

    // Opens a print window showing how much each person owes
    const handleSplitBill = (personCount) => {
        if (!cart.length) return showError(language === "en" ? "Cart is empty!" : "کارٹ خالی ہے!");
        if (!personCount || personCount < 1) return showError(language === "en" ? "Enter a valid number!" : "درست تعداد درج کریں!");

        const perPerson = subtotal / personCount;

        const html = `<html><head><title>Split Bill</title>
            <style>body{font-family:Arial;padding:12px}.c{text-align:center}</style></head>
            <body>
                <h2 class="c">Split Bill</h2>
                <p>Date: ${new Date().toLocaleString()}</p>
                <p>Total: Rs ${subtotal.toFixed(0)}</p>
                <p>Split between ${personCount} people</p>
                <h3 class="c">Each person pays: Rs ${perPerson.toFixed(0)}</h3>
                <hr/><p class="c">Thank you!</p>
            </body></html>`;

        const printWindow = window.open("", "PRINT", "height=600,width=400");
        if (!printWindow) return showError("Please allow popups to print.");
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 200);
        setShowSplitModal(false);
    };


    // ═════════════════════════════════════════════════════════════════════════
    //  SECTION 7 — FREE FOOD
    // ═════════════════════════════════════════════════════════════════════════

    // Verifies manager code, then creates a 0-cost order
    const handleFreeFood = async (managerCode, customerName = "", selectedWaiter = "") => {
        if (!cart.length) return showError(language === "en" ? "Cart is empty!" : "کارٹ خالی ہے!");
        if (!managerCode.trim()) return showError(language === "en" ? "Enter Manager Code!" : "منیجر کا کوڈ درج کریں!");

        try {
            const verifyRes = await api.post("/settings/verify-manager", { code: managerCode });
            if (verifyRes.data.status === "error") return showError(verifyRes.data.data.message);
            showSuccess(verifyRes.data.data);

            const { data } = await api.get("/orders/generate-number");
            const orderBody = {
                orderNumber: data.orderNumber,
                createdAt: new Date().toISOString(),
                subtotal,
                discountAmount: subtotal,   // full discount = free
                totalAmount: 0,
                items: buildOrderItems(),
                customerName: customerName || "N/A",
                waiter: selectedWaiter,
                note: "FREE FOOD — Manager Approved",
                paymentMethod: "free",
                status: "completed",
            };

            const res = await addOrderMutation.mutateAsync(orderBody);
            printOrder({ ...orderBody, ...res.order, orderNumber: res.order?.orderNumber || data.orderNumber }, "Free Food");

            // Issue 4: delete the resumed hold if this was a free-food completion
            if (resumedHoldId) {
                try { await deleteHoldMutation.mutateAsync(resumedHoldId); } catch { }
                setResumedHoldId(null);
                setResumedHoldMeta({ customerName: "", waiter: "", discountAmount: 0 });
            }

            clearCart();
            setShowFreeFoodModal(false);
            refetchProducts();
        } catch { }
    };


    // ═════════════════════════════════════════════════════════════════════════
    //  SECTION 8 — SHARED UTILITY
    // ═════════════════════════════════════════════════════════════════════════

    // Converts the cart array into the format the backend order schema expects
    const buildOrderItems = () => cart.map((item) => ({
        product:       item._id,
        name:          item.name,
        quantity:      item.qty,
        unitPrice:     item.unitPrice,
        lineTotal:     item.unitPrice * item.qty,
        originalPrice: item.originalPrice ?? item.unitPrice,   // ?? not || so 0 is preserved
        portionType:   item.portionType   || "full",
        batchId:       item.batchId       ?? null,
        batchNumber:   item.batchNumber   ?? null,
    }));


    // ═════════════════════════════════════════════════════════════════════════
    //  RENDER
    // ═════════════════════════════════════════════════════════════════════════
    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">

            {/* ── LEFT: Product table ────────────────────────────────────── */}
            <main className="flex-1 flex flex-col overflow-hidden p-4 gap-3">

                {/* Top bar */}
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-cyan-700 tracking-tight">Point of Sale</h1>
                    <div className="flex gap-2">
                        <button onClick={() => setShowHeldOrders(true)}
                            className="px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-lg border border-amber-200 hover:bg-amber-200 transition font-medium">
                            Held Orders ({holdOrders.length})
                        </button>
                        <button onClick={() => setShowFreeFoodModal(true)}
                            className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg border border-green-200 hover:bg-green-200 transition font-medium">
                            Free Food
                        </button>
                        <button onClick={() => setShowSplitModal(true)}
                            className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-200 transition font-medium">
                            Split Bill
                        </button>
                    </div>
                </div>

                {/* Product list — clicking a card calls handleProductClick */}
                <div className="flex-1 overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100">
                    <PaginatedList
                        endpoint="/products/pagination"
                        limit={20}
                        dataKey="data"
                        wrapperClassName="h-full"
                        className="p-3"
                        renderItems={(products) => (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                {products.map((product) => (
                                    <ProductCard
                                        key={product._id}
                                        product={product}
                                        onClick={() => handleProductClick(product)}
                                    />
                                ))}
                            </div>
                        )}
                    />
                </div>
            </main>

            {/* ── RIGHT: Cart sidebar ────────────────────────────────────── */}
            <PosCartSidebar
                cart={cart}
                subtotal={subtotal}
                resumedHoldId={resumedHoldId}
                holdOrders={holdOrders}
                orderHistory={orderHistory}
                showHeldOrders={showHeldOrders}
                setShowHeldOrders={setShowHeldOrders}
                user={user}
                incQty={incQty}
                decQty={decQty}
                removeFromCart={removeFromCart}
                setCartItemQty={setCartItemQty}
                openPortionModal={openPortionModal}
                onCheckout={() => setShowPaymentModal(true)}
                onHold={handleHoldOrder}
                handleResumeOrder={handleResumeOrder}
                handleDeleteHeldOrder={handleDeleteHeldOrder}
            />

            {/* ── MODALS ──────────────────────────────────────────────────── */}

            {showPaymentModal && (
                <PosPaymentModal
                    subtotal={subtotal}
                    onCheckout={handleCheckout}
                    onClose={() => setShowPaymentModal(false)}
                    onCreateQarza={() => setShowQarzaModal(true)}
                    language={language}
                    initialCustomerName={resumedHoldMeta.customerName}
                    initialWaiter={resumedHoldMeta.waiter}
                    initialDiscount={resumedHoldMeta.discountAmount}
                />
            )}

            {showPortionModal && (
                <PortionModal
                    product={portionItem}
                    selectedPortionType={portionType}
                    setSelectedPortionType={setPortionType}
                    customPrice={portionCustomPrice}
                    setCustomPrice={setPortionCustomPrice}
                    onClose={closePortionModal}
                    onConfirm={handlePortionConfirm}
                    language={language}
                />
            )}

            {showBatchModal && (
                <BatchSelectionModal
                    product={batchProduct}
                    initialIsSticky={!!stickyBatches[batchProduct?._id]}
                    onClose={() => setShowBatchModal(false)}
                    onConfirm={handleBatchConfirm}
                    language={language}
                />
            )}

            {showSplitModal && (
                <SplitBillModal
                    onClose={() => setShowSplitModal(false)}
                    onConfirm={handleSplitBill}
                    language={language}
                />
            )}

            {showFreeFoodModal && (
                <FreeFoodModal
                    onClose={() => setShowFreeFoodModal(false)}
                    onConfirm={handleFreeFood}
                    language={language}
                />
            )}

            {showQarzaModal && (
                <QarzaAccountCreation
                    setQarzaAccountCreationFormPopupVisibility={setShowQarzaModal}
                    type="personal"
                    onCreated={(newAccount) => {
                        setLocalQarza((prev) => [...prev, newAccount]);
                        refetchQarza();
                    }}
                />
            )}

            {/* Dimmed backdrop when Held Orders drawer is open */}
            {showHeldOrders && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/20 backdrop-blur-sm"
                    onClick={() => setShowHeldOrders(false)}
                />
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ProductCard — one product tile in the POS product grid
//  Clicking it triggers the batch-check → add-to-cart flow in PosPage
// ─────────────────────────────────────────────────────────────────────────────
function ProductCard({ product, onClick }) {
    const imageUrl = product.image
        ? (product.image.startsWith("http") ? product.image : `http://localhost:5001${product.image}`)
        : null;

    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 hover:bg-cyan-50 border border-gray-200 hover:border-cyan-300
                       rounded-xl transition-all active:scale-95 text-left w-full"
        >
            {/* Product image or placeholder */}
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full aspect-square object-cover rounded-lg bg-gray-100"
                    onError={(e) => { e.target.style.display = "none"; }}
                />
            ) : (
                <div className="w-full aspect-square rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                    No image
                </div>
            )}

            {/* Name */}
            <p className="text-xs font-semibold text-gray-800 text-center leading-tight line-clamp-2 w-full">
                {product.name}
            </p>

            {/* Price */}
            <p className="text-sm font-bold text-cyan-700">
                Rs {(Number(product.price) || 0).toLocaleString()}
            </p>

            {/* Category */}
            {product.category?.name && (
                <span className="text-[10px] text-gray-400 truncate w-full text-center">
                    {product.category.name}
                </span>
            )}
        </button>
    );
}

