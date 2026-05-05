// ReturnPage.jsx
import { useState } from "react";
import { useDeleteReturn, useReturns } from "../services/return.service.js";
import PaginatedTable from "../../../components/common/PaginatedTable.jsx";
import AddReturn from "../components/AddReturn";
import UpdateReturn from "../components/UpdateReturn";
// import ReturnDetail from "../components/ReturnDetail";

export default function ReturnPage() {
    const [deleteReturn] = useDeleteReturn();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [detailId, setDetailId] = useState(null);

    const columns = {
        "Return #": "returnNumber",
        "Type": "returnType",
        "Reason": "returnReason",
        "Status": "status",
        "Items": "totalItems",
        "Total Qty": "totalQuantity",
        "Total Refund": "totalRefund",
        "Date": "returnDate",
    };

    return (
        <div className="">
            {isAddOpen && (
                <AddReturn open={isAddOpen} onClose={() => setIsAddOpen(false)} />
            )}
            {/* {detailId && (
                <ReturnDetail id={detailId} onClose={() => setDetailId(null)} />
            )} */}

            <div className="flex flex-wrap items-center gap-3 mb-4">
                <button onClick={() => setIsAddOpen(true)} className="btn-add">
                    + Add Return
                </button>
            </div>

            <PaginatedTable
                endpoint="/returns/paginate"
                columns={columns}
                limit={20}
                isUpdate={true}
                isDelete={true}
                isView={true}
                UpdateComp={UpdateReturn}
                onDelete={(id) => deleteReturn(id)}
                onView={(id) => setDetailId(id)}
                rtkGetDataQuery={useReturns}
            />
        </div>
    );
}