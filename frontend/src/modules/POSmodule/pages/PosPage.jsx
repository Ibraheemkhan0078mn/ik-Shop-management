import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchQarzaAccounts } from "../../qarza/slices/qarzaSlice.js";
import { useOrders, useAddOrder, useDeleteOrder } from "../../orders/services/orders.service.js";
import api from "../../../lib/api";

import PortionModal from "../components/PortionModal.jsx";
import BatchSelectionModal from "../components/BatchSelectionModal.jsx";
import FreeFoodModal from "../components/FreeFoodModal.jsx";
import SplitBillModal from "../components/SplitBillModal.jsx";
import QarzaAccountCreation from "../../qarza/parts/QarzaCreation.jsx";

import PosCartSidebar from "../components/PosCartSidebar.jsx";
import PosPaymentModal from "../components/PosPayemntModel.jsx";

import { showError, showSuccess } from "../../../utils/toastHelpers.js";
import { printOrder } from "../../../utils/printOrder.js";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../../productsModule/services/product.service.js";

// ─── PaginatedTable import (your existing component) ───────────────────────
import PaginatedTable from "../../../components/common/PaginatedTable.jsx"; // adjust path as needed

// ─── Column definition for products ────────────────────────────────────────
const columns = {
    "Product Name": "name",
    "Product Code": "productCode",
    "Barcode": "barcode",
    "Category": "category.name",
    "Total Batches": "batches.length",
    "Notes": "description",
};
export default function PosPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // ── Auth ──────────────────────────────────────────────────────────────
    const authUser = useSelector((s) => s.auth);
    const user = authUser?.role
        ? authUser
        : { role: "admin", permissions: { deleteOrders: true } };
    const language = user?.language || "en";

    // ── Products ──────────────────────────────────────────────────────────
    const { data: productsData, refetch: refetchProducts } = useProducts();
    const products = productsData?.data || productsData || [];

    // ── Orders ────────────────────────────────────────────────────────────
    const ordersQuery = useOrders();
    const addOrderMutation = useAddOrder();
    const deleteOrderMutation = useDeleteOrder();

    const allOrders = ordersQuery.data?.data || ordersQuery.data || [];
    const heldOrders = allOrders.filter((o) => o.status === "held");
    const orderHistory = allOrders.filter((o) => o.status !== "held");

    // ── Qarza accounts (flexible: Redux + optional override) ──────────────
    const reduxQarzaAccounts = useSelector((s) => s.qarza?.accounts || []);
    const [localQarzaAccounts, setLocalQarzaAccounts] = useState([]);
    // Use local override if populated, else fall back to Redux
    const qarzaAccounts = localQarzaAccounts.length
        ? localQarzaAccounts
        : reduxQarzaAccounts;

    // ── Cart ──────────────────────────────────────────────────────────────
    const [cart, setCart] = useState([]);

    // ── Batch (sticky) ────────────────────────────────────────────────────
    const [stickyBatches, setStickyBatches] = useState({});
    const [selectedProductForBatch, setSelectedProductForBatch] = useState(null);
    const [showBatchModal, setShowBatchModal] = useState(false);

    // ── Portion modal ─────────────────────────────────────────────────────
    const [showPortionModal, setShowPortionModal] = useState(false);
    const [selectedProductForPortion, setSelectedProductForPortion] = useState(null);
    const [selectedPortionType, setSelectedPortionType] = useState("full");
    const [customPrice, setCustomPrice] = useState("");
    const [editingCartIndex, setEditingCartIndex] = useState(null);

    // ── Split bill modal ──────────────────────────────────────────────────
    const [showSplitModal, setShowSplitModal] = useState(false);

    // ── Free food modal ───────────────────────────────────────────────────
    const [showFreeFoodModal, setShowFreeFoodModal] = useState(false);

    // ── Qarza creation popup ──────────────────────────────────────────────
    const [showQarza, setShowQarza] = useState(false);

    // ── Payment modal ─────────────────────────────────────────────────────
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // ── Held orders drawer ────────────────────────────────────────────────
    const [showHeldOrders, setShowHeldOrders] = useState(false);

    // ── Fetch qarza on mount ───────────────────────────────────────────────
    useEffect(() => {
        dispatch(fetchQarzaAccounts());
    }, [dispatch]);

    // ── Totals ─────────────────────────────────────────────────────────────
    const subtotal = cart.reduce((acc, it) => acc + it.unitPrice * it.qty, 0);

    // ════════════════════════════════════════════════════════════════════════
    //  HELPERS
    // ════════════════════════════════════════════════════════════════════════
    const getImageUrl = (img) => {
        if (!img) return null;
        if (img.startsWith("http")) return img;
        return `http://localhost:5001${img}`;
    };

    // ════════════════════════════════════════════════════════════════════════
    //  PRODUCT CLICK → BATCH CHECK → CART
    // ════════════════════════════════════════════════════════════════════════
    const handleProductClick = useCallback((product) => {
        const stickyBatch = stickyBatches[product._id];
        if (stickyBatch && stickyBatch.quantity > 0) {
            addItemToCart(product, "full", null, stickyBatch);
            return;
        }
        setSelectedProductForBatch(product);
        setShowBatchModal(true);
    }, [stickyBatches]);

    const handleBatchSelectionConfirm = (prod, batch, isSticky) => {
        addItemToCart(prod, "full", null, batch);
        if (isSticky && batch) {
            setStickyBatches((prev) => ({ ...prev, [prod._id]: batch }));
        } else {
            setStickyBatches((prev) => {
                const next = { ...prev };
                delete next[prod._id];
                return next;
            });
        }
    };

    // ════════════════════════════════════════════════════════════════════════
    //  ADD ITEM TO CART
    // ════════════════════════════════════════════════════════════════════════
    const addItemToCart = (p, portionType = "full", customPriceValue = null, batch = null) => {
        const basePrice = batch ? batch.sellingPrice : p.price;
        let finalUnitPrice = basePrice - (basePrice * (p.discount || 0)) / 100;
        let portion = "full";

        if (portionType === "half") {
            finalUnitPrice = finalUnitPrice / 2;
            portion = "half";
        } else if (portionType === "custom") {
            finalUnitPrice = Number(customPriceValue) || finalUnitPrice;
            portion = "custom";
        }

        setCart((prev) => {
            const match = prev.find(
                (i) =>
                    i._id === p._id &&
                    i.portionType === portion &&
                    i.unitPrice === finalUnitPrice &&
                    i.batchId === (batch?._id || null)
            );

            if (match) {
                return prev.map((i) =>
                    i._id === p._id &&
                        i.portionType === portion &&
                        i.unitPrice === finalUnitPrice &&
                        i.batchId === (batch?._id || null)
                        ? { ...i, qty: i.qty + 1 }
                        : i
                );
            }

            return [
                ...prev,
                {
                    ...p,
                    qty: 1,
                    note: "",
                    unitPrice: finalUnitPrice,
                    image: getImageUrl(p.image),
                    portionType: portion,
                    originalPrice: basePrice - (basePrice * (p.discount || 0)) / 100,
                    batchId: batch?._id || null,
                    batchNumber: batch?.batchNumber || null,
                },
            ];
        });
    };

    // ════════════════════════════════════════════════════════════════════════
    //  CART OPERATIONS
    // ════════════════════════════════════════════════════════════════════════
    const incQty = (id, portionType, unitPrice, batchId) =>
        setCart((prev) =>
            prev.map((i) =>
                i._id === id && i.portionType === portionType &&
                    i.unitPrice === unitPrice && i.batchId === batchId
                    ? { ...i, qty: i.qty + 1 }
                    : i
            )
        );

    const decQty = (id, portionType, unitPrice, batchId) =>
        setCart((prev) =>
            prev
                .map((i) =>
                    i._id === id && i.portionType === portionType &&
                        i.unitPrice === unitPrice && i.batchId === batchId
                        ? { ...i, qty: i.qty - 1 }
                        : i
                )
                .filter((i) => i.qty > 0)
        );

    const removeFromCart = (id, portionType, unitPrice, batchId) =>
        setCart((prev) =>
            prev.filter(
                (i) =>
                    !(i._id === id && i.portionType === portionType &&
                        i.unitPrice === unitPrice && i.batchId === batchId)
            )
        );

    const setCustomQty = (id, portionType, unitPrice, batchId, value) => {
        if (value < 1) return;
        setCart((prev) =>
            prev.map((i) =>
                i._id === id && i.portionType === portionType &&
                    i.unitPrice === unitPrice && i.batchId === batchId
                    ? { ...i, qty: value }
                    : i
            )
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    // ════════════════════════════════════════════════════════════════════════
    //  PORTION MODAL (edit cart item)
    // ════════════════════════════════════════════════════════════════════════
    const openEditModal = (item, index) => {
        setSelectedProductForPortion(item);
        setEditingCartIndex(index);
        setSelectedPortionType(item.portionType || "full");
        setCustomPrice(item.portionType === "custom" ? item.unitPrice : "");
        setShowPortionModal(true);
    };

    const handlePortionConfirm = () => {
        if (!selectedProductForPortion || editingCartIndex === null) return;

        if (selectedPortionType === "custom" && (!customPrice || Number(customPrice) <= 0)) {
            showError(language === "en" ? "Please enter a valid custom price." : "براہ کرم ایک درست کسٹم قیمت درج کریں۔");
            return;
        }

        setCart((prev) => {
            const newCart = [...prev];
            const itemToEdit = newCart[editingCartIndex];
            const currentQty = itemToEdit.qty;

            let finalUnitPrice =
                itemToEdit.originalPrice ||
                itemToEdit.price - (itemToEdit.price * (itemToEdit.discount || 0)) / 100;

            if (selectedPortionType === "half") finalUnitPrice = finalUnitPrice / 2;
            else if (selectedPortionType === "custom") finalUnitPrice = Number(customPrice);

            newCart.splice(editingCartIndex, 1);

            const existingIndex = newCart.findIndex(
                (i) =>
                    i._id === itemToEdit._id &&
                    i.portionType === selectedPortionType &&
                    i.unitPrice === finalUnitPrice &&
                    i.batchId === itemToEdit.batchId
            );

            if (existingIndex > -1) {
                newCart[existingIndex].qty += currentQty;
            } else {
                newCart.push({
                    ...itemToEdit,
                    portionType: selectedPortionType,
                    unitPrice: finalUnitPrice,
                    qty: currentQty,
                });
            }

            return newCart;
        });

        setShowPortionModal(false);
        setSelectedProductForPortion(null);
        setEditingCartIndex(null);
        setCustomPrice("");
    };

    // ════════════════════════════════════════════════════════════════════════
    //  HOLD ORDER
    // ════════════════════════════════════════════════════════════════════════
    const handleHoldOrder = async ({ customerName, selectedWaiter, orderDiscount, paymentMethod, selectedQarzaAccountId, cashReceived }) => {
        if (!cart.length) return showError(language === "en" ? "Cart is empty!" : "کارٹ خالی ہے!");

        try {
            const { data } = await api.get("/orders/generate-number");
            const discountAmt = Math.max(0, Number(orderDiscount) || 0);
            const total = Math.max(0, subtotal - discountAmt);
            const change = Math.max(0, (Number(cashReceived) || 0) - total);

            const body = {
                createdAt: new Date().toISOString(),
                orderNumber: data.orderNumber,
                subtotal,
                discountAmount: discountAmt,
                totalAmount: total,
                items: buildOrderItems(),
                customerName,
                paymentMethod,
                waiter: selectedWaiter,
                cashReceived: Number(cashReceived) || 0,
                change,
                qarzaAccount: paymentMethod === "credit" ? selectedQarzaAccountId || undefined : undefined,
                status: "held",
            };

            await addOrderMutation.mutateAsync(body);
            clearCart();
            showSuccess(language === "en" ? "Order held successfully!" : "آرڈر کامیابی کے ساتھ روک دیا گیا!");
            setShowPaymentModal(false);
        } catch {
            showError("Failed to hold order");
        }
    };

    // ════════════════════════════════════════════════════════════════════════
    //  RESUME HELD ORDER
    // ════════════════════════════════════════════════════════════════════════
    const handleResumeOrder = (order) => {
        if (!order.items?.length) {
            showError(language === "en" ? "No items in this held order!" : "اس زیر التواء آرڈر میں کوئی آئٹمز نہیں ہیں!");
            return;
        }

        const items = (order.items || []).map((it) => {
            const product = products.find((p) => p._id === it.product);
            return {
                _id: it.productId || it.product || it._id,
                name: it.name,
                qty: it.qty || it.quantity || 1,
                unitPrice: it.unitPrice || it.price || 0,
                originalPrice: it.originalPrice || it.unitPrice,
                image: getImageUrl(product?.image),
                portionType: it.portionType || "full",
            };
        });

        setCart(items);
        setShowHeldOrders(false);

        (async () => {
            try { await deleteOrderMutation.mutateAsync(order._id || order.id); } catch { }
        })();
    };

    const handleDeleteHeld = async (id) => {
        try {
            const order = heldOrders.find((o) => (o._id || o.id) === id);
            await deleteOrderMutation.mutateAsync(id);
            if (order?.paymentMethod === "credit") dispatch(fetchQarzaAccounts());
        } catch { }
    };

    // ════════════════════════════════════════════════════════════════════════
    //  CHECKOUT (called from PaymentModal)
    // ════════════════════════════════════════════════════════════════════════
    const handleCheckout = async ({
        customerName,
        selectedWaiter,
        orderDiscount,
        paymentMethod,       // "cash" | "online" | "credit" | "hybrid"
        selectedQarzaAccountId,
        cashReceived,
        onlinePlatform,
        onlineAmount,
        hybridCash,
        hybridQarza,
        hybridQarzaAccountId,
    }) => {
        if (!cart.length) return showError(language === "en" ? "Cart is empty!" : "کارٹ خالی ہے!");

        try {
            const { data } = await api.get("/orders/generate-number");
            const discountAmt = Math.max(0, Number(orderDiscount) || 0);
            const total = Math.max(0, subtotal - discountAmt);
            const change = Math.max(0, (Number(cashReceived) || 0) - total);

            const orderBody = {
                createdAt: new Date().toISOString(),
                orderNumber: data.orderNumber,
                subtotal,
                discountAmount: discountAmt,
                totalAmount: total,
                items: buildOrderItems(),
                waiter: selectedWaiter,
                customerName: paymentMethod === "credit" ? undefined : customerName,
                paymentMethod,
                // Cash
                cashReceived: paymentMethod === "cash" ? Number(cashReceived) || 0 : 0,
                change: paymentMethod === "cash" ? change : 0,
                // Online
                onlinePlatform: paymentMethod === "online" ? onlinePlatform : undefined,
                onlineAmount: paymentMethod === "online" ? Number(onlineAmount) || 0 : undefined,
                // Qarza (single)
                qarzaAccount: paymentMethod === "credit" ? selectedQarzaAccountId : undefined,
                // Hybrid
                hybridCash: paymentMethod === "hybrid" ? Number(hybridCash) || 0 : undefined,
                hybridQarza: paymentMethod === "hybrid" ? Number(hybridQarza) || 0 : undefined,
                hybridQarzaAccount: paymentMethod === "hybrid" ? hybridQarzaAccountId : undefined,
                status: "completed",
            };

            const res = await addOrderMutation.mutateAsync(orderBody);

            // Build print object
            const selectedAccount = qarzaAccounts.find((a) => a._id === selectedQarzaAccountId);
            const orderToPrint = {
                ...orderBody,
                ...res.order,
                orderNumber: res.order?.orderNumber || orderBody.orderNumber,
                createdAt: res.order?.createdAt || orderBody.createdAt,
                qarzaAccount:
                    paymentMethod === "credit" && selectedAccount
                        ? { _id: selectedAccount._id, name: selectedAccount.name }
                        : undefined,
            };
            printOrder(orderToPrint);

            clearCart();
            setShowPaymentModal(false);
            dispatch(fetchQarzaAccounts());
            refetchProducts();
        } catch (err) {
            showError(err?.message || "Failed to create order");
        }
    };

    // ════════════════════════════════════════════════════════════════════════
    //  SPLIT BILL PRINT
    // ════════════════════════════════════════════════════════════════════════
    const handleSplitBill = (count, orderDiscount = 0) => {
        if (!cart.length) return showError(language === "en" ? "Cart is empty!" : "کارٹ خالی ہے!");
        if (!count || count <= 0) return showError(language === "en" ? "Enter valid number of people!" : "درست افراد کی تعداد درج کریں!");

        const discountAmt = Math.max(0, Number(orderDiscount) || 0);
        const total = Math.max(0, subtotal - discountAmt);
        const perPerson = total / count;

        const html = `
          <html><head><title>Split Bill</title>
          <style>
            body{font-family:Arial;padding:12px}
            .center{text-align:center}
            table{width:100%;border-collapse:collapse}
            td,th{padding:6px;border-bottom:1px solid #ddd}
            .right{text-align:right}
          </style>
          </head><body>
            <h2 class="center">Split Bill</h2>
            <p>Date: ${new Date().toLocaleString()}</p>
            <p>Total: Rs ${total.toFixed(0)}</p>
            <p>Split into ${count} parts</p>
            <h3 class="center">Each: Rs ${perPerson.toFixed(0)}</h3>
            <hr/>
            <p class="center">Thank you!</p>
          </body></html>
        `;
        const w = window.open("", "PRINT", "height=600,width=400");
        if (!w) return showError("Please allow popups for printing.");
        w.document.write(html);
        w.document.close();
        w.focus();
        setTimeout(() => w.print(), 200);
        setShowSplitModal(false);
    };

    // ════════════════════════════════════════════════════════════════════════
    //  FREE FOOD
    // ════════════════════════════════════════════════════════════════════════
    const handleFreeFood = async (managerCode, customerName = "", selectedWaiter = "") => {
        if (!cart.length) return showError(language === "en" ? "Cart is empty!" : "کارٹ خالی ہے!");
        if (!managerCode.trim()) return showError(language === "en" ? "Enter Manager Code!" : "منیجر کا کوڈ درج کریں!");

        try {
            const response = await api.post("/settings/verify-manager", { code: managerCode });
            if (response.data.status === "error") return showError(response.data.data.message);

            showSuccess(response.data.data);
            const { data } = await api.get("/orders/generate-number");

            const orderBody = {
                createdAt: new Date().toISOString(),
                orderNumber: data.orderNumber,
                subtotal,
                discountAmount: subtotal,
                totalAmount: 0,
                items: buildOrderItems(),
                customerName: customerName || "N/A",
                note: "FREE FOOD (Manager Approved)",
                paymentMethod: "free",
                waiter: selectedWaiter,
                status: "completed",
            };

            const res = await addOrderMutation.mutateAsync(orderBody);
            const orderToPrint = { ...orderBody, ...res.order, orderNumber: res.order?.orderNumber || data.orderNumber };
            printOrder(orderToPrint, "Free Food");

            clearCart();
            setShowFreeFoodModal(false);
            refetchProducts();
        } catch { }
    };

    // ════════════════════════════════════════════════════════════════════════
    //  HELPERS — build order items array
    // ════════════════════════════════════════════════════════════════════════
    const buildOrderItems = () =>
        cart.map((i) => ({
            product: i._id,
            name: i.name,
            quantity: i.qty,
            unitPrice: i.unitPrice,
            lineTotal: i.unitPrice * i.qty,
            originalPrice: i.originalPrice || i.unitPrice,
            portionType: i.portionType || "full",
            batchId: i.batchId || null,
            batchNumber: i.batchNumber || null,
        }));

    // ════════════════════════════════════════════════════════════════════════
    //  HOTKEY: Shift+Enter → open payment modal
    // ════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        const handler = (e) => {
            if (e.shiftKey && e.key === "Enter") {
                if (cart.length) setShowPaymentModal(true);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [cart]);

    // ════════════════════════════════════════════════════════════════════════
    //  RENDER
    // ════════════════════════════════════════════════════════════════════════
    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">

            {/* ── Left: Product Table ─────────────────────────────────── */}
            <main className="flex-1 flex flex-col overflow-hidden p-4 gap-3">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-cyan-700 tracking-tight">
                        Point of Sale
                    </h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowHeldOrders(true)}
                            className="px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-lg border border-amber-200 hover:bg-amber-200 transition font-medium"
                        >
                            Held Orders ({heldOrders.length})
                        </button>
                        <button
                            onClick={() => setShowFreeFoodModal(true)}
                            className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg border border-green-200 hover:bg-green-200 transition font-medium"
                        >
                            Free Food
                        </button>
                        <button
                            onClick={() => setShowSplitModal(true)}
                            className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-200 transition font-medium"
                        >
                            Split Bill
                        </button>
                    </div>
                </div>

                {/* ── PaginatedTable: products, row click → add to cart ── */}
                <div className="flex-1 overflow-auto bg-white rounded-2xl shadow-sm border border-gray-100">
                    <PaginatedTable
                        endpoint="/products/pagination"
                        columns={columns}
                        limit={20}
                        onRowClick={handleProductClick}
                        rtkGetDataQuery={useProducts}
                    // No isUpdate / isDelete
                    />
                </div>
            </main>

            {/* ── Right: Cart Sidebar ──────────────────────────────────── */}
            <PosCartSidebar
                cart={cart}
                subtotal={subtotal}
                incQty={incQty}
                decQty={decQty}
                removeFromCart={removeFromCart}
                setCustomQty={setCustomQty}
                openEditModal={openEditModal}
                onCheckout={() => setShowPaymentModal(true)}
                showHeldOrders={showHeldOrders}
                setShowHeldOrders={setShowHeldOrders}
                heldOrders={heldOrders}
                orderHistory={orderHistory}
                handleResumeOrder={handleResumeOrder}
                handleDeleteHeld={handleDeleteHeld}
                user={user}
                language={language}
            />

            {/* ══════════════════════════════════════════════════════════
                MODALS
            ══════════════════════════════════════════════════════════ */}

            {/* Payment Modal */}
            {showPaymentModal && (
                <PosPaymentModal
                    subtotal={subtotal}
                    qarzaAccounts={qarzaAccounts}
                    onCheckout={handleCheckout}
                    onHold={handleHoldOrder}
                    onClose={() => setShowPaymentModal(false)}
                    onCreateQarza={() => setShowQarza(true)}
                    language={language}
                />
            )}

            {/* Portion Modal */}
            {showPortionModal && (
                <PortionModal
                    product={selectedProductForPortion}
                    selectedPortionType={selectedPortionType}
                    setSelectedPortionType={setSelectedPortionType}
                    customPrice={customPrice}
                    setCustomPrice={setCustomPrice}
                    onClose={() => setShowPortionModal(false)}
                    onConfirm={handlePortionConfirm}
                    language={language}
                />
            )}

            {/* Batch Selection Modal */}
            {showBatchModal && (
                <BatchSelectionModal
                    product={selectedProductForBatch}
                    initialIsSticky={!!stickyBatches[selectedProductForBatch?._id]}
                    onClose={() => setShowBatchModal(false)}
                    onConfirm={handleBatchSelectionConfirm}
                    language={language}
                />
            )}

            {/* Split Bill Modal */}
            {showSplitModal && (
                <SplitBillModal
                    onClose={() => setShowSplitModal(false)}
                    onConfirm={(count) => handleSplitBill(count)}
                    language={language}
                />
            )}

            {/* Free Food Modal */}
            {showFreeFoodModal && (
                <FreeFoodModal
                    onClose={() => setShowFreeFoodModal(false)}
                    onConfirm={handleFreeFood}
                    language={language}
                />
            )}

            {/* Qarza Account Creation */}
            {showQarza && (
                <QarzaAccountCreation
                    setQarzaAccountCreationFormPopupVisibility={setShowQarza}
                    type="personal"
                    onCreated={(newAccount) => {
                        // Inject into local state immediately without waiting for Redux refetch
                        setLocalQarzaAccounts((prev) => [...prev, newAccount]);
                        dispatch(fetchQarzaAccounts());
                    }}
                />
            )}

            {/* Held Orders Overlay */}
            {showHeldOrders && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/20 backdrop-blur-sm"
                    onClick={() => setShowHeldOrders(false)}
                />
            )}
        </div>
    );
}