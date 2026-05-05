

// import { useState } from "react";
// import { X, CheckCircle, Plus, Trash2, Pencil } from "lucide-react";
// import { useCreateReturn } from "../services/return.service";
// import { useProducts } from "../../productsModule/services/product.service.js";
// import { FormField, Input, Textarea, SearchableSelect } from "../../../components/common/FormFields";
// import { useAllPurchases } from "../services/purchases.service.js";

// const RETURN_REASONS = [
//     { label: "Defective", value: "defective" },
//     { label: "Wrong Item", value: "wrong_item" },
//     { label: "Expired", value: "expired" },
//     { label: "Damaged in Transit", value: "damaged_in_transit" },
//     { label: "Customer Request", value: "customer_request" },
//     { label: "Other", value: "other" },
// ];

// const CONDITIONS = [
//     { label: "Resalable", value: "resalable" },
//     { label: "Damaged", value: "damaged" },
//     { label: "Expired", value: "expired" },
// ];

// // const blankItem = () => ({
// //     product: "", invoiceItem: "", batch: "", expiryDate: "",
// //     originalQty: "", returnQuantity: "", condition: "",
// //     cut: 0, costPrice: "", notes: "",
// // });


// // 3. blankItem mein bhi add karo
// const blankItem = () => ({
//     product: "", productName: "",  // 👈 yahan bhi
//     invoiceItem: "", batch: "", expiryDate: "",
//     originalQty: "", returnQuantity: "", condition: "",
//     cut: 0, costPrice: "", notes: "",
// });



// export default function AddReturn({ open, onClose }) {
//     const [createReturn, { isLoading }] = useCreateReturn();
//     const { data: purchasesRaw = [] } = useAllPurchases();
//     const { data: productsRaw = [] } = useProducts();

//     const purchases = purchasesRaw?.data || purchasesRaw || [];
//     const products = productsRaw?.data || productsRaw || [];
//     console.log(purchasesRaw, productsRaw, purchases, products)

//     const [formData, setFormData] = useState({
//         returnType: "",
//         returnDate: new Date().toISOString().split("T")[0],
//         returnReason: "",
//         invoice: "",
//     });

//     const [currentItem, setCurrentItem] = useState(blankItem());
//     const [items, setItems] = useState([]);
//     const [editingIndex, setEditingIndex] = useState(-1);

//     const update = (f, v) => setFormData(p => ({ ...p, [f]: v }));
//     const updateCurrent = (f, v) => setCurrentItem(p => ({ ...p, [f]: v }));

//     // Selected purchase
//     const selectedPurchase = purchases.find(p => p._id === formData.invoice);

//     // Purchase items as options
//     const purchaseItemOptions = (selectedPurchase?.items || []).map(item => ({
//         label: `${item.product?.name || "Unknown"} — Qty: ${item.quantity} — Rs. ${item.price}`,
//         value: item._id,
//         data: item,
//     }));

//     // Product name helper
//     // 2. getProductName — productName pehle check karo
//     const getProductName = (id) => {
//         if (currentItem.productName) return currentItem.productName;  // 👈 direct naam
//         return products.find(p => p._id === id)?.name || id;
//     };
//     // Refund calculation
//     const refundAmount = (Number(currentItem.returnQuantity) * Number(currentItem.costPrice || 0)) - Number(currentItem.cut || 0);

//     // Add / update item
//     const handleAddItem = () => {
//         if (!currentItem.product || !currentItem.returnQuantity || !currentItem.condition) return;
//         const row = { ...currentItem, refundAmount: Math.max(0, refundAmount) };

//         if (editingIndex >= 0) {
//             setItems(p => p.map((it, i) => i === editingIndex ? row : it));
//             setEditingIndex(-1);
//         } else {
//             setItems(p => [...p, row]);
//         }
//         setCurrentItem(blankItem());
//     };

//     const handleEdit = (i) => { setCurrentItem(items[i]); setEditingIndex(i); };
//     const handleCancel = () => { setCurrentItem(blankItem()); setEditingIndex(-1); };
//     const handleDelete = (i) => {
//         setItems(p => p.filter((_, idx) => idx !== i));
//         if (editingIndex === i) { setCurrentItem(blankItem()); setEditingIndex(-1); }
//     };

