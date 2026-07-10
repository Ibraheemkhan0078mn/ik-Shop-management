import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  useQarzaAccounts,
  useCreateQarzaPayment
} from "../../qarza/services/qarza.service.js";
import { useAddOrder } from "../../orders/services/orders.service.js";
import {
  useHoldOrders,
  useCreateHoldOrder,
  useDeleteHoldOrder,
  useUpdateHoldOrder
} from "../services/holdOrders.service.js";
import { useProducts } from "../../productsModule/services/product.service.js";
import { getPosLabels } from "../labels/posLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import api from "../../../shared/services/api.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import PosCartSidebar from "../components/PosCartSidebar.jsx";
import PosPaymentModal from "../components/PosPayemntModel.jsx";
import BatchSelectionModal from "../components/BatchSelectionModal.jsx";
import PortionModal from "../components/PortionModal.jsx";
import PosFilterSidebar from "../components/PosFilterSidebar.jsx";
import QarzaAccountCreation from "../../qarza/components/QarzaCreation.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import { printOrder } from "../../../shared/utilities/printOrder.js";
import { toImageUrl } from "../../../shared/utilities/image.utility.js";
import { ArrowLeft, ClipboardList, RotateCcw, History, Filter } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const isSameCartLine = (cartItem, productId, portionType, unitPrice, batchId) =>
  cartItem._id === productId &&
  cartItem.portionType === portionType &&
  cartItem.unitPrice === unitPrice &&
  cartItem.batchId === batchId;

const buildOrderItemsFromCart = (cart) =>
  cart.map((cartItem) => ({
    product: cartItem._id,
    name: cartItem.name,
    quantity: cartItem.qty,
    unitPrice: cartItem.unitPrice,
    lineTotal: cartItem.unitPrice * cartItem.qty,
    originalPrice: cartItem.originalPrice ?? cartItem.unitPrice,
    portionType: cartItem.portionType || "full",
    batchId: cartItem.batchId ?? null,
    batchNumber: cartItem.batchNumber ?? null,
  }));

// ─── Product Table Row ────────────────────────────────────────────────────────

