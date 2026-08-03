import { useState, useEffect } from "react";
import { useUpdateShopSettingsMutation } from "../api/settings.api.js";
import { toast } from "sonner";

export default function ShopSettings({ settingsData, userId, labels }) {
    const [updateShopSettings] = useUpdateShopSettingsMutation();
    const [shopName, setShopName] = useState("");
    const [shopImage, setShopImage] = useState(null);
    const [shopImagePreview, setShopImagePreview] = useState("");

    useEffect(() => {
        if (settingsData) {
            setShopName(settingsData.shop?.name || "");
            setShopImagePreview(settingsData.shop?.imageUrl || "");
        }
    }, [settingsData]);

    const handleShopImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setShopImage(file);
            setShopImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("name", shopName);
        if (shopImage) {
            formData.append("shopImage", shopImage);
        }

        try {
            await updateShopSettings(formData).unwrap();
            toast.success(labels.shopSettingsSaved);
        } catch (error) {
            toast.error(labels.failedToSave);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">{labels.shopName}</label>
                <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"
                    placeholder={labels.enterShopName}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">{labels.shopImage}</label>
                <div className="flex items-center gap-4">
                    {shopImagePreview && (
                        <div className="relative">
                            <img 
                                src={shopImagePreview} 
                                alt="Shop" 
                                className="w-24 h-24 object-cover rounded-lg border border-[var(--border)]" 
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setShopImagePreview("");
                                    setShopImage(null);
                                }}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                            >
                                ×
                            </button>
                        </div>
                    )}
                    <div className="flex-1">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleShopImageChange}
                            className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"
                        />
                        {shopImagePreview && (
                            <p className="text-xs text-[var(--muted)] mt-1">{labels.changeImage}</p>
                        )}
                    </div>
                </div>
            </div>
            <button onClick={handleSave} className="btn-add">
                {labels.save} {labels.shop}
            </button>
        </div>
    );
}