//     const onSubmit = async () => {
//         if (!items.length) return;
//         try {
//             await createReturn({ ...formData, items }).unwrap();
//             onClose();
//         } catch { }
//     };

//     if (!open) return null;

//     return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
//             <div className="bg-(--surface) border border-(--border) rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 space-y-6">

//                 {/* Header */}
//                 <div className="flex items-center justify-between">
//                     <h2 className="text-base font-semibold text-(--text)">Add Return</h2>
//                     <button onClick={onClose} className="text-(--muted) hover:text-(--text) transition">
//                         <X className="w-5 h-5" />
//                     </button>
//                 </div>

//                 {/* Main Fields */}
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                     <FormField label="* Return Type">
//                         <SearchableSelect
//                             options={[
//                                 { label: "Purchase Based", value: "invoice_based" },
//                                 { label: "Direct", value: "direct" },
//                             ]}
//                             value={formData.returnType}
//                             onChange={(val) => {
//                                 update("returnType", val);
//                                 update("invoice", "");
//                                 setCurrentItem(blankItem());
//                                 setItems([]);
//                             }}
//                             placeholder="Select type..."
//                         />
//                     </FormField>

//                     <FormField label="* Return Date">
//                         <Input type="date" value={formData.returnDate}
//                             onChange={e => update("returnDate", e.target.value)} />
//                     </FormField>

//                     <FormField label="* Return Reason">
//                         <SearchableSelect
//                             options={RETURN_REASONS}
//                             value={formData.returnReason}
//                             onChange={val => update("returnReason", val)}
//                             placeholder="Select reason..."
//                         />
//                     </FormField>

//                     {formData.returnType === "invoice_based" && (
//                         <FormField label="* Purchase">
//                             <SearchableSelect
//                                 options={purchases.map(p => ({
//                                     label: `${p.invoiceNumber} — ${p.supplier?.name || ""}`,
//                                     value: p._id,
//                                 }))}
//                                 value={formData.invoice}
//                                 onChange={val => { update("invoice", val); setCurrentItem(blankItem()); }}
//                                 placeholder="Search purchase..."
//                             />
//                         </FormField>
//                     )}
//                 </div>

//                 {/* Purchase Preview */}
//                 {selectedPurchase && (
//                     <div className="grid grid-cols-4 gap-3 p-4 rounded-2xl bg-(--surface) border border-(--border) text-sm">
//                         <div><span className="text-xs text-(--muted) block">Supplier</span>{selectedPurchase.supplier?.name || "—"}</div>
//                         <div><span className="text-xs text-(--muted) block">Date</span>{new Date(selectedPurchase.date).toLocaleDateString()}</div>
//                         <div><span className="text-xs text-(--muted) block">Total</span>Rs. {selectedPurchase.totalAmount?.toLocaleString()}</div>
//                         <div><span className="text-xs text-(--muted) block">Invoice</span>{selectedPurchase.invoiceNumber}</div>
//                     </div>
//                 )}

//                 {/* Item Entry */}
//                 {formData.returnType && (
//                     <div className="p-4 rounded-2xl border border-(--border) space-y-4">
//                         <h4 className="text-sm font-semibold text-(--text)">
//                             {editingIndex >= 0 ? `Editing Item #${editingIndex + 1}` : "New Item"}
//                         </h4>

//                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

