import { Pencil, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";

const ActionButtons = ({
    onEdit,
    onDelete,
    EditNameRole,
    deleteNameRole,
    direction,
}) => {
    const user = useSelector((state) => state.auth || {});
    const language = user.language || "en";
    return (
        <div
            className={`flex gap-x-2 gap-y-1.5 ${direction === "col" && "flex-col"}`}
        >
            {(user?.role === "admin" || user.role === EditNameRole) && (
                <button
                    onClick={onEdit}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-(--ink) border border-(--border) hover:text-(--accent-2) hover:border-(--accent-2) transition"
                >
                    <Pencil className="w-3 h-3" />
                    {language === "en" ? "Edit" : "بدلیں"}
                </button>
            )}

            {(user?.role === "admin" || user.role === deleteNameRole) && (
                <button
                    onClick={onDelete}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-(--ink) border border-(--border) hover:text-rose-600 hover:border-rose-300 transition"
                >
                    <Trash2 className="w-3 h-3" />
                    {language === "en" ? "Delete" : "مٹا دیں"}
                </button>
            )}
            {!(user.role === deleteNameRole) &&
                !(user.role === EditNameRole) &&
                user.role !== "admin" && (
                    <p className="text-xs text-(--muted)">No permission</p>
                )}
        </div>
    );
};

export default ActionButtons;
