import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { X, CheckCircle2, ChevronRight, PackageOpen } from "lucide-react";
import { useBatchesByProduct } from "../../productPurchases/services/batch.service";

// All UI copy lives here so both languages stay in sync and easy to scan.
const TEXT = {
  en: {
    title: "Select Batch",
    loading: "Loading batches...",
    emptyTitle: "No Batches Found",
    empty: "No active batches available for this product. Please create a purchase first.",
    colBatch: "Batch",
    colPrice: "Price",
    colStock: "Stock",
    colExpires: "Expires",
    colStatus: "Status",
    outOfStock: "Out of Stock",
    expired: "Expired",
    save: "Save as default batch",
    cancel: "Cancel",
    confirm: "Confirm",
    outOfStockAlert: "This batch is out of stock.",
    expiredAlert: "This batch has expired.",
  },
  ur: {
    title: "بیچ منتخب کریں",
    loading: "بیچز لوڈ ہو رہے ہیں...",
    emptyTitle: "کوئی بیچ نہیں ملا",
    empty: "اس پروڈکٹ کے لیے کوئی فعال بیچ دستیاب نہیں ہے۔ پہلے خریداری کریں۔",
    colBatch: "بیچ",
    colPrice: "قیمت",
    colStock: "اسٹاک",
    colExpires: "میعاد",
    colStatus: "حیثیت",
    outOfStock: "ختم شدہ",
    expired: "میعاد ختم",
    save: "بطور ڈیفالٹ بیچ محفوظ کریں",
    cancel: "منسوخ کریں",
    confirm: "تصدیق کریں",
    outOfStockAlert: "یہ بیچ ختم ہو چکا ہے۔",
    expiredAlert: "یہ بیچ کی مدت ختم ہو چکی ہے۔",
  },
  ur_en: {
    title: "بیچ منتخب کریں / Select Batch",
    loading: "بیچز لوڈ ہو رہے ہیں... / Loading batches...",
    emptyTitle: "کوئی بیچ نہیں ملا / No Batches Found",
    empty: "اس پروڈکٹ کے لیے کوئی فعال بیچ دستیاب نہیں ہے۔ پہلے خریداری کریں۔ / No active batches available for this product. Please create a purchase first.",
    colBatch: "بیچ / Batch",
    colPrice: "قیمت / Price",
    colStock: "اسٹاک / Stock",
    colExpires: "میعاد / Expires",
    colStatus: "حیثیت / Status",
    outOfStock: "ختم شدہ / Out of Stock",
    expired: "میعاد ختم / Expired",
    save: "بطور ڈیفالٹ بیچ محفوظ کریں / Save as default batch",
    cancel: "منسوخ کریں / Cancel",
    confirm: "تصدیق کریں / Confirm",
    outOfStockAlert: "یہ بیچ ختم ہو چکا ہے۔ / This batch is out of stock.",
    expiredAlert: "یہ بیچ کی مدت ختم ہو چکی ہے۔ / This batch has expired.",
  },
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Shared column widths so the header row and every data row line up.
const TABLE_COLUMNS = "sm:grid-cols-[1.5fr_0.9fr_0.9fr_1.1fr_0.9fr_2.5rem]";

export default function BatchSelectionModal({ product, initialIsSticky = false, onClose, onConfirm, language }) {
  const { data: batches = [], isLoading } = useBatchesByProduct(product?._id, { skip: !product?._id });
  const t = TEXT[language] ?? TEXT.en;

  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [isSticky, setIsSticky] = useState(initialIsSticky);
  const rowRefs = useRef({});

  // ---- Derived batch info -------------------------------------------------

  // Soonest-expiring batch appears first.
  const sortedBatches = useMemo(
    () => [...batches].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)),
    [batches]
  );

  const isExpired = useCallback((batch) => batch.expiryDate && new Date(batch.expiryDate) < new Date(), []);
  const isExpiringSoon = useCallback(
    (batch) => batch.expiryDate && new Date(batch.expiryDate) < new Date(Date.now() + THIRTY_DAYS_MS),
    []
  );
  const isSelectable = useCallback((batch) => batch.quantity > 0 && !isExpired(batch), [isExpired]);

  // ---- Default selection: first selectable batch once batches arrive -----
  useEffect(() => {
    if (selectedBatchId || sortedBatches.length === 0) return;
    const firstSelectable = sortedBatches.find(isSelectable);
    if (firstSelectable) setSelectedBatchId(firstSelectable._id);
  }, [sortedBatches, selectedBatchId, isSelectable]);

  // ---- Confirm — same validation rules as before --------------------------
  const handleConfirm = useCallback(() => {
    if (!selectedBatchId) return;
    const batch = batches.find((b) => b._id === selectedBatchId);

    if (batch.quantity <= 0) {
      alert(t.outOfStockAlert);
      return;
    }
    if (batch.expiryDate && new Date(batch.expiryDate) < new Date()) {
      alert(t.expiredAlert);
      return;
    }

    onConfirm(product, batch, isSticky);
    onClose();
  }, [batches, selectedBatchId, isSticky, onConfirm, onClose, product, t]);

  // ---- Keyboard control: Up/Down move selection, Enter confirms, Esc closes
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Enter") {
        handleConfirm();
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;

      e.preventDefault();
      const selectableBatches = sortedBatches.filter(isSelectable);
      if (selectableBatches.length === 0) return;

      const currentIndex = selectableBatches.findIndex((b) => b._id === selectedBatchId);
      const direction = e.key === "ArrowDown" ? 1 : -1;
      const nextIndex = (currentIndex + direction + selectableBatches.length) % selectableBatches.length;
      const nextBatch = selectableBatches[nextIndex];

      setSelectedBatchId(nextBatch._id);
      rowRefs.current[nextBatch._id]?.scrollIntoView({ block: "nearest" });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sortedBatches, selectedBatchId, isSelectable, handleConfirm, onClose]);

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center app-overlay p-4">
      <div className="app-enter bg-(--surface) rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <ModalHeader product={product} title={t.title} onClose={onClose} />

        <div className="flex-1 overflow-y-auto custom-scrollbar app-gradient-vertical p-4 sm:p-6">
          {isLoading ? (
            <LoadingState text={t.loading} />
          ) : sortedBatches.length === 0 ? (
            <EmptyState title={t.emptyTitle} message={t.empty} />
          ) : (
            <BatchTable
              batches={sortedBatches}
              selectedBatchId={selectedBatchId}
              onSelect={setSelectedBatchId}
              isSelectable={isSelectable}
              isExpired={isExpired}
              isExpiringSoon={isExpiringSoon}
              rowRefs={rowRefs}
              text={t}
            />
          )}
        </div>

        {sortedBatches.length > 0 && !isLoading && (
          <ModalFooter
            isSticky={isSticky}
            onStickyChange={setIsSticky}
            onCancel={onClose}
            onConfirm={handleConfirm}
            canConfirm={Boolean(selectedBatchId)}
            text={t}
          />
        )}
      </div>
    </div>
  );
}