const ProductTableRow = ({ product, onAddToCart }) => {
  const imageUrl = toImageUrl(product.image);

  return (
    <tr
      onClick={onAddToCart}
      className="border-b border-[var(--border)] hover:bg-[var(--app-bg)] cursor-pointer transition-colors group"
    >
      <td className="p-2 w-10">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-9 h-9 object-cover rounded-lg bg-[var(--app-bg)]"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-[var(--app-bg)] flex items-center justify-center text-[var(--muted)] text-[10px]">
            N/A
          </div>
        )}
      </td>
      <td className="p-2">
        <p className="text-sm font-semibold text-[var(--ink)] leading-tight">{product.name}</p>
        {product.category?.name && (
          <p className="text-xs text-[var(--muted)] mt-0.5">{product.category.name}</p>
        )}
      </td>
      <td className="p-2 text-sm font-bold text-[var(--accent-2)] whitespace-nowrap">
        Rs {(Number(product.price) || 0).toLocaleString()}
      </td>
      <td className="p-2 text-sm text-[var(--muted)] text-center">
        {product.currentStockLevel ?? 0}
      </td>
    </tr>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PosPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const language = settings?.language || "en";
  const labels = getPosLabels(language);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authUser = useSelector((state) => state.auth);
  const currentUser = authUser?.role
    ? authUser
    : { role: "admin", permissions: { deleteOrders: true } };
  const isUrdu = language !== "en";

  // ── Cart State ────────────────────────────────────────────────────────────
  const [cartItems, setCartItems] = useState([]);
  const [resumedHoldOrderId, setResumedHoldOrderId] = useState(null);
  const [resumedHoldMeta, setResumedHoldMeta] = useState({
    customerName: "",
    waiter: "",
    discountAmount: 0,
    staffId: "",
  });
  const [stickyBatchByProductId, setStickyBatchByProductId] = useState({});
  const [localQarzaAccounts, setLocalQarzaAccounts] = useState([]);

  // ── Modal State ───────────────────────────────────────────────────────────
  const [openModals, setOpenModals] = useState({
    batchSelection: false,
    portionEdit: false,
    payment: false,
    newQarzaAccount: false,
    heldOrders: false,
  });

  // ── Filter State ───────────────────────────────────────────────────────────
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(true);
  const [activeFilters, setActiveFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [uniqueBrands, setUniqueBrands] = useState([]);

  const toggleModal = (modalName) =>
    setOpenModals((prev) => ({ ...prev, [modalName]: !prev[modalName] }));

  const [batchSelectionProduct, setBatchSelectionProduct] = useState(null);
  const [portionEditState, setPortionEditState] = useState({
    cartItem: null,
    cartIndex: null,
    selectedPortionType: "full",
    customPriceInput: "",
  });

  // ── API Queries ───────────────────────────────────────────────────────────
  const { data: heldOrdersResponse } = useHoldOrders();
  const heldOrders = heldOrdersResponse?.data || heldOrdersResponse || [];

  const { data: fetchedQarzaAccounts = [], refetch: refetchQarzaAccounts } = useQarzaAccounts();
  const qarzaAccounts = localQarzaAccounts.length ? localQarzaAccounts : fetchedQarzaAccounts;

  // ── Filter Handlers ───────────────────────────────────────────────────────
  const handleFiltersChange = useCallback((newFilters) => {
    setActiveFilters(newFilters);
  }, []);

  // ── API Mutations ─────────────────────────────────────────────────────────
  const [addOrder] = useAddOrder();
  const [createHoldOrder] = useCreateHoldOrder();
  const [updateHoldOrder] = useUpdateHoldOrder();
  const [deleteHoldOrder] = useDeleteHoldOrder();
  const [createQarzaPayment] = useCreateQarzaPayment();

  // ── Computed Values ───────────────────────────────────────────────────────
  const cartSubtotal = cartItems.reduce(
    (sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.qty) || 0),
    0
  );

  // ── Keyboard Shortcut ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleShiftEnter = (e) => {
      if (e.shiftKey && e.key === "Enter" && cartItems.length) toggleModal("payment");
    };
    window.addEventListener("keydown", handleShiftEnter);
    return () => window.removeEventListener("keydown", handleShiftEnter);
  }, [cartItems]);

  // ── Cart Actions ──────────────────────────────────────────────────────────
  const incrementQty = (productId, portionType, unitPrice, batchId) =>
    setCartItems((prev) =>
      prev.map((item) =>
        isSameCartLine(item, productId, portionType, unitPrice, batchId)
          ? { ...item, qty: item.qty + 1 }
          : item
      )
    );

  const decrementQty = (productId, portionType, unitPrice, batchId) =>
    setCartItems((prev) =>
      prev
        .map((item) =>
          isSameCartLine(item, productId, portionType, unitPrice, batchId)
            ? { ...item, qty: item.qty - 1 }
            : item
        )
        .filter((item) => item.qty > 0)
    );

  const removeCartItem = (productId, portionType, unitPrice, batchId) =>
    setCartItems((prev) =>
      prev.filter((item) => !isSameCartLine(item, productId, portionType, unitPrice, batchId))
    );

  const setCartItemQty = (productId, portionType, unitPrice, batchId, newQty) => {
    if (newQty < 1) return;
    setCartItems((prev) =>
      prev.map((item) =>
        isSameCartLine(item, productId, portionType, unitPrice, batchId)
          ? { ...item, qty: newQty }
          : item
      )
    );
  };

  const clearCart = () => setCartItems([]);

  // ── Add to Cart ───────────────────────────────────────────────────────────
  const addProductToCart = (product, portionType = "full", customPrice = null, selectedBatch = null) => {
    const basePrice = Number(selectedBatch?.sellingPrice || product.price) || 0;
    const discountPercent = Number(product.discount) || 0;
    const priceAfterDiscount = basePrice - (basePrice * discountPercent) / 100;

    let finalUnitPrice = priceAfterDiscount;
    if (portionType === "half") finalUnitPrice = priceAfterDiscount / 2;
    if (portionType === "custom") finalUnitPrice = Number(customPrice) || priceAfterDiscount;

    const batchId = selectedBatch?._id || null;

    setCartItems((prev) => {
      const existingLine = prev.find((item) =>
        isSameCartLine(item, product._id, portionType, finalUnitPrice, batchId)
      );
      if (existingLine) {
        return prev.map((item) =>
          isSameCartLine(item, product._id, portionType, finalUnitPrice, batchId)
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          ...product,
          qty: 1,
          unitPrice: finalUnitPrice,
          originalPrice: priceAfterDiscount,
          image: toImageUrl(product.image),
          portionType,
          batchId,
          batchNumber: selectedBatch?.batchNumber || null,
        },
      ];
    });
  };

  const handleProductClick = useCallback(
    async (product) => {
      const stickyBatch = stickyBatchByProductId[product._id];
      if (stickyBatch?.quantity > 0) {
        addProductToCart(product, "full", null, stickyBatch);
        return;
      }

      try {
        const { data } = await api.get(`/batches/${product._id}`);
        const availableBatches = data?.data || data || [];

        if (!availableBatches.length) {
          showError(
            isUrdu
              ? "کوئی بیچ دستیاب نہیں۔ پہلے خریداری کریں۔"
              : "No batches available. Please create a purchase first."
          );
          return;
        }

        if (availableBatches.length === 1) {
          addProductToCart(product, "full", null, availableBatches[0]);
        } else {
          setBatchSelectionProduct(product);
          toggleModal("batchSelection");
        }
      } catch {
        showError(isUrdu ? "بیچ لوڈ کرنے میں ناکام۔" : "Failed to load batches.");
      }
    },
    [stickyBatchByProductId, language]
  );

  const handleBatchSelected = (product, selectedBatch, shouldMakeStickyBatch) => {
    addProductToCart(product, "full", null, selectedBatch);
    if (shouldMakeStickyBatch && selectedBatch) {
      setStickyBatchByProductId((prev) => ({ ...prev, [product._id]: selectedBatch }));
    } else {
      setStickyBatchByProductId((prev) => {
        const next = { ...prev };
        delete next[product._id];
        return next;
      });
    }
  };

  // ── Portion Edit ──────────────────────────────────────────────────────────
  const openPortionEditModal = (cartItem, cartIndex) => {
    setPortionEditState({
      cartItem,
      cartIndex,
      selectedPortionType: cartItem.portionType || "full",
      customPriceInput: cartItem.portionType === "custom" ? String(cartItem.unitPrice) : "",
    });
    toggleModal("portionEdit");
  };

  const handlePortionEditConfirmed = () => {
    const { cartItem, cartIndex, selectedPortionType, customPriceInput } = portionEditState;
    if (!cartItem || cartIndex === null) return;

    if (selectedPortionType === "custom" && (!customPriceInput || Number(customPriceInput) <= 0)) {
      showError(isUrdu ? "درست کسٹم قیمت درج کریں۔" : "Enter a valid custom price.");
      return;
    }

    setCartItems((prev) => {
      const updated = [...prev];
      const targetItem = updated[cartIndex];
      const savedQty = targetItem.qty;
      const basePrice = Number(targetItem.originalPrice) || Number(targetItem.unitPrice) || 0;

      let newUnitPrice = basePrice;
      if (selectedPortionType === "half") newUnitPrice = basePrice / 2;
      if (selectedPortionType === "custom") newUnitPrice = Number(customPriceInput);

      updated.splice(cartIndex, 1);

      const duplicateIndex = updated.findIndex(
        (item) =>
          item._id === targetItem._id &&
          item.portionType === selectedPortionType &&
          item.unitPrice === newUnitPrice &&
          item.batchId === targetItem.batchId
      );

      if (duplicateIndex > -1) {
        updated[duplicateIndex].qty += savedQty;
      } else {
        updated.push({ ...targetItem, portionType: selectedPortionType, unitPrice: newUnitPrice, qty: savedQty });
      }
      return updated;
    });

    toggleModal("portionEdit");
    setPortionEditState({ cartItem: null, cartIndex: null, selectedPortionType: "full", customPriceInput: "" });
  };

  // ── Hold Order ────────────────────────────────────────────────────────────
  const handleHoldCurrentOrder = async () => {
    if (!cartItems.length) {
      showError(isUrdu ? "کارٹ خالی ہے!" : "Cart is empty!");
      return;
    }

    try {
      const discountAmount = Math.max(0, Number(resumedHoldMeta.discountAmount) || 0);
      const totalAmount = Math.max(0, cartSubtotal - discountAmount);

      const holdPayload = {
        items: buildOrderItemsFromCart(cartItems),
        subtotal: cartSubtotal,
        discountAmount,
        totalAmount,
        customerName: resumedHoldMeta.customerName || "",
        waiter: resumedHoldMeta.waiter || "",
        staffId: resumedHoldMeta.staffId || "",
      };

      if (resumedHoldOrderId) {
        await updateHoldOrder({ id: resumedHoldOrderId, body: holdPayload }).unwrap();
      } else {
        const { data } = await api.get("/orders/generate-number");
        await createHoldOrder({ orderNumber: data.orderNumber, ...holdPayload }).unwrap();
      }

      clearCart();
      setResumedHoldOrderId(null);
      setResumedHoldMeta({ customerName: "", waiter: "", discountAmount: 0, staffId: "" });
      showSuccess(isUrdu ? "آرڈر روک دیا گیا!" : "Order held!");
    } catch (err) {
      console.error("Hold order error:", err);
      showError(err?.message || "Failed to hold order.");
    }
  };

  const handleResumeHeldOrder = (heldOrder) => {
    if (!heldOrder.items?.length) {
      showError(isUrdu ? "اس آرڈر میں آئٹمز نہیں ہیں!" : "No items in this order!");
      return;
    }

    if (
      cartItems.length &&
      !window.confirm(
        isUrdu
          ? "آپ کے موجودہ کارٹ میں آئٹمز ہیں۔ جاری رکھنے سے وہ ہٹ جائیں گے۔ جاری رکھیں؟"
          : "Your current cart has items. Resuming will replace them. Continue?"
      )
    ) return;

    const restoredCartItems = heldOrder.items.map((orderItem) => {
      return {
        _id: String(orderItem.product),
        name: orderItem.name,
        qty: orderItem.quantity ?? 1,
        unitPrice: Number(orderItem.unitPrice) ?? 0,
        originalPrice: Number(orderItem.originalPrice) ?? Number(orderItem.unitPrice) ?? 0,
        image: orderItem.image ? toImageUrl(orderItem.image) : null,
        portionType: orderItem.portionType || "full",
        batchId: orderItem.batchId ?? null,
        batchNumber: orderItem.batchNumber ?? null,
      };
    });

    setCartItems(restoredCartItems);
    setResumedHoldOrderId(heldOrder._id);
    setResumedHoldMeta({
      customerName: heldOrder.customerName || "",
      waiter: heldOrder.waiter || "",
      discountAmount: heldOrder.discountAmount || 0,
      staffId: heldOrder.staffId || "",
    });
    toggleModal("heldOrders");
  };

  const handleDeleteHeldOrder = async (heldOrderId) => {
    try {
      await deleteHoldOrder(heldOrderId).unwrap();
      showSuccess(isUrdu ? "روکا ہوا آرڈر حذف ہو گیا" : "Held order deleted");
    } catch (err) {
      showError(err?.data?.message || err?.message || "Failed to delete held order");
    }
  };

  // ── Checkout ──────────────────────────────────────────────────────────────
  const handleCheckoutConfirmed = async (paymentFormData) => {
    if (!cartItems.length) {
      showError(isUrdu ? "کارٹ خالی ہے!" : "Cart is empty!");
      return;
    }

    const {
      customerName,
      selectedWaiter,
      selectedStaffId,
      orderDiscount,
      paymentMethod,
      selectedQarzaAccountId,
      cashReceived,
      onlinePlatform,
      onlineAmount,
      hybridCash,
      hybridQarza,
      hybridQarzaAccountId,
      orderType,
      customerType,
      selectedCustomerId,
    } = paymentFormData;

    try {
      const { data: orderNumberData } = await api.get("/orders/generate-number");
      const discountAmount = Math.max(0, Number(orderDiscount) || 0);
      const totalAmount = Math.max(0, cartSubtotal - discountAmount);
      const changeReturned = Math.max(0, (Number(cashReceived) || 0) - totalAmount);

      const orderPayload = {
        orderNumber: orderNumberData.orderNumber,
        createdAt: new Date().toISOString(),
        subtotal: cartSubtotal,
        discountAmount,
        totalAmount,
        items: buildOrderItemsFromCart(cartItems),
        customerName: paymentMethod === "credit" ? "" : customerName,
        customerType,
        customerId: customerType === "regular" ? selectedCustomerId : null,
        waiter: selectedWaiter,
        staffId: selectedStaffId || null,
        paymentMethod,
        orderType: orderType || "retail",
        status: "completed",
        cashReceived: paymentMethod === "cash" ? Number(cashReceived) || 0 : 0,
        change: paymentMethod === "cash" ? changeReturned : 0,
        onlinePlatform: paymentMethod === "online" ? onlinePlatform : "",
        onlineAmount: paymentMethod === "online" ? Number(onlineAmount) || 0 : 0,
        qarzaAccount: paymentMethod === "credit" ? selectedQarzaAccountId : null,
        hybridCash: paymentMethod === "hybrid" ? Number(hybridCash) || 0 : 0,
        hybridQarza: paymentMethod === "hybrid" ? Number(hybridQarza) || 0 : 0,
        hybridQarzaAccount: paymentMethod === "hybrid" ? hybridQarzaAccountId : null,
        isPosOrder: true,
      };

      const { order: createdOrder } = await addOrder(orderPayload).unwrap();

      // Record qarza (credit) payments
      if (paymentMethod === "credit" && selectedQarzaAccountId) {
        try {
          await createQarzaPayment({
            qarzaAccountId: selectedQarzaAccountId,
            amount: totalAmount,
            type: "debit",
            date: new Date().toISOString(),
            notes: `POS Order: ${createdOrder.orderNumber} - ${customerName || "Customer"}`,
            orderId: createdOrder._id,
            orderNumber: createdOrder.orderNumber,
            source: "pos",
          }).unwrap();
        } catch (qarzaErr) {
          console.error("Qarza payment error:", qarzaErr);
          showError("Order created but failed to record qarza payment");
        }
      }

      if (paymentMethod === "hybrid" && hybridQarzaAccountId && Number(hybridQarza) > 0) {
        try {
          await createQarzaPayment({
            qarzaAccountId: hybridQarzaAccountId,
            amount: Number(hybridQarza),
            type: "debit",
            date: new Date().toISOString(),
            notes: `POS Order (Hybrid): ${createdOrder.orderNumber} - Cash: Rs ${hybridCash}, Qarza: Rs ${hybridQarza} - ${customerName || "Customer"}`,
            orderId: createdOrder._id,
            orderNumber: createdOrder.orderNumber,
            source: "pos",
          }).unwrap();
        } catch (qarzaErr) {
          console.error("Qarza hybrid payment error:", qarzaErr);
          showError("Order created but failed to record qarza payment");
        }
      }

      // Print receipt
      const creditQarzaAccount = qarzaAccounts?.accounts?.find((a) => a._id === selectedQarzaAccountId);
      printOrder({
        ...orderPayload,
        ...createdOrder,
        orderNumber: createdOrder?.orderNumber || orderPayload.orderNumber,
        createdAt: createdOrder?.createdAt || orderPayload.createdAt,
        qarzaAccount:
          paymentMethod === "credit" && creditQarzaAccount
            ? { _id: creditQarzaAccount._id, name: creditQarzaAccount.name }
            : null,
      });

      // Clean up resumed hold order
      if (resumedHoldOrderId) {
        try {
          await deleteHoldOrder(resumedHoldOrderId).unwrap();
        } catch (err) {
          console.error("Failed to clear held order after checkout:", err);
          showError(
            isUrdu
              ? "آرڈر مکمل ہو گیا لیکن روکا ہوا آرڈر صاف نہیں ہو سکا"
              : "Order completed but failed to clear held order"
          );
        }
        setResumedHoldOrderId(null);
        setResumedHoldMeta({ customerName: "", waiter: "", discountAmount: 0, staffId: "" });
      }

      clearCart();
      toggleModal("payment");
      refetchQarzaAccounts();
      refetchProducts();
      showSuccess(isUrdu ? "آرڈر مکمل ہو گیا!" : "Order completed successfully!");
    } catch (err) {
      console.error("Checkout error:", err);
      const errorMessage = err?.response?.data?.message || err?.data?.message || err?.message || "Failed to create order.";
      showError(errorMessage);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[var(--app-bg)] overflow-hidden">

      {/* ── Left: Filter Sidebar ───────────────────────────────────────────── */}
      {filterSidebarOpen && (
        <PosFilterSidebar
          isOpen={filterSidebarOpen}
          onClose={() => setFilterSidebarOpen(false)}
          onFiltersChange={handleFiltersChange}
          brands={uniqueBrands}
        />
      )}

      {/* ── Middle: Products Panel ─────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4 gap-3">

        {/* Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg transition"
              style={{
                background: "var(--surface-muted)",
                color: "var(--ink)",
                border: "1px solid var(--border)",
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={() => setFilterSidebarOpen(!filterSidebarOpen)}
              className={`p-2 rounded-lg transition ${
                filterSidebarOpen
                  ? "bg-[var(--accent-2)] text-white"
                  : "bg-[var(--surface-muted)] text-[var(--ink)]"
              }`}
              style={{
                border: "1px solid var(--border)",
              }}
            >
              <Filter size={20} />
            </button>
            <h1 className="text-xl font-bold text-[var(--accent-2)] font-display tracking-tight">
              {labels.pointOfSale}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <div onClick={() => toggleModal("heldOrders")}>
              <ScreenTabButton
                lucideIcon={ClipboardList}
                text={`${labels.heldOrders} (${heldOrders.length})`}
              />
            </div>

            <div onClick={() => navigate("/product-return")}>
              <ScreenTabButton
                lucideIcon={RotateCcw}
                text={labels.productReturn}
              />
            </div>

            <div onClick={() => navigate("/order-history")}>
              <ScreenTabButton
                lucideIcon={History}
                text={labels.orderHistory}
              />
            </div>
          </div>



        </div>

        {/* Product Table */}
        <div className="flex-1 overflow-hidden bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)]">
          <PaginatedList
            rtkQuery={useProducts}
            limit={20}
            dataKey="data"
            wrapperClassName="h-full"
            className="p-3"
            queryArgs={{ page: currentPage, limit: 20, ...activeFilters }}
            renderItems={(products) => (
              <div className="flex flex-col h-full">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)]">
                      <th className="p-2 text-left text-xs font-semibold text-[var(--muted)] w-10"></th>
                      <th className="p-2 text-left text-xs font-semibold text-[var(--muted)]">{labels.product}</th>
                      <th className="p-2 text-left text-xs font-semibold text-[var(--muted)]">{labels.price}</th>
                      <th className="p-2 text-center text-xs font-semibold text-[var(--muted)]">{labels.stock}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <ProductTableRow
                        key={product._id}
                        product={product}
                        onAddToCart={() => handleProductClick(product)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          />
        </div>
      </main>

      {/* ── Right: Cart Sidebar ───────────────────────────────────────────── */}
      <PosCartSidebar
        cart={cartItems}
        subtotal={cartSubtotal}
        resumedHoldId={resumedHoldOrderId}
        holdOrders={heldOrders}
        showHeldOrders={openModals.heldOrders}
        setShowHeldOrders={() => toggleModal("heldOrders")}
        user={currentUser}
        incQty={incrementQty}
        decQty={decrementQty}
        removeFromCart={removeCartItem}
        setCartItemQty={setCartItemQty}
        openPortionModal={openPortionEditModal}
        onCheckout={() => toggleModal("payment")}
        onHold={handleHoldCurrentOrder}
        handleResumeOrder={handleResumeHeldOrder}
        handleDeleteHeldOrder={handleDeleteHeldOrder}
      />

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {openModals.payment && (
        <PosPaymentModal
          subtotal={cartSubtotal}
          onCheckout={handleCheckoutConfirmed}
          onClose={() => toggleModal("payment")}
          onCreateQarza={() => toggleModal("newQarzaAccount")}
          language={language}
          initialCustomerName={resumedHoldMeta.customerName}
          initialWaiter={resumedHoldMeta.waiter}
          initialDiscount={resumedHoldMeta.discountAmount}
          initialStaffId={resumedHoldMeta.staffId}
        />
      )}

      {openModals.portionEdit && (
        <PortionModal
          product={portionEditState.cartItem}
          selectedPortionType={portionEditState.selectedPortionType}
          setSelectedPortionType={(type) =>
            setPortionEditState((prev) => ({ ...prev, selectedPortionType: type }))
          }
          customPrice={portionEditState.customPriceInput}
          setCustomPrice={(price) =>
            setPortionEditState((prev) => ({ ...prev, customPriceInput: price }))
          }
          onClose={() => {
            toggleModal("portionEdit");
            setPortionEditState({ cartItem: null, cartIndex: null, selectedPortionType: "full", customPriceInput: "" });
          }}
          onConfirm={handlePortionEditConfirmed}
          language={language}
        />
      )}

      {openModals.batchSelection && (
        <BatchSelectionModal
          product={batchSelectionProduct}
          initialIsSticky={!!stickyBatchByProductId[batchSelectionProduct?._id]}
          onClose={() => toggleModal("batchSelection")}
          onConfirm={handleBatchSelected}
          language={language}
        />
      )}

      {openModals.newQarzaAccount && (
        <QarzaAccountCreation
          setQarzaAccountCreationFormPopupVisibility={() => toggleModal("newQarzaAccount")}
          type="personal"
          onCreated={(newAccount) => {
            setLocalQarzaAccounts((prev) => [...prev, newAccount]);
            refetchQarzaAccounts();
          }}
        />
      )}

      {openModals.heldOrders && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => toggleModal("heldOrders")}
        />
      )}
    </div>
  );
}
















































// import { useEffect, useState, useCallback } from "react";
// import { useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import {
//   useQarzaAccounts,
//   useCreateQarzaPayment
// } from "../../qarza/services/qarza.service.js";
// import { useOrders, useAddOrder } from "../../orders/services/orders.service.js";
// import { useHoldOrders, useCreateHoldOrder, useDeleteHoldOrder, useUpdateHoldOrder } from "../services/holdOrders.service.js";
// import { useProducts } from "../../productsModule/services/product.service.js";
// import api from "../../../shared/services/api.js";
// import PaginatedList from "../../../shared/components/PaginatedList.jsx";
// import PosCartSidebar from "../components/PosCartSidebar.jsx";
// import PosPaymentModal from "../components/PosPayemntModel.jsx";
// import BatchSelectionModal from "../components/BatchSelectionModal.jsx";
// import PortionModal from "../components/PortionModal.jsx";
// import QarzaAccountCreation from "../../qarza/components/QarzaCreation.jsx";
// import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
// import { printOrder } from "../../../shared/utilities/printOrder.js";
// import { ArrowLeft } from "lucide-react";
// import { toImageUrl } from "../../../shared/utilities/image.utility.js";

// // ─── Constants ──────────────────────────────────────────────────────────────
// const isSameLine = (item, id, pt, up, bid) =>
//   item._id === id && item.portionType === pt && item.unitPrice === up && item.batchId === bid;

