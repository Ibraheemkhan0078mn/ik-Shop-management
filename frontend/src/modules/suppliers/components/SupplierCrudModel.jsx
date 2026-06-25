import { useState, useEffect } from "react";
import {
    useCreateSupplier,
    useUpdateSupplier,
    useSupplier,
} from "../services/suppliers.service.js";
import FormLayout from "../../../shared/components/FormLayout.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";

const SupplierCrudModel = ({ setVisibility, id, operation = "create" }) => {
    const { data: supplierData } = useSupplier(id, { skip: operation === "create" });
     const [createSupplier] = useCreateSupplier();
    const [updateSupplier] = useUpdateSupplier();

    const [formData, setFormData] = useState({
        id: "",
        name: "",
        contactPerson: "",
        type: "Other",
        email: "",
        phone: "",
        address: "",
        taxId: "",
        notes: "",
        isActive: true,
    });

    useEffect(() => {
        if (operation === "update" && supplierData) {
            setFormData({
                id: supplierData._id,
                name: supplierData.name,
                contactPerson: supplierData.contactPerson || "",
                type: supplierData.type || "Other",
                email: supplierData.email || "",
                phone: supplierData.phone || "",
                address: supplierData.address || "",
                taxId: supplierData.taxId || "",
                notes: supplierData.notes || "",
                isActive: supplierData.isActive ?? true,
            });
        }
    }, [supplierData]);

    const config = {
        title: operation === "update" ? "Update Supplier" : "Create Supplier",
        columns: 2,
        submitLabel: operation.toLocaleUpperCase() + " Supplier",
        fields: [
            {
                name: "name",
                label: "Supplier Name",
                type: "text",
                placeholder: "Supplier ka naam likhein",
                required: true,
            },
            {
                name: "contactPerson",
                label: "Contact Person",
                type: "text",
                placeholder: "Contact person ka naam",
            },
            {
                type: "select",
                name: "type",
                label: "Supplier Type",
                options: ["Distributor", "Wholesaler", "Manufacturer", "Other"].map((t) => ({
                    label: t,
                    value: t,
                })),
                placeholder: "Type select karein",
            },
            {
                name: "phone",
                label: "Phone",
                type: "text",
                placeholder: "Phone number",
            },
            {
                name: "email",
                label: "Email",
                type: "email",
                placeholder: "Email address",
            },
            {
                name: "taxId",
                label: "Tax ID",
                type: "text",
                placeholder: "Tax ID / NTN",
            },
            {
                name: "address",
                label: "Address",
                type: "textarea",
                placeholder: "Supplier ka address",
                span: "full",
            },
            {
                name: "notes",
                label: "Notes",
                type: "textarea",
                placeholder: "Internal notes",
                span: "full",
            },
        ],
    };

    async function onSubmit() {
        try {
            if (operation === "update") {
                await updateSupplier(formData).unwrap();
                showSuccess("Supplier updated successfully");
            } else {
                await createSupplier(formData).unwrap();
                showSuccess("Supplier created successfully");
            }
            setVisibility(false);
        } catch (error) {
            showError(error?.data?.message || "Operation failed");
        }
    }

    return (
        <div className="z-50">
            <FormLayout
                setVisibility={setVisibility}
                config={config}
                formData={formData}
                setFormData={setFormData}
                onSubmit={onSubmit}
                zIndex={100}
            />
        </div>
    );
};

export default SupplierCrudModel;
