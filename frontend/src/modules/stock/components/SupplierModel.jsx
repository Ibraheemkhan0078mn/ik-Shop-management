import { useEffect, useState } from "react";
import { showError } from "@/utils/toastHelpers";
import { useSuppliers } from "../features/inventory/supplier/supplier.service";
import { useUser } from "../features/auth/auth.service";
import Input from "../ui/Input"
import Textarea from "../ui/Textarea"
import { Select, SelectContent, SelectItem } from "../ui/Select"

export default function SupplierForm({ defaultValues, onSubmit, onCancel }) {
    const { data: userQuery } = useUser();
    const language = userQuery?.data?.language || userQuery?.language || "en";

    const { data: suppliersData } = useSuppliers();
    const suppliers = suppliersData?.data || suppliersData || [];

    const [name, setName] = useState(defaultValues?.name || "");
    const [contactPerson, setContactPerson] = useState(defaultValues?.contactPerson || "");
    const [phone, setPhone] = useState(defaultValues?.phone || "");
    const [email, setEmail] = useState(defaultValues?.email || "");
    const [address, setAddress] = useState(defaultValues?.address || "");
    const [taxId, setTaxId] = useState(defaultValues?.taxId || "");
    const [notes, setNotes] = useState(defaultValues?.notes || "");
    const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true);
    const [type, setType] = useState(defaultValues?.type || "");

    const [nameError, setNameError] = useState(false);

    useEffect(() => {
        if (defaultValues) {
            setName(defaultValues.name || "");
            setContactPerson(defaultValues.contactPerson || "");
            setPhone(defaultValues.phone || "");
            setEmail(defaultValues.email || "");
            setAddress(defaultValues.address || "");
            setTaxId(defaultValues.taxId || "");
            setNotes(defaultValues.notes || "");
            setIsActive(defaultValues.isActive ?? true);
        }
    }, [defaultValues]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!name.trim()) {
            return showError(
                language === "en"
                    ? "Supplier name is required."
                    : "سپلائر کا نام ضروری ہے۔",
            );
        }

        if (nameError) {
            return showError(
                language === "en"
                    ? "A supplier with this name already exists."
                    : "اس نام کا سپلائر پہلے سے موجود ہے۔",
            );
        }

        onSubmit({
            name: name.trim(),
            contactPerson: contactPerson.trim(),
            phone: phone.trim(),
            email: email.trim(),
            address: address.trim(),
            taxId: taxId.trim(),
            notes: notes.trim(),
            type: type.trim(),
            isActive,
        });
    };

    const handleNameChange = (val) => {
        setName(val);
        const exists = suppliers.some(
            (s) => s.name.toLowerCase() === val.toLowerCase() && s._id !== defaultValues?._id
        );
        setNameError(exists);
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-(--surface) rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden border border-(--border) animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-(--border) bg-(--surface-muted)">
                    <h2 className="text-xl font-bold text-(--ink) font-display">
                        {defaultValues
                            ? language === "en" ? "Edit Supplier" : "سپلائر ایڈٹ کریں"
                            : language === "en" ? "Add New Supplier" : "نیا سپلائر شامل کریں"}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Supplier Name */}
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-sm font-semibold text-(--ink)">
                                {language === "en" ? "Supplier Name" : "سپلائر کا نام"} <span className="text-rose-600">*</span>
                            </label>
                            <Input
                                type="text"
                                placeholder="e.g. ABC Traders"
                                className={`input-base ${nameError ? "border-rose-500 focus:ring-rose-500" : ""}`}
                                value={name}
                                onChange={(e) => handleNameChange(e.target.value)}
                            />
                            {nameError && (
                                <span className="text-xs text-rose-600">
                                    {language === "en" ? "Name already taken" : "نام پہلے سے موجود ہے"}
                                </span>
                            )}
                        </div>

                        {/* Type */}
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-sm font-semibold text-(--ink)">
                                {language === "en" ? "Supplier Type" : "سپلائر کی قسم"} <span className="text-rose-600">*</span>
                            </label>
                            <Select
                                defaultValue={type || "Other"}
                                placeholder={language === "en" ? "Select Type" : "قسم منتخب کریں"}
                                onValueChange={(value) => setType(value)}
                                className="input-base"
                            >
                                <SelectContent>
                                    <SelectItem value="Distributor">{language === "en" ? "Distributor" : "ڈسٹریبیوٹر"}</SelectItem>
                                    <SelectItem value="Wholesaler">{language === "en" ? "Wholesaler" : "ہول سیلر"}</SelectItem>
                                    <SelectItem value="Manufacturer">{language === "en" ? "Manufacturer" : "مینوفیکچرر"}</SelectItem>
                                    <SelectItem value="Other">{language === "en" ? "Other" : "دیگر"}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Contact Person */}
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-sm font-semibold text-(--ink)">
                                {language === "en" ? "Contact Person" : "رابطہ کار شخص"}
                            </label>
                            <Input
                                type="text"
                                placeholder="e.g. John Doe"
                                className="input-base"
                                value={contactPerson}
                                onChange={(e) => setContactPerson(e.target.value)}
                            />
                        </div>

                        {/* Phone */}
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-sm font-semibold text-(--ink)">
                                {language === "en" ? "Phone Number" : "فون نمبر"}
                            </label>
                            <Input
                                type="text"
                                placeholder="0300-1234567"
                                className="input-base"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>

                        {/* Email */}
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-sm font-semibold text-(--ink)">
                                {language === "en" ? "Email Address" : "ای میل"}
                            </label>
                            <Input
                                type="email"
                                placeholder="supplier@example.com"
                                className="input-base"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {/* Tax ID */}
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-sm font-semibold text-(--ink)">
                                {language === "en" ? "Tax ID / NTN" : "ٹیکس آئی ڈی"}
                            </label>
                            <Input
                                type="text"
                                placeholder="1234567-8"
                                className="input-base"
                                value={taxId}
                                onChange={(e) => setTaxId(e.target.value)}
                            />
                        </div>

                        {/* Status Toggle */}
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-sm font-semibold text-(--ink)">
                                {language === "en" ? "Account Status" : "اکاؤنٹ کی حیثیت"}
                            </label>
                            <div className="flex items-center h-11 px-4 bg-(--surface-muted) rounded-2xl border border-(--border)">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-(--accent-2)"></div>
                                    <span className="ml-3 text-sm font-medium text-(--muted)">
                                        {isActive
                                            ? (language === "en" ? "Active" : "فعال")
                                            : (language === "en" ? "Inactive" : "غیر فعال")}
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="flex flex-col space-y-1.5">
                        <label className="text-sm font-semibold text-(--ink)">
                            {language === "en" ? "Office Address" : "دفتر کا پتہ"}
                        </label>
                        <Textarea
                            rows="2"
                            placeholder="Industrial Area, Karachi..."
                            className="input-base resize-none py-2 h-20"

                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>

                    {/* Notes */}
                    <div className="flex flex-col space-y-1.5">
                        <label className="text-sm font-semibold text-(--ink)">
                            {language === "en" ? "Notes" : "نوٹس"}
                        </label>
                        <Textarea
                            rows="2"
                            placeholder="Payment terms, reliability, etc."
                            className="input-base resize-none py-2 h-20"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-(--border)">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2.5 rounded-2xl border border-(--border) hover:bg-(--surface-muted) text-(--ink) font-semibold transition-all"
                        >
                            {language === "en" ? "Cancel" : "منسوخ کریں"}
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-2.5 rounded-2xl bg-(--accent-2) hover:bg-[#0b5f59] text-white font-bold shadow-lg shadow-(--accent-2)/20 transition-all"
                        >
                            {defaultValues
                                ? language === "en" ? "Update Supplier" : "اپ ڈیٹ کریں"
                                : language === "en" ? "Create Supplier" : "شامل کریں"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}