//                             {/* Purchase based — item select */}
//                             {formData.returnType === "invoice_based" && formData.invoice && (
//                                 <div className="col-span-2 md:col-span-3">
//                                     <FormField label="* Select Item from Purchase">
//                                         <SearchableSelect
//                                             options={purchaseItemOptions}
//                                             value={currentItem.invoiceItem}
//                                             // onChange={(val) => {
//                                             //     const found = purchaseItemOptions.find(o => o.value === val);
//                                             //     if (!found?.data) return;
//                                             //     const it = found.data;
//                                             //     updateCurrent("invoiceItem",   val);
//                                             //     updateCurrent("product",       it.product?._id  || it.product  || "");
//                                             //     updateCurrent("batch",         it.batch?.batchNumber || it.batchNumber || "");
//                                             //     updateCurrent("expiryDate",    it.batch?.expiryDate  || it.expiryDate  || "");
//                                             //     updateCurrent("originalQty",   it.quantity || "");
//                                             //     updateCurrent("costPrice",     it.price    || "");
//                                             // }}
//                                             // 1. Item select karte waqt — name bhi store karo
//                                             onChange={(val) => {
//                                                 const found = purchaseItemOptions.find(o => o.value === val);
//                                                 if (!found?.data) return;
//                                                 const it = found.data;
//                                                 updateCurrent("invoiceItem", val);
//                                                 updateCurrent("product", it.product?._id || it.product || "");
//                                                 updateCurrent("productName", it.product?.name || "");  // 👈 yeh add karo
//                                                 updateCurrent("batch", it.batch?.batchNumber || it.batchNumber || "");
//                                                 updateCurrent("expiryDate", it.batch?.expiryDate || it.expiryDate || "");
//                                                 updateCurrent("originalQty", it.quantity || "");
//                                                 updateCurrent("costPrice", it.price || "");
//                                             }}
//                                             placeholder="Select item..."
//                                         />
//                                     </FormField>
//                                 </div>
//                             )}

//                             {/* Direct — product select */}
//                             {formData.returnType === "direct" && (
//                                 <FormField label="* Product">
//                                     <SearchableSelect
//                                         options={products.map(p => ({ label: p.name, value: p._id }))}
//                                         value={currentItem.product}
//                                         onChange={val => updateCurrent("product", val)}
//                                         placeholder="Select product..."
//                                     />
//                                 </FormField>
//                             )}

//                             {/* Fields — show after product selected */}
//                             {currentItem.product && (
//                                 <>
//                                     <FormField label={`* Return Qty${currentItem.originalQty ? ` (max: ${currentItem.originalQty})` : ""}`}>
//                                         <Input type="number" min={1} max={currentItem.originalQty || undefined}
//                                             value={currentItem.returnQuantity}
//                                             onChange={e => updateCurrent("returnQuantity", e.target.value)}
//                                             placeholder="0" />
//                                     </FormField>

//                                     <FormField label="* Condition">
//                                         <SearchableSelect options={CONDITIONS} value={currentItem.condition}
//                                             onChange={val => updateCurrent("condition", val)}
//                                             placeholder="Select condition..." />
//                                     </FormField>

//                                     <FormField label="Cut (Rs.)">
//                                         <Input type="number" min={0} value={currentItem.cut}
//                                             onChange={e => updateCurrent("cut", e.target.value)}
//                                             placeholder="0.00" />
//                                     </FormField>

//                                     {formData.returnType === "direct" && (
//                                         <>
//                                             <FormField label="Batch">
//                                                 <Input type="text" value={currentItem.batch}
//                                                     onChange={e => updateCurrent("batch", e.target.value)}
//                                                     placeholder="Batch number..." />
//                                             </FormField>
//                                             <FormField label="Cost Price">
//                                                 <Input type="number" min={0} value={currentItem.costPrice}
//                                                     onChange={e => updateCurrent("costPrice", e.target.value)}
//                                                     placeholder="0.00" />
//                                             </FormField>
//                                         </>
//                                     )}

//                                     <div className="col-span-2 md:col-span-3 grid grid-cols-2 gap-4">
//                                         <FormField label="Notes">
//                                             <Textarea rows={2} value={currentItem.notes}
//                                                 onChange={e => updateCurrent("notes", e.target.value)}
//                                                 placeholder="Item notes..." />
//                                         </FormField>