// const buildOrderItems = (cart) => cart.map(item => ({
//   product: item._id,
//   name: item.name,
//   quantity: item.qty,
//   unitPrice: item.unitPrice,
//   lineTotal: item.unitPrice * item.qty,
//   originalPrice: item.originalPrice ?? item.unitPrice,
//   portionType: item.portionType || "full",
//   batchId: item.batchId ?? null,
//   batchNumber: item.batchNumber ?? null,
// }));

// // ─── Sub-components ─────────────────────────────────────────────────────────
// const ActionButton = ({ onClick, children, className = "" }) => (
//   <button
//     onClick={onClick}
//     className={`px-3 py-1.5 text-sm rounded-lg border transition font-medium ${className}`}
//   >
//     {children}
//   </button>
// );

// const ProductCard = ({ product, onClick }) => {
//   const imageUrl = toImageUrl(product.image);
//   return (
//     <button
//       onClick={onClick}
//       className="flex flex-col items-center gap-1.5 p-3 bg-[var(--surface)] hover:bg-[var(--app-bg)] border border-[var(--border)] hover:border-[var(--accent-2)]
//                  rounded-xl transition-all active:scale-95 text-left w-full"
//     >
//       {imageUrl ? (
//         <img
//           src={imageUrl}
//           alt={product.name}
//           className="w-full aspect-square object-cover rounded-lg bg-[var(--app-bg)]"
//           onError={e => { e.target.style.display = "none"; }}
//         />
//       ) : (
//         <div className="w-full aspect-square rounded-lg bg-[var(--app-bg)] flex items-center justify-center text-[var(--muted)] text-xs">
//           No image
//         </div>
//       )}
//       <p className="text-xs font-semibold text-[var(--ink)] text-center leading-tight line-clamp-2 w-full">
//         {product.name}
//       </p>
//       <p className="text-sm font-bold text-[var(--accent-2)]">Rs {(Number(product.price) || 0).toLocaleString()}</p>
//       <p className="text-xs text-[var(--muted)]">Stock: {product.currentStockLevel ?? 0}</p>
//       {product.category?.name && (
//         <span className="text-[10px] text-[var(--muted)] truncate w-full text-center">{product.category.name}</span>
//       )}
//     </button>
//   );
// };

