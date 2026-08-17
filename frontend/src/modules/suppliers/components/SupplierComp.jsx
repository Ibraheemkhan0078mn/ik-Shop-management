import { useState } from "react";
import { useDeleteSupplier, useSuppliers } from "../services/suppliers.service.js";
import { useUser } from "../../auth/services/auth.service.js";
import SupplierModal from "../components/SupplierModal.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import { Edit, Trash2, Truck } from "lucide-react";
import BigViewImage from "../../../shared/components/BigViewImage.jsx";
import ConfirmDialog from "../../../shared/components/ConfirmationDialog.jsx";

const IMAGE_BASE = "http://localhost:5001/uploads";

const PlaceholderImg = ({ size = 11, name = "" }) => (
    <div className={`w-${size} h-${size} rounded-xl bg-(--surface-muted) flex items-center justify-center`}>
        {name ? <span className="text-lg font-bold text-(--muted)">{name.charAt(0).toUpperCase()}</span> : <Truck className="w-5 h-5 text-(--muted)" strokeWidth={1.5} />}
    </div>
);

const StatusBadge = ({ active }) => (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>
        {active ? "Active" : "Inactive"}
    </span>
);

export default function SupplierComp({ setVisibility }) {
    const { data: userQuery } = useUser();
    const [deleteSupplier] = useDeleteSupplier();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [imageLoadStates, setImageLoadStates] = useState({});

    const language = userQuery?.data?.language || userQuery?.language || "en";

    const handleDelete = async (id) => {
        try {
            await deleteSupplier(id).unwrap();
            showSuccess("Supplier deleted successfully");
        } catch (error) {
            showError(error?.data?.message || "Failed to delete supplier");
        }
    };

    const handleEdit = (row) => {
        setEditId(row._id);
    };

    const handleImageLoad = (itemId) => {
        setImageLoadStates(prev => ({ ...prev, [itemId]: true }));
    };

    const handleImageError = (itemId) => {
        setImageLoadStates(prev => ({ ...prev, [itemId]: false }));
    };

    const renderItems = (items) => {
        if (!items?.length) return null;
        return (
            <div className="flex flex-col gap-0">
                {/* Desktop header */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-5 py-3 rounded-t-2xl text-xs font-bold uppercase tracking-wider"
                    style={{ background: "var(--surface-muted)", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                    <div className="col-span-4">Supplier Name</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Phone</div>
                    <div className="col-span-2">Email</div>
                    <div className="col-span-2">Actions</div>
                </div>

                {/* Desktop rows */}
                {items.map((item, i) => (
                    <div key={item._id}
                        className="hidden lg:grid lg:grid-cols-12 gap-3 px-5 py-3.5 items-center transition-all duration-150 hover:bg-(--surface-muted) group"
                        style={{ background: i % 2 === 0 ? "var(--surface)" : "rgba(255,250,243,0.6)", borderBottom: "1px solid var(--border)" }}>
                        <div className="col-span-4 flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                                {item.image && imageLoadStates[item._id] === true ? (
                                    <div className="relative">
                                        <BigViewImage 
                                            src={`${IMAGE_BASE}/${item.image}`} 
                                            alt={item.name} 
                                            className="w-11 h-11 rounded-xl object-cover ring-1 ring-(--border) group-hover:ring-(--accent-2) transition-all" 
                                            onLoad={() => handleImageLoad(item._id)}
                                            onError={() => handleImageError(item._id)}
                                        />
                                        {item.isActive && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--surface)]"></div>}
                                    </div>
                                ) : (
                                    <div className="relative">
                                        {item.image && imageLoadStates[item._id] === undefined ? (
                                            <BigViewImage 
                                                src={`${IMAGE_BASE}/${item.image}`} 
                                                alt={item.name} 
                                                className="w-11 h-11 rounded-xl object-cover ring-1 ring-(--border) group-hover:ring-(--accent-2) transition-all" 
                                                onLoad={() => handleImageLoad(item._id)}
                                                onError={() => handleImageError(item._id)}
                                            />
                                        ) : (
                                            <PlaceholderImg size={11} name={item.name} />
                                        )}
                                        {item.isActive && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--surface)]"></div>}
                                    </div>
                                )}
                            </div>
                            <div className="font-semibold text-(--ink) truncate text-sm min-w-0">{item.name}</div>
                        </div>
                        <div className="col-span-2 text-sm text-(--muted) truncate">{item.type || "—"}</div>
                        <div className="col-span-2 text-sm text-(--muted) font-mono truncate">{item.phone || "—"}</div>
                        <div className="col-span-2 text-sm text-(--muted) truncate">{item.email || "—"}</div>
                        <div onClick={e => e.stopPropagation()} className="col-span-2 flex items-center gap-1.5 flex-wrap">
                            <button 
                                onClick={() => handleEdit(item._id)}
                                className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) transition-all duration-150 hover:scale-105 hover:border-(--accent-2) hover:text-(--accent-2)"
                            >
                                <Edit size={15} />
                            </button>
                            <ConfirmDialog message="Delete this supplier?" onConfirm={() => handleDelete(item._id)}>
                                <button
                                    className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) transition-all duration-150 hover:scale-105 hover:border-red-400 hover:text-red-500"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </ConfirmDialog>
                        </div>
                    </div>
                ))}

                {/* Mobile / Tablet cards */}
                <div className="lg:hidden flex flex-col gap-3 pt-1">
                    {items.map((item) => (
                        <div key={`m-${item._id}`} className="rounded-2xl p-4 border transition-all duration-150 hover:shadow-md"
                            style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 2px 12px rgba(64,45,28,0.07)" }}>
                            <div className="flex items-start gap-3">
                                <div className="relative shrink-0">
                                    {item.image && imageLoadStates[item._id] === true ? (
                                        <BigViewImage 
                                            src={`${IMAGE_BASE}/${item.image}`} 
                                            alt={item.name} 
                                            className="w-16 h-16 rounded-xl object-cover ring-1 ring-(--border)" 
                                            onLoad={() => handleImageLoad(item._id)}
                                            onError={() => handleImageError(item._id)}
                                        />
                                    ) : (
                                        <>
                                            {item.image && imageLoadStates[item._id] === undefined ? (
                                                <BigViewImage 
                                                    src={`${IMAGE_BASE}/${item.image}`} 
                                                    alt={item.name} 
                                                    className="w-16 h-16 rounded-xl object-cover ring-1 ring-(--border)" 
                                                    onLoad={() => handleImageLoad(item._id)}
                                                    onError={() => handleImageError(item._id)}
                                                />
                                            ) : (
                                                <PlaceholderImg size={16} name={item.name} />
                                            )}
                                        </>
                                    )}
                                    {item.isActive && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--surface)]"></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-(--ink) text-sm leading-snug truncate">{item.name}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-(--muted) mt-1">
                                        {item.type && <span className="truncate">Type: <span className="font-mono text-(--ink)">{item.type}</span></span>}
                                        {item.phone && <span className="truncate">Phone: <span className="font-mono text-(--ink)">{item.phone}</span></span>}
                                        {item.email && <span className="truncate">Email: <span className="text-(--ink)">{item.email}</span></span>}
                                        <span>Status: <StatusBadge active={item.isActive} /></span>
                                    </div>
                                </div>
                            </div>
                            <div onClick={e => e.stopPropagation()} className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                                <button 
                                    onClick={() => handleEdit(item._id)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all border hover:border-(--accent-2) hover:text-(--accent-2)"
                                    style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--muted)" }}
                                >
                                    <Edit size={14} />
                                </button>
                                <ConfirmDialog message="Delete this supplier?" onConfirm={() => handleDelete(item._id)}>
                                    <button
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all border hover:border-red-400 hover:text-red-500"
                                        style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--muted)" }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </ConfirmDialog>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div
            onClick={() => { setVisibility(false) }}
            className="">
            {isAddOpen && (
                <SupplierModal
                    mode="create"
                    onClose={() => setIsAddOpen(false)}
                    onSuccess={() => setIsAddOpen(false)}
                />
            )}

            {editId && (
                <SupplierModal
                    mode="update"
                    supplierId={editId}
                    onClose={() => setEditId(null)}
                    onSuccess={() => setEditId(null)}
                />
            )}

            <div className="">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <button onClick={() => setIsAddOpen(true)} className="btn-add">
                        {language === "en" ? "+ Add Supplier" : "+ سپلائر شامل کریں"}
                    </button>
                </div>
            </div>

            <PaginatedList
                rtkQuery={useSuppliers}
                limit={20}
                dataKey="data"
                wrapperClassName="h-full"
                renderItems={renderItems}
            />
        </div>
    );
}
