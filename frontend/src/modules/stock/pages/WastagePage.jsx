// import { useEffect, useState } from "react";
// import { useSelector, useDispatch } from "react-redux";
// import { Plus, Clock, Search, X } from "lucide-react";

// import { getItems } from "@/features/inventory/items/itemThunk";
// import {
//     getItemUsages,
//     addItemUsage,
//     editItemUsage,
//     deleteItemUsage,
// } from "@/features/inventory/usage/usageThunk";
// import ActionButtons from "../../../components/common/ActionButtons";
// import WastageModal from "../../../components/WastageModel";
// import ViewWastageDialog from "../../../components/ViewWastegeModel";
// import { WastageMockData } from "../../../data/mockData";

// export default function ItemWastagePage() {
//     const dispatch = useDispatch();

//     const items = useSelector(
//         (state) => state.item.list.filter((i) => i.isActive) || [],
//     );
//     // const wastages = useSelector((state) => state.usage.list || []);

//     const wastages = [...WastageMockData];
//     const language = useSelector((state) => state.auth.user?.language || "en");

//     const [formOpen, setFormOpen] = useState(false);
//     const [editingWastage, setEditingWastage] = useState(null);
//     const [viewWastage, setViewWastage] = useState(null);
//     const [viewModal, setViewModal] = useState(false);
//     const [searchTerm, setSearchTerm] = useState("");

//     useEffect(() => {
//         dispatch(getItems());
//         dispatch(getItemUsages());
//     }, [dispatch]);

//     const handleAdd = () => {
//         setEditingWastage(null);
//         setFormOpen(true);
//     };

//     const handleEdit = (wastage) => {
//         setEditingWastage(wastage);
//         setFormOpen(true);
//     };

//     const handleDelete = (wastage) => {
//         dispatch(deleteItemUsage({ id: wastage._id }));
//     };

//     const handleView = (wastage) => {
//         setViewWastage(wastage);
//         setViewModal(true);
//     };

//     const handleSubmit = async (data) => {
//         if (editingWastage)
//             await dispatch(
//                 editItemUsage({
//                     id: editingWastage._id,
//                     body: data,
//                 }),
//             );
//         else await dispatch(addItemUsage(data));

//         setFormOpen(false);
//         setEditingWastage(null);
//         dispatch(getItemWastages());
//     };

//     const filteredWastages = wastages.filter((w) =>
//         w.items?.some(
//             (i) =>
//                 i.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 i.quantity.toString().includes(searchTerm),
//         ),
//     );

//     return (
//         <div className="space-y-6 bg-(--surface) min-h-[calc(100vh-200px)] rounded-3xl p-6 border border-(--border) shadow-[0_18px_50px_rgba(64,45,28,0.12)]">
//             {/* Header */}
//             <div className="flex flex-col gap-4 w-full">
//                 <div className="flex items-center gap-3 w-full flex-wrap">
//                     <button onClick={handleAdd} className="btn-add">
//                         <Plus className="w-4 h-4" />
//                         {language === "en"
//                             ? "Add Wastage"
//                             : "ضائع شدہ شامل کریں"}
//                     </button>

//                     <div className="flex-1 min-w-[200px]">
//                         <div className="relative w-full">
//                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--muted)" />
//                             <input
//                                 type="text"
//                                 placeholder={
//                                     language === "en"
//                                         ? "Search..."
//                                         : "...تلاش کریں"
//                                 }
//                                 value={searchTerm}
//                                 onChange={(e) => setSearchTerm(e.target.value)}
//                                 className="input-search w-full"
//                             />
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Wastage Cards */}
//             <div className="flex flex-wrap gap-6 items-start">
//                 {filteredWastages.length > 0 ? (
//                     filteredWastages.map((wastage) => (
//                         <div
//                             key={wastage._id}
//                             className="bg-(--surface) border border-(--border) rounded-3xl shadow-[0_14px_30px_rgba(64,45,28,0.10)] p-4 flex flex-col hover:shadow-[0_18px_40px_rgba(64,45,28,0.16)] transition w-[350px]"
//                         >
//                             <div className="space-y-2 text-sm text-(--muted)">
//                                 {language === "en"
//                                     ? "Wasted Items"
//                                     : "ضائع شدہ اشیاء"}{" "}
//                                 {wastage.items?.length}
//                             </div>