// // ─── Main Component ──────────────────────────────────────────────────────────
// export default function PosPage() {
//   const navigate = useNavigate();
//   // ── Auth ──────────────────────────────────────────────────────────────────
//   const authUser = useSelector(s => s.auth);
//   const user = authUser?.role ? authUser : { role: "admin", permissions: { deleteOrders: true } };
//   const language = user?.language || "en";

//   // ── State ──────────────────────────────────────────────────────────────────
//   const [cart, setCart] = useState([]);
//   const [resumedHoldId, setResumedHoldId] = useState(null);
//   const [resumedHoldMeta, setResumedHoldMeta] = useState({ customerName: "", waiter: "", discountAmount: 0, staffId: "" });
//   const [stickyBatches, setStickyBatches] = useState({});
//   const [localQarza, setLocalQarza] = useState([]);

//   // ── Modal States ──────────────────────────────────────────────────────────
//   const [modals, setModals] = useState({
//     batch: false, portion: false, payment: false,
//     qarza: false, heldOrders: false,
//   });
//   const toggleModal = (key) => setModals(prev => ({ ...prev, [key]: !prev[key] }));

//   const [batchProduct, setBatchProduct] = useState(null);
//   const [portionState, setPortionState] = useState({
//     item: null, index: null, type: "full", customPrice: ""
//   });

//   // ── RTK Queries ───────────────────────────────────────────────────────────
//   const { data: productsRaw, refetch: refetchProducts } = useProducts();
//   const products = productsRaw?.data || productsRaw || [];

//   const holdOrdersQuery = useHoldOrders();
//   const holdOrders = holdOrdersQuery.data?.data || holdOrdersQuery.data || [];

//   // ── RTK Mutations ─────────────────────────────────────────────────────────
//   const [addOrder] = useAddOrder();
//   const [createHold] = useCreateHoldOrder();
//   const [updateHold] = useUpdateHoldOrder();
//   const [deleteHold] = useDeleteHoldOrder();
//   const [createQarzaPayment] = useCreateQarzaPayment();

//   // ── Qarza ──────────────────────────────────────────────────────────────────
//   const { data: fetchedQarza = [], refetch: refetchQarza } = useQarzaAccounts();
//   const qarzaAccounts = localQarza.length ? localQarza : fetchedQarza;

//   // ── Computed ──────────────────────────────────────────────────────────────
//   const subtotal = cart.reduce((sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.qty) || 0), 0);

//   // ── Effects ───────────────────────────────────────────────────────────────
//   useEffect(() => {
//     const onKey = e => { if (e.shiftKey && e.key === "Enter" && cart.length) toggleModal("payment"); };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [cart]);

//   // ── Cart Actions ──────────────────────────────────────────────────────────
//   const incQty = (id, pt, up, bid) =>
//     setCart(prev => prev.map(i => isSameLine(i, id, pt, up, bid) ? { ...i, qty: i.qty + 1 } : i));

//   const decQty = (id, pt, up, bid) =>
//     setCart(prev => prev.map(i => isSameLine(i, id, pt, up, bid) ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0));

//   const removeFromCart = (id, pt, up, bid) =>
//     setCart(prev => prev.filter(i => !isSameLine(i, id, pt, up, bid)));

//   const setCartItemQty = (id, pt, up, bid, val) => {
//     if (val < 1) return;
//     setCart(prev => prev.map(i => isSameLine(i, id, pt, up, bid) ? { ...i, qty: val } : i));
//   };

//   const clearCart = () => setCart([]);

//   // ── Add to Cart ──────────────────────────────────────────────────────────
//   const addItemToCart = (product, portionType = "full", customPriceValue = null, batch = null) => {
//     const basePrice = Number(batch?.sellingPrice || product.price) || 0;
//     const discount = Number(product.discount) || 0;
//     const priceAfterDisc = basePrice - (basePrice * discount) / 100;

//     let finalPrice = priceAfterDisc;
//     if (portionType === "half") finalPrice = priceAfterDisc / 2;
//     if (portionType === "custom") finalPrice = Number(customPriceValue) || priceAfterDisc;

//     const batchId = batch?._id || null;

//     setCart(prev => {
//       const exists = prev.find(i => isSameLine(i, product._id, portionType, finalPrice, batchId));
//       if (exists) {
//         return prev.map(i => isSameLine(i, product._id, portionType, finalPrice, batchId)
//           ? { ...i, qty: i.qty + 1 }
//           : i
//         );
//       }
//       return [...prev, {
//         ...product,
//         qty: 1,
//         unitPrice: finalPrice,
//         originalPrice: priceAfterDisc,
//         image: toImageUrl(product.image),
//         portionType,
//         batchId,
//         batchNumber: batch?.batchNumber || null,
//       }];
//     });
//   };

//   const handleProductClick = useCallback(async (product) => {
//     const sticky = stickyBatches[product._id];
//     if (sticky?.quantity > 0) {
//       addItemToCart(product, "full", null, sticky);
//       return;
//     }

//     try {
//       const { data } = await api.get(`/batches/${product._id}`);
//       const batches = data?.data || data || [];
//       if (!batches.length) {
//         showError(language === "en"
//           ? "No batches available. Please create a purchase first."
//           : "کوئی بیچ دستیاب نہیں۔ پہلے خریداری کریں۔"
//         );
//         return;
//       }
//       if (batches.length === 1) {
//         addItemToCart(product, "full", null, batches[0]);
//       } else {
//         setBatchProduct(product);
//         toggleModal("batch");
//       }
//     } catch {
//       showError(language === "en" ? "Failed to load batches." : "بیچ لوڈ کرنے میں ناکام۔");
//     }
//   }, [stickyBatches, language]);

//   const handleBatchConfirm = (product, batch, makeSticky) => {
//     addItemToCart(product, "full", null, batch);
//     if (makeSticky && batch) {
//       setStickyBatches(prev => ({ ...prev, [product._id]: batch }));
//     } else {
//       setStickyBatches(prev => { const next = { ...prev }; delete next[product._id]; return next; });
//     }
//   };

//   // ── Portion Modal ────────────────────────────────────────────────────────
//   const openPortionModal = (item, index) => {
//     setPortionState({
//       item,
//       index,
//       type: item.portionType || "full",
//       customPrice: item.portionType === "custom" ? String(item.unitPrice) : "",
//     });
//     toggleModal("portion");
//   };

//   const handlePortionConfirm = () => {
//     const { item, index, type, customPrice } = portionState;
//     if (!item || index === null) return;
//     if (type === "custom" && (!customPrice || Number(customPrice) <= 0)) {
//       showError(language === "en" ? "Enter a valid custom price." : "درست کسٹم قیمت درج کریں۔");
//       return;
//     }

//     setCart(prev => {
//       const updated = [...prev];
//       const cartItem = updated[index];
//       const savedQty = cartItem.qty;
//       const basePrice = Number(cartItem.originalPrice) || Number(cartItem.unitPrice) || 0;

//       let newPrice = basePrice;
//       if (type === "half") newPrice = basePrice / 2;
//       if (type === "custom") newPrice = Number(customPrice);

//       updated.splice(index, 1);
//       const duplicate = updated.findIndex(i =>
//         i._id === cartItem._id &&
//         i.portionType === type &&
//         i.unitPrice === newPrice &&
//         i.batchId === cartItem.batchId
//       );

//       if (duplicate > -1) {
//         updated[duplicate].qty += savedQty;
//       } else {
//         updated.push({ ...cartItem, portionType: type, unitPrice: newPrice, qty: savedQty });
//       }
//       return updated;
//     });

//     toggleModal("portion");
//     setPortionState({ item: null, index: null, type: "full", customPrice: "" });
//   };

//   // ── Hold Order ───────────────────────────────────────────────────────────
//   const handleHoldOrder = async () => {
//     if (!cart.length) return showError(language === "en" ? "Cart is empty!" : "کارٹ خالی ہے!");