//                                         {/* Preview box */}
//                                         <div className="p-3 rounded-2xl border border-(--border) bg-(--surface) space-y-1.5 text-sm">
//                                             <p className="text-xs font-semibold text-(--muted) mb-2">Item Preview</p>
//                                             <div className="flex justify-between">
//                                                 <span className="text-(--muted) text-xs">Product</span>
//                                                 <span className="font-medium">{getProductName(currentItem.product)}</span>
//                                             </div>
//                                             {currentItem.originalQty && (
//                                                 <div className="flex justify-between">
//                                                     <span className="text-(--muted) text-xs">Original Qty</span>
//                                                     <span>{currentItem.originalQty}</span>
//                                                 </div>
//                                             )}
//                                             {currentItem.batch && (
//                                                 <div className="flex justify-between">
//                                                     <span className="text-(--muted) text-xs">Batch</span>
//                                                     <span>{currentItem.batch}</span>
//                                                 </div>
//                                             )}
//                                             {currentItem.costPrice && (
//                                                 <div className="flex justify-between">
//                                                     <span className="text-(--muted) text-xs">Rate</span>
//                                                     <span>Rs. {currentItem.costPrice}</span>
//                                                 </div>
//                                             )}
//                                             {currentItem.returnQuantity && currentItem.costPrice && (
//                                                 <div className="flex justify-between border-t border-(--border) pt-1.5 mt-1.5">
//                                                     <span className="text-(--muted) text-xs font-medium">Refund</span>
//                                                     <span className="font-semibold text-green-600">
//                                                         Rs. {Math.max(0, refundAmount).toLocaleString()}
//                                                     </span>
//                                                 </div>
//                                             )}
//                                         </div>
//                                     </div>
//                                 </>
//                             )}
//                         </div>

//                         <div className="flex gap-2 justify-end">
//                             {editingIndex >= 0 && (
//                                 <button type="button" onClick={handleCancel}
//                                     className="px-3 py-1.5 rounded-xl border border-(--border) text-xs text-(--muted) hover:text-(--text) transition">
//                                     Cancel Edit
//                                 </button>
//                             )}
//                             <button type="button" onClick={handleAddItem}
//                                 disabled={!currentItem.product || !currentItem.returnQuantity || !currentItem.condition}
//                                 className="px-3 py-1.5 rounded-xl bg-cyan-600 text-white text-xs hover:bg-cyan-700 disabled:opacity-40 transition flex items-center gap-1">
//                                 {editingIndex >= 0
//                                     ? <><CheckCircle className="w-3.5 h-3.5" /> Update Item</>
//                                     : <><Plus className="w-3.5 h-3.5" /> Confirm Item</>
//                                 }
//                             </button>
//                         </div>
//                     </div>
//                 )}

//                 {/* Confirmed Items */}
//                 {items.length > 0 && (
//                     <div className="space-y-2">
//                         <h4 className="text-sm font-semibold text-(--text)">Confirmed Items ({items.length})</h4>
//                         {items.map((item, i) => (
//                             <div key={i} className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border transition ${editingIndex === i ? "border-cyan-500 bg-cyan-50" : "border-(--border)"}`}>
//                                 <div className="flex flex-col gap-0.5">
//                                     <span className="text-sm font-medium text-(--text)">{getProductName(item.product)}</span>
//                                     <span className="text-xs text-(--muted)">
//                                         Qty: {item.returnQuantity} • {item.condition}
//                                         {item.cut > 0 ? ` • Cut: Rs.${item.cut}` : ""}
//                                         {" • "}Refund: Rs.{item.refundAmount?.toLocaleString()}
//                                     </span>
//                                 </div>
//                                 <div className="flex items-center gap-2 shrink-0">
//                                     <button type="button" onClick={() => handleEdit(i)}
//                                         className="p-1.5 rounded-lg text-(--muted) hover:text-cyan-600 hover:bg-cyan-50 transition">
//                                         <Pencil className="w-3.5 h-3.5" />
//                                     </button>
//                                     <button type="button" onClick={() => handleDelete(i)}
//                                         className="p-1.5 rounded-lg text-(--muted) hover:text-red-500 hover:bg-red-50 transition">
//                                         <Trash2 className="w-3.5 h-3.5" />
//                                     </button>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 )}

//                 {/* Footer */}
//                 <div className="flex justify-end gap-3 pt-2 border-t border-(--border)">
//                     <button type="button" onClick={onClose}
//                         className="px-4 py-2 rounded-xl border border-(--border) text-sm text-(--muted) hover:text-(--text) transition">
//                         Cancel
//                     </button>
//                     <button type="button" onClick={onSubmit}
//                         disabled={isLoading || !items.length}
//                         className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm hover:bg-cyan-700 disabled:opacity-50 transition">
//                         {isLoading ? "Saving..." : `Save Return (${items.length} items)`}
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }




















