//                             <div className="mt-2 text-sm text-(--muted) flex items-center gap-2">
//                                 <Clock className="w-4 h-4" />
//                                 {wastage.date
//                                     ? new Date(wastage.date).toLocaleString()
//                                     : "—"}
//                             </div>

//                             <div className="mt-3 flex justify-between gap-1">
//                                 <button
//                                     onClick={() => handleView(wastage)}
//                                     className="text-xs px-2 py-0.5 rounded-lg border hover:text-(--accent-2)"
//                                 >
//                                     {language === "en"
//                                         ? "View Details"
//                                         : "تفصیلات دیکھیں"}
//                                 </button>

//                                 <ActionButtons
//                                     onEdit={() => handleEdit(wastage)}
//                                     onDelete={() => handleDelete(wastage)}
//                                     EditNameRole="wastageEdit"
//                                     deleteNameRole="wastageDelete"
//                                 />
//                             </div>
//                         </div>
//                     ))
//                 ) : (
//                     <p className="text-(--muted) text-center py-8">
//                         {language === "en"
//                             ? "No wastage found."
//                             : "کوئی ضیاع نہیں ملا۔"}
//                     </p>
//                 )}
//             </div>

//             {/* Add/Edit Modal */}
//             {formOpen && (
//                 <WastageModal
//                     key={editingWastage?._id || "new"}
//                     open={formOpen}
//                     onClose={() => {
//                         setFormOpen(false);
//                         setEditingWastage(null);
//                     }}
//                     onSubmit={handleSubmit}
//                     defaultValues={editingWastage}
//                     items={items}
//                 />
//             )}

//             {/* View Modal */}
//             {viewModal && viewWastage && (
//                 <ViewWastageDialog
//                     open={viewModal}
//                     wastage={viewWastage}
//                     language={language}
//                     onClose={() => setViewModal(false)}
//                 />
//             )}
//         </div>
//     );
// }





















// ============================================================
//  features/wastage/pages/WastagePage.jsx
// ============================================================

import { useState } from "react";
import { useDeleteWastage, useWastages } from "../services/wastage.service";
import PaginatedTable from "../../../components/common/PaginatedTable.jsx";
import AddWastage from "../components/AddWastages.jsx";
import UpdateWastage from "../components/UpdateWastages.jsx";
// import WastageDetail from "../components/WastageDetail.jsx";

export default function WastagePage() {
let {data: wastages}= useWastages()
    const [deleteWastage] = useDeleteWastage();

    // ── Modal visibility ─────────────────────────────────────
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [detailId, setDetailId] = useState(null);  // null = closed, string id = open

    // ── Table columns ────────────────────────────────────────
    const columns = {
        "Wastage #": "wastageNumber",
        "Reason": "reason",
        "Status": "status",
        "Items": "totalItems",
        "Total Qty": "totalQuantity",
        "Total Loss": "totalLossAmount",
        "Date": "wastageDate",
        "Notes": "notes",
    };

    return (
        <div className="">

            {/* ── Add modal ───────────────────────────────── */}
            {isAddOpen && (
                <AddWastage
                    open={isAddOpen}
                    onClose={() => setIsAddOpen(false)}
                />
            )}

            {/* ── Detail view — sirf id pass, baki component sambhale ga */}
            {/* {detailId && (
                <WastageDetail
                    id={detailId}
                    onClose={() => setDetailId(null)}
                />
            )} */}

            {/* ── Toolbar ─────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <button onClick={() => setIsAddOpen(true)} className="btn-add">
                    + Add Wastage
                </button>
            </div>

            {/* ── PaginatedTable — bilkul Products.jsx jaisi pattern ── */}
            <PaginatedTable
                endpoint="/wastages/paginate"
                columns={columns}
                limit={20}
                isUpdate={true}
                isDelete={true}
                isView={true}
                UpdateComp={UpdateWastage}
                onDelete={(id) => deleteWastage(id)}
                onView={(id) => setDetailId(id)}
                rtkGetDataQuery={useWastages}
            />
        </div>
    );
}