// ---- Subcomponents ---------------------------------------------------------

function ModalHeader({ product, title, onClose }) {
  return (
    <div className="bg-(--surface-muted) px-4 sm:px-6 py-4 border-b border-edge flex justify-between items-center shrink-0">
      <div className="min-w-0">
        <h2 className="text-lg sm:text-xl font-bold text-ink flex items-center gap-2">
          <PackageOpen className="w-5 h-5 text-primary" />
          {title}
        </h2>
        <p className="text-sm text-ink-subtle mt-0.5 truncate">{product.name}</p>
      </div>
      <button onClick={onClose} className="btn-close p-2 shrink-0" aria-label="Close">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

function LoadingState({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-ink-subtle">
      <div className="w-8 h-8 border-4 border-(--accent-2) border-t-transparent rounded-full animate-spin mb-4" />
      <p>{text}</p>
    </div>
  );
}

function EmptyState({ title, message }) {
  return (
    <div className="text-center py-12">
      <div className="bg-(--surface-muted) w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <PackageOpen className="w-8 h-8 text-ink-subtle" />
      </div>
      <h3 className="text-lg font-medium text-ink mb-1">{title}</h3>
      <p className="text-sm text-ink-subtle mb-6">{message}</p>
    </div>
  );
}

function BatchTable({ batches, selectedBatchId, onSelect, isSelectable, isExpired, isExpiringSoon, rowRefs, text }) {
  return (
    <div role="table" className="flex flex-col gap-2">
      {/* Column headings — hidden on mobile, where each row stacks as label/value pairs instead */}
      <div className={`hidden sm:grid ${TABLE_COLUMNS} gap-4 px-4 text-xs font-semibold uppercase tracking-wide text-ink-subtle`}>
        <span>{text.colBatch}</span>
        <span>{text.colPrice}</span>
        <span>{text.colStock}</span>
        <span>{text.colExpires}</span>
        <span>{text.colStatus}</span>
        <span />
      </div>

      {batches.map((batch) => {
        const selectable = isSelectable(batch);
        return (
          <BatchRow
            key={batch._id}
            batch={batch}
            isSelected={selectedBatchId === batch._id}
            selectable={selectable}
            expired={isExpired(batch)}
            expiringSoon={isExpiringSoon(batch)}
            onSelect={() => onSelect(batch._id)}
            rowRef={(el) => { rowRefs.current[batch._id] = el; }}
            text={text}
          />
        );
      })}
    </div>
  );
}

function BatchRow({ batch, isSelected, selectable, expired, expiringSoon, onSelect, rowRef, text }) {
  const outOfStock = batch.quantity <= 0;
  const statusLabel = expired ? text.expired : outOfStock ? text.outOfStock : null;
  const warningClass = outOfStock || expiringSoon ? "text-(--accent)" : "text-ink";

  return (
    <div
      ref={rowRef}
      role="row"
      aria-selected={isSelected}
      onClick={selectable ? onSelect : undefined}
      className={[
        "grid grid-cols-1 gap-2 sm:gap-4 sm:items-center px-4 py-3 rounded-xl border-2 transition-colors",
        TABLE_COLUMNS,
        isSelected ? "border-edge-brand bg-primary-hover" : "border-edge bg-(--surface)",
        selectable ? "cursor-pointer hover:border-(--accent-2)" : "opacity-50 cursor-not-allowed",
      ].join(" ")}
    >
      <span className={`font-bold text-base truncate ${isSelected ? "text-primary" : "text-ink"}`}>
        {batch.batchNumber}
      </span>

      <Field label={text.colPrice} value={`Rs ${batch.sellingPrice}`} />
      <Field label={text.colStock} value={`${batch.quantity} units`} valueClassName={outOfStock ? "text-(--accent)" : "text-ink"} />
      <Field
        label={text.colExpires}
        value={batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : "—"}
        valueClassName={warningClass}
      />
      <Field label={text.colStatus} value={statusLabel ? <StatusBadge label={statusLabel} /> : "—"} />

      <div className="flex justify-end sm:justify-center">
        {isSelected ? (
          <CheckCircle2 className="w-5 h-5 text-primary" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-edge" />
        )}
      </div>
    </div>
  );
}

// Label on mobile (column header is hidden there), value always shown.
function Field({ label, value, valueClassName = "text-ink" }) {
  return (
    <div className="flex items-center justify-between sm:justify-start gap-2 text-sm">
      <span className="text-ink-subtle sm:hidden">{label}</span>
      <span className={`font-semibold ${valueClassName}`}>{value}</span>
    </div>
  );
}

function StatusBadge({ label }) {
  return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-danger text-primary-foreground">{label}</span>;
}

function ModalFooter({ isSticky, onStickyChange, onCancel, onConfirm, canConfirm, text }) {
  return (
    <div className="bg-(--surface) px-4 sm:px-6 py-4 border-t border-edge flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center shrink-0">
      <label className="flex items-center gap-2 cursor-pointer text-sm text-ink">
        <input
          type="checkbox"
          checked={isSticky}
          onChange={(e) => onStickyChange(e.target.checked)}
          className="w-4 h-4"
          style={{ accentColor: "var(--accent-2)" }}
        />
        {text.save}
      </label>

      <div className="flex gap-3">
        <button onClick={onCancel} className="btn-back flex-1 sm:flex-none justify-center">
          {text.cancel}
        </button>
        <button
          onClick={onConfirm}
          disabled={!canConfirm}
          className={`btn-add flex-1 sm:flex-none justify-center ${!canConfirm ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
        >
          {text.confirm} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}





























// import { useState }                                    from "react";
// import { X, CheckCircle2, ChevronRight, PackageOpen }  from "lucide-react";
// import { useBatchesByProduct } from "../../productPurchases/services/batch.service";

// // ─────────────────────────────────────────────────────────────────────────────
// //  BatchSelectionModal
// //
// //  Opens when a product has batches and the cashier needs to pick one.
// //  Shows all batches sorted by expiry date (soonest first).
// //  Highlights out-of-stock and expiring-soon batches.
// //  Option to "Save as default" so the same batch is used next time.
// //
// //  Props:
// //    product        — the product whose batches we are listing
// //    initialIsSticky — whether this product already has a saved default batch
// //    onClose        — closes the modal
// //    onConfirm(product, batch, isSticky) — called when cashier confirms selection
// //    language       — "en" or "ur"
// // ─────────────────────────────────────────────────────────────────────────────
// export default function BatchSelectionModal({ product, initialIsSticky = false, onClose, onConfirm, language }) {
//     const { data: batches = [], isLoading } = useBatchesByProduct(product?._id, { skip: !product?._id });

//     const [selectedBatchId, setSelectedBatchId] = useState(null);
//     const [isSticky,        setIsSticky]        = useState(initialIsSticky);

//     if (!product) return null;

//     // Sort batches so those expiring soonest appear at the top
//     const sortedBatches = [...batches].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

//     const handleConfirm = () => {
//         if (!selectedBatchId) return;
//         const batch = batches.find((b) => b._id === selectedBatchId);
        
//         // Validate batch is not out of stock
//         if (batch.quantity <= 0) {
//             alert(language === "en" ? "This batch is out of stock." : "یہ بیچ ختم ہو چکا ہے۔");
//             return;
//         }
        
//         // Validate batch is not expired
//         if (batch.expiryDate && new Date(batch.expiryDate) < new Date()) {
//             alert(language === "en" ? "This batch has expired." : "یہ بیچ کی مدت ختم ہو چکی ہے۔");
//             return;
//         }
        
//         onConfirm(product, batch, isSticky);
//         onClose();
//     };

//     // A batch is expiring soon if its expiry is within the next 30 days
//     const isExpiringSoon = (expiryDate) =>
//         expiryDate && new Date(expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

//     return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
//             <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

//                 {/* Header */}
//                 <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
//                     <div>
//                         <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
//                             <PackageOpen className="w-5 h-5 text-indigo-500" />
//                             {language === "en" ? "Select Batch" : "بیچ منتخب کریں"}
//                         </h2>
//                         <p className="text-sm text-gray-500 mt-0.5">{product.name}</p>
//                     </div>
//                     <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-500">
//                         <X className="w-5 h-5" />
//                     </button>
//                 </div>

//                 {/* Body */}
//                 <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
//                     {isLoading ? (
//                         <div className="flex flex-col items-center justify-center py-12 text-gray-500">
//                             <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
//                             <p>Loading batches...</p>
//                         </div>
//                     ) : batches.length === 0 ? (
//                         <div className="text-center py-12">
//                             <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
//                                 <PackageOpen className="w-8 h-8 text-gray-400" />
//                             </div>
//                             <h3 className="text-lg font-medium text-gray-900 mb-1">
//                                 {language === "en" ? "No Batches Found" : "کوئی بیچ نہیں ملا"}
//                             </h3>
//                             <p className="text-sm text-gray-500 mb-6">
//                                 {language === "en"
//                                     ? "No active batches available for this product. Please create a purchase first."
//                                     : "اس پروڈکٹ کے لیے کوئی فعال بیچ دستیاب نہیں ہے۔ پہلے خریداری کریں۔"}
//                             </p>
//                         </div>
//                     ) : (
//                         <div className="grid gap-4">
//                             {sortedBatches.map((batch) => {
//                                 const isSelected    = selectedBatchId === batch._id;
//                                 const outOfStock    = batch.quantity <= 0;
//                                 const isExpired     = batch.expiryDate && new Date(batch.expiryDate) < new Date();
//                                 const nearExpiry    = isExpiringSoon(batch.expiryDate);

//                                 return (
//                                     <div
//                                         key={batch._id}
//                                         onClick={() => !outOfStock && !isExpired && setSelectedBatchId(batch._id)}
//                                         className={`relative p-4 rounded-xl border-2 transition-all
//                                             ${isSelected ? "border-indigo-500 bg-indigo-50/50" : "border-gray-200 bg-white hover:border-indigo-300"}
//                                             ${(outOfStock || isExpired) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
//                                     >
//                                         <div className="flex items-start justify-between">
//                                             <div>
//                                                 <div className="flex items-center gap-3 mb-1">
//                                                     <h4 className={`font-bold text-lg ${isSelected ? "text-indigo-900" : "text-gray-900"}`}>
//                                                         {batch.batchNumber}
//                                                     </h4>
//                                                     {outOfStock && (
//                                                         <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
//                                                             Out of Stock
//                                                         </span>
//                                                     )}
//                                                     {isExpired && (
//                                                         <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
//                                                             Expired
//                                                         </span>
//                                                     )}
//                                                 </div>

//                                                 <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-sm">
//                                                     <span>
//                                                         <span className="text-gray-500">Price: </span>
//                                                         <span className="font-semibold text-gray-900">Rs {batch.sellingPrice}</span>
//                                                     </span>
//                                                     <span>
//                                                         <span className="text-gray-500">Stock: </span>
//                                                         <span className={`font-semibold ${outOfStock ? "text-red-600" : "text-gray-900"}`}>
//                                                             {batch.quantity} units
//                                                         </span>
//                                                     </span>
//                                                     {batch.expiryDate && (
//                                                         <span>
//                                                             <span className="text-gray-500">Expires: </span>
//                                                             <span className={`font-semibold ${nearExpiry ? "text-amber-600" : "text-gray-900"}`}>
//                                                                 {new Date(batch.expiryDate).toLocaleDateString()}
//                                                             </span>
//                                                         </span>
//                                                     )}
//                                                 </div>
//                                             </div>

//                                             {/* Selection indicator */}
//                                             <div className="shrink-0">
//                                                 {isSelected
//                                                     ? <CheckCircle2 className="w-6 h-6 text-indigo-600" />
//                                                     : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
//                                                 }
//                                             </div>
//                                         </div>
//                                     </div>
//                                 );
//                             })}
//                         </div>
//                     )}
//                 </div>

//                 {/* Footer (only shown when batches exist) */}
//                 {batches.length > 0 && !isLoading && (
//                     <div className="bg-white px-6 py-4 border-t border-gray-200 flex justify-between items-center shrink-0">

//                         {/* "Save as default batch" checkbox */}
//                         <label className="flex items-center gap-2 cursor-pointer">
//                             <input
//                                 type="checkbox" checked={isSticky} onChange={(e) => setIsSticky(e.target.checked)}
//                                 className="w-4 h-4 accent-indigo-600"
//                             />
//                             <span className="text-sm text-gray-700">
//                                 {language === "en" ? "Save as default batch" : "بطور ڈیفالٹ بیچ محفوظ کریں"}
//                             </span>
//                         </label>

//                         <div className="flex gap-3">
//                             <button onClick={onClose}
//                                 className="px-5 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition">
//                                 Cancel
//                             </button>
//                             <button
//                                 onClick={handleConfirm} disabled={!selectedBatchId}
//                                 className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white transition shadow-sm
//                                     ${!selectedBatchId ? "bg-gray-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"}`}
//                             >
//                                 Confirm <ChevronRight className="w-4 h-4" />
//                             </button>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }
