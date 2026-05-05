

import { useState } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useDeletePurchase, usePurchases } from "../services/purchases.service.js";
import PaginatedTable from "../../../components/common/PaginatedTable.jsx";
import ViewPurchaseDetail from "../components/ViewPurchaseDetail.jsx";
import AddPurchases from "../components/AddPurchases.jsx";
import UpdatePurchaseModal from "../components/UpdatePurchase.jsx";

export default function ItemPurchasePage() {
    let [deletePurchaseMutation]= useDeletePurchase()
    const language = useSelector((state) => state.auth.user?.language || "en");

    const [viewItem, setViewItem] = useState(null);
    const [viewModel, setViewModel] = useState(false);
    const [addPurchasesVisibility, setAddPurchasesVisibility] = useState(false)

    // ── Table columns config ──────────────────────────────────
    const columns = {
        "Supplier": "supplier.name",
        "Total": "totalAmount",
        "Items": "items.length",
        "Date": "createdAt",
    };







    async function handlePurchaseDelete(purchaseDocId) {
        try {
            console.log("The delete is clicked")
            deletePurchaseMutation(purchaseDocId)
        } catch (error) {
            console.error(error)
        }
    }



    return (
        <div className="">


            {addPurchasesVisibility && <AddPurchases open={addPurchasesVisibility} onClose={() => setAddPurchasesVisibility(false)} />}

            {/* Header Buttons */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <button className="btn-add" onClick={() => setAddPurchasesVisibility(true)}>
                    <Plus className="w-4 h-4" />
                    {language === "en" ? "Add Purchase" : "خرید شامل کریں"}
                </button>
            </div>

            {/* Paginated Table */}
            <PaginatedTable
                endpoint="/purchases/pagination"
                columns={columns}
                limit={20}
                isUpdate={true}
                isDelete={true}
                onDelete={(id)=>{handlePurchaseDelete(id)}}
                UpdateComp={UpdatePurchaseModal}
                rtkGetDataQuery={usePurchases}
                onRowClick={(purchase) => {
                    setViewItem(purchase);
                    setViewModel(true);
                }}
            />

            {/* View Details Modal */}
            {viewModel && viewItem && (
                <ViewPurchaseDetail
                    purchase={viewItem}
                    onClose={() => setViewModel(false)}
                    language={language}
                />
            )}
        </div>
    );
}