//     try {
//       const discountAmt = Math.max(0, Number(resumedHoldMeta.discountAmount) || 0);
//       const total = Math.max(0, subtotal - discountAmt);
//       const holdBody = {
//         items: buildOrderItems(cart),
//         subtotal,
//         discountAmount: discountAmt,
//         totalAmount: total,
//         customerName: resumedHoldMeta.customerName || "",
//         waiter: resumedHoldMeta.waiter || "",
//         staffId: resumedHoldMeta.staffId || "",
//       };

//       if (resumedHoldId) {
//         await updateHold({ id: resumedHoldId, body: holdBody }).unwrap();
//       } else {
//         const { data } = await api.get("/orders/generate-number");
//         await createHold({ orderNumber: data.orderNumber, ...holdBody }).unwrap();
//       }

//       clearCart();
//       setResumedHoldId(null);
//       setResumedHoldMeta({ customerName: "", waiter: "", discountAmount: 0, staffId: "" });
//       showSuccess(language === "en" ? "Order held!" : "آرڈر روک دیا گیا!");
//     } catch (err) {
//       console.error("Hold error:", err);
//       showError(err?.message || "Failed to hold order.");
//     }
//   };

//   const handleResumeOrder = (holdOrder) => {
//     if (!holdOrder.items?.length) {
//       return showError(language === "en" ? "No items in this order!" : "اس آرڈر میں آئٹمز نہیں ہیں!");
//     }

//     if (cart.length && !window.confirm(
//       language === "en"
//         ? "Your current cart has items. Resuming will replace them. Continue?"
//         : "آپ کے موجودہ کارٹ میں آئٹمز ہیں۔ جاری رکھنے سے وہ ہٹ جائیں گے۔ جاری رکھیں؟"
//     )) return;

//     const restoredCart = holdOrder.items.map(item => {
//       const productData = products.find(p => p._id === String(item.product));
//       return {
//         _id: String(item.product),
//         name: item.name,
//         qty: item.quantity ?? 1,
//         unitPrice: Number(item.unitPrice) ?? 0,
//         originalPrice: Number(item.originalPrice) ?? Number(item.unitPrice) ?? 0,
//         image: toImageUrl(productData?.image),
//         portionType: item.portionType || "full",
//         batchId: item.batchId ?? null,
//         batchNumber: item.batchNumber ?? null,
//       };
//     });

//     setCart(restoredCart);
//     setResumedHoldId(holdOrder._id);
//     setResumedHoldMeta({
//       customerName: holdOrder.customerName || "",
//       waiter: holdOrder.waiter || "",
//       discountAmount: holdOrder.discountAmount || 0,
//       staffId: holdOrder.staffId || "",
//     });
//     toggleModal("heldOrders");
//   };

//   const handleDeleteHeldOrder = async (id) => {
//     try {
//       await deleteHold(id).unwrap();
//       showSuccess(language === "en" ? "Held order deleted" : "روکا ہوا آرڈر حذف ہو گیا");
//     } catch (error) {
//       showError(error?.data?.message || error?.message || "Failed to delete held order");
//     }
//   };

//   // ── Checkout ─────────────────────────────────────────────────────────────
//   const handleCheckout = async (paymentData) => {
//     if (!cart.length) return showError(language === "en" ? "Cart is empty!" : "کارٹ خالی ہے!");

//     const {
//       customerName, selectedWaiter, selectedStaffId, orderDiscount,
//       paymentMethod, selectedQarzaAccountId, cashReceived,
//       onlinePlatform, onlineAmount,
//       hybridCash, hybridQarza, hybridQarzaAccountId,
//       orderType,
//     } = paymentData;

//     try {
//       const { data } = await api.get("/orders/generate-number");
//       const discountAmt = Math.max(0, Number(orderDiscount) || 0);
//       const total = Math.max(0, subtotal - discountAmt);
//       const change = Math.max(0, (Number(cashReceived) || 0) - total);

//       const orderBody = {
//         orderNumber: data.orderNumber,
//         createdAt: new Date().toISOString(),
//         subtotal,
//         discountAmount: discountAmt,
//         totalAmount: total,
//         items: buildOrderItems(cart),
//         customerName: paymentMethod === "credit" ? "" : customerName,
//         waiter: selectedWaiter,
//         staffId: selectedStaffId || null,
//         paymentMethod,
//         orderType: orderType || "retail",
//         status: "completed",
//         cashReceived: paymentMethod === "cash" ? Number(cashReceived) || 0 : 0,
//         change: paymentMethod === "cash" ? change : 0,
//         onlinePlatform: paymentMethod === "online" ? onlinePlatform : "",
//         onlineAmount: paymentMethod === "online" ? Number(onlineAmount) || 0 : 0,
//         qarzaAccount: paymentMethod === "credit" ? selectedQarzaAccountId : null,
//         hybridCash: paymentMethod === "hybrid" ? Number(hybridCash) || 0 : 0,
//         hybridQarza: paymentMethod === "hybrid" ? Number(hybridQarza) || 0 : 0,
//         hybridQarzaAccount: paymentMethod === "hybrid" ? hybridQarzaAccountId : null,
//         isPosOrder: true, // Flag to identify POS orders
//       };

//       const res = await addOrder(orderBody).unwrap();

//       // Create qarza payment if credit or hybrid payment
//       if (paymentMethod === "credit" && selectedQarzaAccountId) {
//         try {
//           await createQarzaPayment({
//             qarzaAccountId: selectedQarzaAccountId,
//             amount: total,
//             type: "debit", // Debit from qarza account (customer owes money)
//             date: new Date().toISOString(),
//             notes: `POS Order: ${res.order.orderNumber} - ${customerName || "Customer"}`,
//             orderId: res.order._id,
//             orderNumber: res.order.orderNumber,
//             source: "pos",
//           }).unwrap();
//         } catch (qarzaError) {
//           console.error("Qarza payment error:", qarzaError);
//           showError("Order created but failed to record qarza payment");
//         }
//       }

//       if (paymentMethod === "hybrid" && hybridQarzaAccountId && Number(hybridQarza) > 0) {
//         try {
//           await createQarzaPayment({
//             qarzaAccountId: hybridQarzaAccountId,
//             amount: Number(hybridQarza),
//             type: "debit",
//             date: new Date().toISOString(),
//             notes: `POS Order (Hybrid): ${res.order.orderNumber} - Cash: Rs ${hybridCash}, Qarza: Rs ${hybridQarza} - ${customerName || "Customer"}`,
//             orderId: res.order._id,
//             orderNumber: res.order.orderNumber,
//             source: "pos",
//           }).unwrap();
//         } catch (qarzaError) {
//           console.error("Qarza payment error:", qarzaError);
//           showError("Order created but failed to record qarza payment");
//         }
//       }

