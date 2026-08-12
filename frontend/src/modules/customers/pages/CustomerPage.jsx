import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDeleteCustomer, useCustomers } from "../services/customers.service.js";
import { getCustomerLabels } from "../labels/customerLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import CustomerModal from "../components/CustomerModal.jsx";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";
import BigViewImage from "../../../shared/components/BigViewImage.jsx";

const IMAGE_BASE_URL = "http://localhost:5001";

const PlaceholderImg = ({ size = 11, name = "" }) => (
    <div className={`w-${size} h-${size} rounded-xl bg-(--surface-muted) flex items-center justify-center`}>
        {name ? <span className="text-lg font-bold text-(--muted)">{name.charAt(0).toUpperCase()}</span> : <User className="w-5 h-5 text-(--muted)" strokeWidth={1.5} />}
    </div>
);

export default function CustomerPage() {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getCustomerLabels(language);
    const navigate = useNavigate();
    
    const [deleteCustomer] = useDeleteCustomer();
    const [modal, setModal] = useState(null);
    const [imageLoadStates, setImageLoadStates] = useState({});

    const handleDelete = async (id) => {
        try {
            await deleteCustomer(id).unwrap();
            showSuccess(labels.customerDeleted);
        } catch (error) {
            showError(error?.data?.message || labels.failedToDelete);
        }
    };

    const handleImageLoad = (itemId) => {
        setImageLoadStates(prev => ({ ...prev, [itemId]: true }));
    };

    const handleImageError = (itemId) => {
        setImageLoadStates(prev => ({ ...prev, [itemId]: false }));
    };


    return (
        <div className="h-screen flex flex-col">
            {modal && <CustomerModal mode={modal.mode} customerId={modal.id} onClose={() => setModal(null)} />}

            <div className="flex-none">
                <PageHeading
                    heading={labels.customerManagement}
                    subheading={labels.manageCustomers}
                    leftActions={
                        <PermissionGuard 
                            execute={() => setModal({ mode: "create" })} 
                            permission="customers.create" 
                            isConfirmation={false}
                        >
                            <div>
                                <ScreenTabButton lucideIcon={Plus} text={labels.addCustomer} />
                            </div>
                        </PermissionGuard>
                    }
                />
            </div>

            <PaginatedList
                rtkQuery={useCustomers}
                limit={20}
                dataKey="data"
                wrapperClassName="flex-1"
                renderItems={(customers) => (
                    <div className="flex flex-col gap-0">
                        {/* Desktop header */}
                        <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-5 py-3 rounded-t-2xl text-xs font-bold uppercase tracking-wider"
                            style={{ background: "var(--surface-muted)", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                            <div className="col-span-4">{labels.name}</div>
                            <div className="col-span-2">{labels.phone}</div>
                            <div className="col-span-2">{labels.cnic}</div>
                            <div className="col-span-2">{labels.address}</div>
                            <div className="col-span-2">{labels.actions}</div>
                        </div>

                        {/* Desktop rows */}
                        {customers.map((customer, i) => (
                            <CustomerRow
                                key={customer._id}
                                customer={customer}
                                index={i}
                                imageLoadStates={imageLoadStates}
                                onEdit={() => setModal({ mode: "update", id: customer._id })}
                                onDelete={() => handleDelete(customer._id)}
                                onView={() => navigate(`/customers/${customer._id}`)}
                                onImageLoad={handleImageLoad}
                                onImageError={handleImageError}
                            />
                        ))}

                        {/* Mobile / Tablet cards */}
                        <div className="lg:hidden flex flex-col gap-3 pt-1">
                            {customers.map((customer) => (
                                <div key={`m-${customer._id}`} className="rounded-2xl p-4 border transition-all duration-150 hover:shadow-md"
                                    style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 2px 12px rgba(64,45,28,0.07)" }}>
                                    <div className="flex items-start gap-3">
                                        <div className="relative shrink-0">
                                            {customer.image && imageLoadStates[customer._id] === true ? (
                                                <BigViewImage 
                                                    src={`${IMAGE_BASE_URL}/uploads/${customer.image}`} 
                                                    alt={customer.name} 
                                                    className="w-16 h-16 rounded-xl object-cover ring-1 ring-(--border)" 
                                                    onLoad={() => handleImageLoad(customer._id)}
                                                    onError={() => handleImageError(customer._id)}
                                                />
                                            ) : (
                                                <>
                                                    {customer.image && imageLoadStates[customer._id] === undefined ? (
                                                        <BigViewImage 
                                                            src={`${IMAGE_BASE_URL}/uploads/${customer.image}`} 
                                                            alt={customer.name} 
                                                            className="w-16 h-16 rounded-xl object-cover ring-1 ring-(--border)" 
                                                            onLoad={() => handleImageLoad(customer._id)}
                                                            onError={() => handleImageError(customer._id)}
                                                        />
                                                    ) : (
                                                        <PlaceholderImg size={16} name={customer.name} />
                                                    )}
                                                </>
                                            )}
                                            {customer.isActive && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--surface)]"></div>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-(--ink) text-sm leading-snug truncate">{customer.name}</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-(--muted) mt-1">
                                                {customer.phoneNo && <span className="truncate">Phone: <span className="font-mono text-(--ink)">{customer.phoneNo}</span></span>}
                                                {customer.cnic && <span className="truncate">CNIC: <span className="font-mono text-(--ink)">{customer.cnic}</span></span>}
                                                {customer.address && <span className="truncate">Address: <span className="text-(--ink)">{customer.address}</span></span>}
                                                <span>Status: <span className="px-2 py-0.5 rounded-lg text-xs font-semibold" style={{ background: customer.isActive ? "rgba(15,118,110,0.1)" : "rgba(107,114,128,0.1)", color: customer.isActive ? "var(--accent-2)" : "#6b7280" }}>{customer.isActive ? labels.active : labels.inactive}</span></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                                        <button
                                            onClick={() => navigate(`/customers/${customer._id}`)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all border hover:border-(--accent-2) hover:text-(--accent-2)"
                                            style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--muted)" }}
                                        >
                                            <Eye size={14} />
                                        </button>
                                        <PermissionGuard execute={() => setModal({ mode: "update", id: customer._id })} permission="customers.update" isConfirmation={true}>
                                            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all border hover:border-(--accent-2) hover:text-(--accent-2)"
                                                style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--muted)" }}
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        </PermissionGuard>
                                        <PermissionGuard execute={() => handleDelete(customer._id)} permission="customers.delete" isConfirmation={true}>
                                            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all border hover:border-red-400 hover:text-red-500"
                                                style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--muted)" }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </PermissionGuard>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                renderEmpty={() => <p className="text-center py-12 text-sm" style={{ color: "var(--muted)" }}>{labels.noCustomersFound}</p>}
            />
        </div>
    );
}

function CustomerRow({ customer, onEdit, onDelete, onView, index, imageLoadStates, onImageLoad, onImageError }) {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getCustomerLabels(language);
    
    const isActive = customer?.isActive ?? true;

    return (
        <div 
            className="hidden lg:grid lg:grid-cols-12 gap-3 px-5 py-3.5 items-center transition-all duration-150 hover:bg-(--surface-muted) group"
            style={{ background: index % 2 === 0 ? "var(--surface)" : "rgba(255,250,243,0.6)", borderBottom: "1px solid var(--border)" }}
        >
            <div className="col-span-4 flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                    {customer.image && imageLoadStates[customer._id] === true ? (
                        <div className="relative">
                            <BigViewImage 
                                src={`${IMAGE_BASE_URL}/uploads/${customer.image}`} 
                                alt={customer.name} 
                                className="w-11 h-11 rounded-xl object-cover ring-1 ring-(--border) group-hover:ring-(--accent-2) transition-all" 
                                onLoad={() => onImageLoad(customer._id)}
                                onError={() => onImageError(customer._id)}
                            />
                            {isActive && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--surface)]"></div>}
                        </div>
                    ) : (
                        <div className="relative">
                            {customer.image && imageLoadStates[customer._id] === undefined ? (
                                <BigViewImage 
                                    src={`${IMAGE_BASE_URL}/uploads/${customer.image}`} 
                                    alt={customer.name} 
                                    className="w-11 h-11 rounded-xl object-cover ring-1 ring-(--border) group-hover:ring-(--accent-2) transition-all" 
                                    onLoad={() => onImageLoad(customer._id)}
                                    onError={() => onImageError(customer._id)}
                                />
                            ) : (
                                <PlaceholderImg size={11} name={customer.name} />
                            )}
                            {isActive && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--surface)]"></div>}
                        </div>
                    )}
                </div>
                <div className="font-semibold text-(--ink) truncate text-sm min-w-0">{customer.name}</div>
            </div>
            <div className="col-span-2 text-sm text-(--muted) font-mono truncate">{customer.phoneNo ?? "—"}</div>
            <div className="col-span-2 text-sm text-(--muted) font-mono truncate">{customer.cnic ?? "—"}</div>
            <div className="col-span-2 text-sm text-(--muted) truncate">{customer.address ?? "—"}</div>
            <div onClick={e => e.stopPropagation()} className="col-span-2 flex items-center gap-1.5 flex-wrap">
                <button
                    onClick={onView}
                    className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) transition-all duration-150 hover:scale-105 hover:border-(--accent-2) hover:text-(--accent-2)"
                >
                    <Eye size={15} />
                </button>
                <PermissionGuard execute={onEdit} permission="customers.update" isConfirmation={true}>
                    <button className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) transition-all duration-150 hover:scale-105 hover:border-(--accent-2) hover:text-(--accent-2)">
                        <Pencil size={15} />
                    </button>
                </PermissionGuard>
                <PermissionGuard execute={onDelete} permission="customers.delete" isConfirmation={true}>
                    <button className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) transition-all duration-150 hover:scale-105 hover:border-red-400 hover:text-red-500">
                        <Trash2 size={15} />
                    </button>
                </PermissionGuard>
            </div>
        </div>
    );
}
