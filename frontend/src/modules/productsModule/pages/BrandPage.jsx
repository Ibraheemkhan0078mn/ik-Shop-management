// features/productsModule/pages/BrandPage.jsx
import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";
import { useDeleteBrandMutation, useGetBrandsQuery } from "../services/brand.service";
import BrandCRUDModal from "../components/BrandCRUDModal";
import { getProductLabels } from "../labels/productLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";

export default function BrandPage() {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getProductLabels(language);

    const [mode, setMode] = useState("list");
    const [selectedBrandId, setSelectedBrandId] = useState(null);
    const [deleteBrand] = useDeleteBrandMutation();
    const [showModal, setShowModal] = useState(false);

    const handleDelete = async (id) => {
        try {
            await deleteBrand(id).unwrap();
            showSuccess(labels.brandDeleted);
        } catch (error) {
            showError(error?.data?.message || labels.failedToDelete);
        }
    };

    const handleCreate = () => {
        setSelectedBrandId(null);
        setMode("create");
        setShowModal(true);
    };

    const handleEdit = (id) => {
        setSelectedBrandId(id);
        setMode("edit");
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setMode("list");
        setSelectedBrandId(null);
    };

    const renderItems = (items) => {
        if (!items?.length) return null;
        return (
            <div className="flex flex-col">
                {/* Desktop Header */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-[var(--surface-muted)] rounded-t-xl border-b border-[var(--border)] text-xs font-semibold text-[var(--muted)]">
                    <div className="col-span-6">{labels.name}</div>
                    <div className="col-span-3">{labels.status}</div>
                    <div className="col-span-3">{labels.actions}</div>
                </div>

                {/* Desktop Rows */}
                {items.map((item) => (
                    <div key={item._id} data-testid={`brand-row-${item._id}`} className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-[var(--surface)] border-b border-[var(--border)] hover:bg-[var(--surface-muted)] transition-all items-center">
                        <div className="col-span-6 font-medium text-[var(--ink)] truncate flex items-center gap-2">
                            {item.isActive && (
                                <div className="w-2 h-2 bg-green-500 rounded-full shrink-0"></div>
                            )}
                            <span data-testid={`brand-name-${item._id}`}>{item.name}</span>
                        </div>
                        <div className="col-span-3">
                            <span data-testid={`brand-status-${item._id}`} className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.isActive
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                            }`}>
                                {item.isActive ? labels.active : labels.inactive}
                            </span>
                        </div>
                        <div className="col-span-3 flex items-center gap-2">
                            <button
                                id={`brand-edit-${item._id}`}
                                onClick={() => handleEdit(item._id)}
                                className="p-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] hover:border-[var(--accent-2)] hover:text-[var(--accent-2)] transition-all"
                            >
                                <Edit size={16} />
                            </button>
                            <PermissionGuard
                                execute={() => handleDelete(item._id)}
                                permission="brands.delete"
                                isConfirmation={true}
                            >
                                <button id={`brand-delete-${item._id}`} className="p-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] hover:border-red-500 hover:text-red-500 transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </PermissionGuard>
                        </div>
                    </div>
                ))}

                {/* Mobile Cards */}
                {items.map((item) => (
                    <div key={`m-${item._id}`} className="md:hidden bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)] mb-3">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-[var(--ink)] truncate flex items-center gap-2">
                                    {item.isActive && (
                                        <div className="w-2 h-2 bg-green-500 rounded-full shrink-0"></div>
                                    )}
                                    {item.name}
                                </h3>
                                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                    item.isActive 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-gray-100 text-gray-700'
                                }`}>
                                    {item.isActive ? labels.active : labels.inactive}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                            <button 
                                onClick={() => handleEdit(item._id)}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] hover:border-[var(--accent-2)] hover:text-[var(--accent-2)] transition-all text-sm"
                            >
                                <Edit size={16} /> {labels.edit}
                            </button>
                            <PermissionGuard 
                                execute={() => handleDelete(item._id)} 
                                permission="brands.delete" 
                                isConfirmation={true}
                            >
                                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] hover:border-red-500 hover:text-red-500 transition-all text-sm">
                                    <Trash2 size={16} /> {labels.delete}
                                </button>
                            </PermissionGuard>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div id="brands-page" className="h-full flex flex-col overflow-hidden">
            {/* Brand CRUD Modal */}
            <BrandCRUDModal
                mode={mode}
                brandId={selectedBrandId}
                open={showModal}
                onClose={handleCloseModal}
            />

            {/* List mode */}
            <div className="flex-none">
                <PageHeading
                    heading={labels.brands}
                    subheading={labels.manageBrands}
                    leftActions={
                        <PermissionGuard
                            execute={handleCreate}
                            permission="brands.create"
                            isConfirmation={false}
                        >
                            <div id="brands-add-button">
                                <ScreenTabButton lucideIcon={Plus} text={labels.add} />
                            </div>
                        </PermissionGuard>
                    }
                />
            </div>
            <div id="brands-list-container" className="flex-1 overflow-hidden">
                <PaginatedList
                    rtkQuery={useGetBrandsQuery}
                    limit={10}
                    dataKey="data"
                    wrapperClassName="h-full"
                    renderItems={renderItems}
                />
            </div>
        </div>
    );
}