import { useState } from "react";
import { X, CheckCircle, Plus, Trash2, Pencil, Search } from "lucide-react";
import { useCreateReturn } from "../services/return.service";
import { useProducts } from "../../productsModule/services/product.service.js";
import { FormField, Input, Textarea, SearchableSelect } from "../../../components/common/FormFields";
import { usePurchaseByInvoiceNumber } from "../services/purchases.service.js";

const RETURN_REASONS = [
    { label: "Defective", value: "defective" },
    { label: "Wrong Item", value: "wrong_item" },
    { label: "Expired", value: "expired" },
    { label: "Damaged in Transit", value: "damaged_in_transit" },
    { label: "Customer Request", value: "customer_request" },
    { label: "Other", value: "other" },
];

const CONDITIONS = [
    { label: "Resalable", value: "resalable" },
    { label: "Damaged", value: "damaged" },
    { label: "Expired", value: "expired" },
];

const blankItem = () => ({
    product: "", productName: "", invoiceItem: "",
    batch: "", expiryDate: "", originalQty: "",
    returnQuantity: "", condition: "", cut: 0,
    costPrice: "", notes: "",
});

export default function AddReturn({ open, onClose }) {
    const [createReturn, { isLoading }] = useCreateReturn();

    // Search state
    const [searchInput, setSearchInput] = useState("");
    const [invoiceQuery, setInvoiceQuery] = useState("");

    // RTK Query — sirf tab fire ho jab invoiceQuery set ho
    const {
        data: purchase,
        isLoading: isSearching,
        isError,
        isFetching,
    } = usePurchaseByInvoiceNumber(invoiceQuery, { skip: !invoiceQuery });

    // Form state
    const [formData, setFormData] = useState({
        returnDate: new Date().toISOString().split("T")[0],
        returnReason: "",
        returnType: "invoice_based",
    });

    const [currentItem, setCurrentItem] = useState(blankItem());
    const [items, setItems] = useState([]);
    const [editingIndex, setEditingIndex] = useState(-1);

    const update = (f, v) => setFormData(p => ({ ...p, [f]: v }));
    const updateCurrent = (f, v) => setCurrentItem(p => ({ ...p, [f]: v }));

    // Purchase items as options
    const purchaseItemOptions = (purchase?.items || []).map(item => {
        console.log(item, "THe item ")
        return ({
        label: `${item.product?.name || "Unknown"} — Qty: ${item.quantity} — Rs. ${item.price}`,
        value: item._id,
        data: item,
    })
    });

    // Refund calculation
    const refundAmount =
        Number(currentItem.returnQuantity) * Number(currentItem.costPrice || 0)
        - Number(currentItem.cut || 0);

    const getItemName = (item) => item.productName || item.product || "";

    // Search handler
    const handleSearch = () => {
        const q = searchInput.trim();
        if (!q) return;
        setInvoiceQuery(q);
        setCurrentItem(blankItem());
        setItems([]);
    };

    // Add / update item
    const handleAddItem = () => {
        if (!currentItem.product || !currentItem.returnQuantity || !currentItem.condition) return;
        const row = { ...currentItem, refundAmount: Math.max(0, refundAmount) };

        if (editingIndex >= 0) {
            setItems(p => p.map((it, i) => i === editingIndex ? row : it));
            setEditingIndex(-1);
        } else {
            setItems(p => [...p, row]);
        }
        setCurrentItem(blankItem());
    };

    const handleEdit = (i) => { setCurrentItem(items[i]); setEditingIndex(i); };
    const handleCancel = () => { setCurrentItem(blankItem()); setEditingIndex(-1); };
    const handleDelete = (i) => {
        setItems(p => p.filter((_, idx) => idx !== i));
        if (editingIndex === i) { setCurrentItem(blankItem()); setEditingIndex(-1); }
    };

    const onSubmit = async () => {
        if (!items.length || !purchase) return;
        try {
            await createReturn({
                returnType: formData.returnType,
                returnDate: formData.returnDate,
                returnReason: formData.returnReason,
                invoice: purchase._id,
                supplier: purchase.supplier?._id || purchase.supplier,
                items,
            }).unwrap();
            onClose();
        } catch { }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-(--surface) border border-(--border) rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-(--text)">Add Return</h2>
                    <button onClick={onClose} className="text-(--muted) hover:text-(--text) transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ── Step 1: Invoice Search ─────────────────── */}
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-(--muted) uppercase tracking-wider">Step 1 — Search Purchase</p>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter invoice number e.g. INV-TEST-SUPPLIER-..."
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSearch()}
                        />
                        <button
                            onClick={handleSearch}
                            disabled={isSearching || isFetching}
                            className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm hover:bg-cyan-700 disabled:opacity-50 transition flex items-center gap-2 shrink-0">
                            <Search className="w-4 h-4" />
                            {isSearching || isFetching ? "Searching..." : "Search"}
                        </button>
                    </div>

                    {/* Not found message */}
                    {isError && invoiceQuery && (
                        <p className="text-xs text-red-500 px-1">
                            ❌ No purchase found for "{invoiceQuery}". Check the invoice number.
                        </p>
                    )}
                </div>

                {/* ── Purchase Found — Preview ───────────────── */}
                {purchase && (
                    <>
                        <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 space-y-3">
                            <p className="text-xs font-semibold text-cyan-700 uppercase tracking-wider">✅ Purchase Found</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div><span className="text-xs text-(--muted) block">Invoice</span><span className="font-medium">{purchase.invoiceNumber}</span></div>
                                <div><span className="text-xs text-(--muted) block">Supplier</span>{purchase.supplier?.name || "—"}</div>
                                <div><span className="text-xs text-(--muted) block">Date</span>{new Date(purchase.date).toLocaleDateString()}</div>
                                <div><span className="text-xs text-(--muted) block">Total</span>Rs. {purchase.totalAmount?.toLocaleString()}</div>
                            </div>

                            {/* Purchase items list */}
                            <div className="mt-2">
                                <p className="text-xs text-(--muted) mb-2 font-medium">Items in this purchase:</p>
                                <div className="space-y-1">
                                    {purchase.items?.map((it, i) => (
                                        <div key={i} className="flex justify-between text-xs px-3 py-2 bg-white rounded-xl border border-cyan-100">
                                            <span className="font-medium">{it.product?.name}</span>
                                            <span className="text-(--muted)">
                                                Qty: {it.quantity} &nbsp;•&nbsp;
                                                Rs. {it.price} &nbsp;•&nbsp;
                                                Batch: {it.batch?.batchNumber || it.batchNumber || "—"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── Step 2: Return Details ─────────────── */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-(--muted) uppercase tracking-wider">Step 2 — Return Details</p>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="* Return Date">
                                    <Input type="date" value={formData.returnDate}
                                        onChange={e => update("returnDate", e.target.value)} />
                                </FormField>
                                <FormField label="* Return Reason">
                                    <SearchableSelect
                                        options={RETURN_REASONS}
                                        value={formData.returnReason}
                                        onChange={val => update("returnReason", val)}
                                        placeholder="Select reason..."
                                    />
                                </FormField>
                            </div>
                        </div>

                        {/* ── Step 3: Item Selection ─────────────── */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-(--muted) uppercase tracking-wider">Step 3 — Select Item to Return</p>
                            <div className="p-4 rounded-2xl border border-(--border) space-y-4">
                                <FormField label="* Select Item from Purchase">
                                    <SearchableSelect
                                        options={purchaseItemOptions}
                                        value={currentItem.invoiceItem}
                                        onChange={(val) => {
                                            const found = purchaseItemOptions.find(o => o.value === val);
                                            if (!found?.data) return;
                                            const it = found.data;
                                            setCurrentItem({
                                                ...blankItem(),
                                                invoiceItem: val,
                                                product: it.product?._id || it.product || "",
                                                productName: it.product?.name || "",
                                                batch: it.batch?.batchNumber || it.batchNumber || "",
                                                expiryDate: it.batch?.expiryDate || it.expiryDate || "",
                                                originalQty: it.quantity || "",
                                                costPrice: it.price || "",
                                            });
                                        }}
                                        placeholder="Select item to return..."
                                    />
                                </FormField>

                                {/* Fields after item selected */}
                                {currentItem.product && (
                                    <>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <FormField label={`* Return Qty (max: ${currentItem.originalQty})`}>
                                                <Input type="number" min={1} max={currentItem.originalQty || undefined}
                                                    value={currentItem.returnQuantity}
                                                    onChange={e => updateCurrent("returnQuantity", e.target.value)}
                                                    placeholder="0" />
                                            </FormField>

                                            <FormField label="* Condition">
                                                <SearchableSelect options={CONDITIONS} value={currentItem.condition}
                                                    onChange={val => updateCurrent("condition", val)}
                                                    placeholder="Select condition..." />
                                            </FormField>

                                            <FormField label="Cut (Rs.)">
                                                <Input type="number" min={0} value={currentItem.cut}
                                                    onChange={e => updateCurrent("cut", e.target.value)}
                                                    placeholder="0.00" />
                                            </FormField>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField label="Notes">
                                                <Textarea rows={2} value={currentItem.notes}
                                                    onChange={e => updateCurrent("notes", e.target.value)}
                                                    placeholder="Notes..." />
                                            </FormField>

                                            {/* Preview */}
                                            <div className="p-3 rounded-2xl border border-(--border) bg-(--surface) space-y-1.5 text-sm">
                                                <p className="text-xs font-semibold text-(--muted) mb-2">Preview</p>
                                                <div className="flex justify-between">
                                                    <span className="text-(--muted) text-xs">Product</span>
                                                    <span className="font-medium">{currentItem.productName}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-(--muted) text-xs">Batch</span>
                                                    <span>{currentItem.batch || "—"}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-(--muted) text-xs">Original Qty</span>
                                                    <span>{currentItem.originalQty}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-(--muted) text-xs">Rate</span>
                                                    <span>Rs. {currentItem.costPrice}</span>
                                                </div>
                                                {currentItem.returnQuantity && currentItem.costPrice && (
                                                    <div className="flex justify-between border-t border-(--border) pt-1.5 mt-1">
                                                        <span className="text-(--muted) text-xs font-medium">Refund</span>
                                                        <span className="font-semibold text-green-600">
                                                            Rs. {Math.max(0, refundAmount).toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-2 justify-end">
                                            {editingIndex >= 0 && (
                                                <button type="button" onClick={handleCancel}
                                                    className="px-3 py-1.5 rounded-xl border border-(--border) text-xs text-(--muted) hover:text-(--text) transition">
                                                    Cancel Edit
                                                </button>
                                            )}
                                            <button type="button" onClick={handleAddItem}
                                                disabled={!currentItem.product || !currentItem.returnQuantity || !currentItem.condition}
                                                className="px-3 py-1.5 rounded-xl bg-cyan-600 text-white text-xs hover:bg-cyan-700 disabled:opacity-40 transition flex items-center gap-1">
                                                {editingIndex >= 0
                                                    ? <><CheckCircle className="w-3.5 h-3.5" /> Update Item</>
                                                    : <><Plus className="w-3.5 h-3.5" /> Confirm Item</>
                                                }
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ── Confirmed Items ────────────────────────── */}
                {items.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-(--muted) uppercase tracking-wider">Confirmed Items ({items.length})</p>
                        {items.map((item, i) => (
                            <div key={i} className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border transition ${editingIndex === i ? "border-cyan-500 bg-cyan-50" : "border-(--border)"}`}>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-medium text-(--text)">{getItemName(item)}</span>
                                    <span className="text-xs text-(--muted)">
                                        Qty: {item.returnQuantity} • {item.condition}
                                        {Number(item.cut) > 0 ? ` • Cut: Rs.${item.cut}` : ""}
                                        {" • "}Refund: Rs.{item.refundAmount?.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button type="button" onClick={() => handleEdit(i)}
                                        className="p-1.5 rounded-lg text-(--muted) hover:text-cyan-600 hover:bg-cyan-50 transition">
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" onClick={() => handleDelete(i)}
                                        className="p-1.5 rounded-lg text-(--muted) hover:text-red-500 hover:bg-red-50 transition">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-2 border-t border-(--border)">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 rounded-xl border border-(--border) text-sm text-(--muted) hover:text-(--text) transition">
                        Cancel
                    </button>
                    <button type="button" onClick={onSubmit}
                        disabled={isLoading || !items.length || !purchase}
                        className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm hover:bg-cyan-700 disabled:opacity-50 transition">
                        {isLoading ? "Saving..." : `Save Return (${items.length} items)`}
                    </button>
                </div>
            </div>
        </div>
    );
}