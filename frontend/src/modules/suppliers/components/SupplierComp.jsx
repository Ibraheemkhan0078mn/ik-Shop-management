import { useState } from "react";
import { useDeleteSupplier, useSuppliers } from "../services/suppliers.service.js";
import { useUser } from "../../auth/services/auth.service.js";
import PaginatedTable from "../../../components/common/PaginatedTable.jsx";
import SupplierCrudModel from "../components/SupplierCrudModel.jsx";

export default function SupplierComp({setVisibility}) {
    const { data: userQuery } = useUser();
    const [deleteSupplier] = useDeleteSupplier();
    const [isAddOpen, setIsAddOpen] = useState(false);

    const language = userQuery?.data?.language || userQuery?.language || "en";

    const columns = {
        "Supplier Name": "name",
        "Contact Person": "contactPerson",
        "Type": "type",
        "Phone": "phone",
        "Email": "email",
        "Status": "isActive",
    };

    return (
        <div
        onClick={()=>{setVisibility(false)}}
        className="">
            {isAddOpen && (
                <SupplierCrudModel
                    setVisibility={setIsAddOpen}
                    operation="create"
                />
            )}

            <div className="">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <button onClick={() => setIsAddOpen(true)} className="btn-add">
                        {language === "en" ? "+ Add Supplier" : "+ سپلائر شامل کریں"}
                    </button>
                </div>
            </div>

            <PaginatedTable
                endpoint="/suppliers/pagination"
                columns={columns}
                limit={20}
                isUpdate={true}
                isDelete={true}
                UpdateComp={SupplierCrudModel}
                onDelete={(id) => deleteSupplier(id)}
                rtkGetDataQuery={useSuppliers}
            />
        </div>
    );
}