import { useState } from "react";
import { Plus, Trash2, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { useGetStaffRolesQuery, useDeleteStaffRoleMutation } from "../api/staff.api.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";
import StaffRoleModal from "../components/StaffRoleModal.jsx";

export default function StaffRole() {
    const { settings } = useSettings();
    const language = settings?.language || "en";

    const [deleteStaffRole] = useDeleteStaffRoleMutation();
    const [modalOpen, setModalOpen] = useState(false);

    const handleDeleteRole = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete the role "${name}"?`)) {
            try {
                await deleteStaffRole({ _id: id }).unwrap();
                toast.success("Role deleted successfully");
            } catch (error) {
                toast.error(error?.data?.msg || "Failed to delete role");
            }
        }
    };

    const renderItems = (items) => {
        if (!items?.length) return null;

        return (
            <div className="overflow-x-auto rounded-2xl overflow-hidden border-edge">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="text-xs uppercase tracking-wider bg-surface-muted border-b border-edge text-ink-muted">
                            <th className="px-4 py-3 font-semibold">{language === "en" ? "Role Name" : "کردار کا نام"}</th>
                            <th className="px-4 py-3 font-semibold text-center">{language === "en" ? "Actions" : "اقدامات"}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item._id} className="transition border-b border-edge hover:bg-surface-muted">
                                <td className="px-4 py-3 font-semibold text-ink">
                                    {item.name}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-center gap-2">
                                        <PermissionGuard 
                                            execute={() => handleDeleteRole(item._id, item.name)} 
                                            permission="staff.delete" 
                                            isConfirmation={true}
                                        >
                                            <button
                                                className="w-7 h-7 flex items-center justify-center rounded-lg transition text-ink-muted hover:text-red-500 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </PermissionGuard>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="h-screen flex flex-col">
            <div className="flex-none">
                <PageHeading
                    heading={language === "en" ? "Staff Roles" : "اسٹاف کردار"}
                    subheading={language === "en" ? "Manage staff roles" : "اسٹاف کردار کا انتظام کریں"}
                    leftActions={
                        <PermissionGuard 
                            execute={() => setModalOpen(true)} 
                            permission="staff.create" 
                            isConfirmation={false}
                        >
                            <div>
                                <ScreenTabButton lucideIcon={Plus} text={language === "en" ? "Add Role" : "کردار شامل کریں"} />
                            </div>
                        </PermissionGuard>
                    }
                />
            </div>

            <PaginatedList
                rtkQuery={useGetStaffRolesQuery}
                limit={20}
                dataKey="data"
                wrapperClassName="flex-1"
                renderItems={renderItems}
                renderEmpty={() => (
                    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-surface-muted">
                            <Briefcase className="w-7 h-7 text-ink-muted" />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-sm font-semibold text-ink">{language === "en" ? "No roles found" : "کوئی کردار نہیں ملا"}</h3>
                            <p className="text-xs text-ink-muted max-w-xs">
                                {language === "en" ? "You haven't added any staff roles yet." : "آپ نے ابھی تک کوئی اسٹاف کردار شامل نہیں کیا۔"}
                            </p>
                        </div>
                    </div>
                )}
            />

            <StaffRoleModal mode="create" open={modalOpen} onClose={() => setModalOpen(false)} />
        </div>
    );
}