//       const selectedAccount = qarzaAccounts.find(a => a._id === selectedQarzaAccountId);
//       printOrder({
//         ...orderBody,
//         ...res.order,
//         orderNumber: res.order?.orderNumber || orderBody.orderNumber,
//         createdAt: res.order?.createdAt || orderBody.createdAt,
//         qarzaAccount: paymentMethod === "credit" && selectedAccount
//           ? { _id: selectedAccount._id, name: selectedAccount.name }
//           : null,
//       });

//       if (resumedHoldId) {
//         try {
//           await deleteHold(resumedHoldId).unwrap();
//         } catch (error) {
//           console.error("Failed to delete held order after checkout:", error);
//           showError(language === "en" ? "Order completed but failed to clear held order" : "آرڈر مکمل ہو گیا لیکن روکا ہوا آرڈر صاف نہیں ہو سکا");
//         }
//         setResumedHoldId(null);
//         setResumedHoldMeta({ customerName: "", waiter: "", discountAmount: 0 });
//       }

//       clearCart();
//       toggleModal("payment");
//       refetchQarza();
//       refetchProducts();
//       showSuccess(language === "en" ? "Order completed successfully!" : "آرڈر مکمل ہو گیا!");
//     } catch (err) {
//       console.error("Checkout error:", err);
//       showError(err?.response?.data?.message || err?.message || "Failed to create order.");
//     }
//   };

//   // ── Split Bill ────────────────────────────────────────────────────────────
//   // Removed - functionality no longer needed

//   // ── Free Food ─────────────────────────────────────────────────────────────
//   // Removed - functionality no longer needed

//   // ─── Render ──────────────────────────────────────────────────────────────
//   return (
//     <div className="flex h-screen bg-[var(--app-bg)] overflow-hidden">
//       {/* ── Left: Product Grid ──────────────────────────────────────────── */}
//       <main className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <button
//               onClick={() => navigate(-1)}
//               className="p-2 rounded-lg transition"
//               style={{ background: "var(--surface-muted)", color: "var(--ink)", border: "1px solid var(--border)" }}
//             >
//               <ArrowLeft size={20} />
//             </button>
//             <h1 className="text-xl font-bold text-[var(--accent-2)] font-display tracking-tight">
//               Point of Sale
//             </h1>
//           </div>
//           <div className="flex gap-2">
//             <ActionButton
//               onClick={() => toggleModal("heldOrders")}
//               className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200"
//             >
//               Held Orders ({holdOrders.length})
//             </ActionButton>
//             <ActionButton
//               onClick={() => navigate("/product-return")}
//               className="bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
//             >
//               Product Return
//             </ActionButton>
//             <ActionButton
//               onClick={() => navigate("/order-history")}
//               className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
//             >
//               Order History
//             </ActionButton>
//           </div>
//         </div>

//         <div className="flex-1 overflow-hidden bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)]">
//           <PaginatedList
//             rtkQuery={useProducts}
//             limit={20}
//             dataKey="data"
//             wrapperClassName="h-full"
//             className="p-3"
//             renderItems={(products) => (
//               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
//                 {products.map(product => (
//                   <ProductCard
//                     key={product._id}
//                     product={product}
//                     onClick={() => handleProductClick(product)}
//                   />
//                 ))}
//               </div>
//             )}
//           />
//         </div>
//       </main>

//       {/* ── Right: Cart Sidebar ─────────────────────────────────────────── */}
//       <PosCartSidebar
//         cart={cart}
//         subtotal={subtotal}
//         resumedHoldId={resumedHoldId}
//         holdOrders={holdOrders}
//         showHeldOrders={modals.heldOrders}
//         setShowHeldOrders={() => toggleModal("heldOrders")}
//         user={user}
//         incQty={incQty}
//         decQty={decQty}
//         removeFromCart={removeFromCart}
//         setCartItemQty={setCartItemQty}
//         openPortionModal={openPortionModal}
//         onCheckout={() => toggleModal("payment")}
//         onHold={handleHoldOrder}
//         handleResumeOrder={handleResumeOrder}
//         handleDeleteHeldOrder={handleDeleteHeldOrder}
//       />

//       {/* ── Modals ──────────────────────────────────────────────────────── */}
//       {modals.payment && (
//         <PosPaymentModal
//           subtotal={subtotal}
//           onCheckout={handleCheckout}
//           onClose={() => toggleModal("payment")}
//           onCreateQarza={() => toggleModal("qarza")}
//           language={language}
//           initialCustomerName={resumedHoldMeta.customerName}
//           initialWaiter={resumedHoldMeta.waiter}
//           initialDiscount={resumedHoldMeta.discountAmount}
//           initialStaffId={resumedHoldMeta.staffId}
//         />
//       )}

//       {modals.portion && (
//         <PortionModal
//           product={portionState.item}
//           selectedPortionType={portionState.type}
//           setSelectedPortionType={(type) => setPortionState(prev => ({ ...prev, type }))}
//           customPrice={portionState.customPrice}
//           setCustomPrice={(price) => setPortionState(prev => ({ ...prev, customPrice: price }))}
//           onClose={() => {
//             toggleModal("portion");
//             setPortionState({ item: null, index: null, type: "full", customPrice: "" });
//           }}
//           onConfirm={handlePortionConfirm}
//           language={language}
//         />
//       )}

//       {modals.batch && (
//         <BatchSelectionModal
//           product={batchProduct}
//           initialIsSticky={!!stickyBatches[batchProduct?._id]}
//           onClose={() => toggleModal("batch")}
//           onConfirm={handleBatchConfirm}
//           language={language}
//         />
//       )}

//       {modals.qarza && (
//         <QarzaAccountCreation
//           setQarzaAccountCreationFormPopupVisibility={() => toggleModal("qarza")}
//           type="personal"
//           onCreated={(newAccount) => {
//             setLocalQarza(prev => [...prev, newAccount]);
//             refetchQarza();
//           }}
//         />
//       )}

//       {modals.heldOrders && (
//         <div
//           className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
//           onClick={() => toggleModal("heldOrders")}
//         />
//       )}
//     </div>
//   );
// }



