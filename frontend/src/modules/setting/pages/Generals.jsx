import { X, Eye, EyeOff, Edit, ScanBarcodeIcon, RefreshCw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import api from "@shared/services/api";
import { showError, showSuccess } from "@shared/utilities/toastHelpers";
import { getItem, setItem } from "@shared/utilities/localStorage";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { useUser } from "../../auth/services/auth.service.js";

const SettingsModel = ({ onClose }) => {
    const { data: queryResponse, refetch: refetchUser } = useUser();
    const user = queryResponse?.data || queryResponse;

    const [language, setLanguage] = useState(
        getItem("language") || user?.language || "en"
    );
    const [savingLanguage, setSavingLanguage] = useState(false);
    const [storageInfo, setStorageInfo] = useState(null);
    const [loadingType, setLoadingType] = useState(null);

    const [availableDevices, setAvailableDevices] = useState([]);
    const [selectedScanner, setSelectedScanner] = useState(
        getItem("selectedScanner") || "default"
    );
    const [isScanningDevices, setIsScanningDevices] = useState(false);

    const [printWidth, setPrintWidth] = useState(
        Number(getItem("printWidth")) || 400
    );
    const [printHeight, setPrintHeight] = useState(
        Number(getItem("printHeight")) || 600
    );
    const [printCenter, setPrintCenter] = useState(
        getItem("printCenter") !== "false"
    );
    const [printFullscreen, setPrintFullscreen] = useState(
        getItem("printFullscreen") === "true"
    );
    const [editPrinter, setEditPrinter] = useState(false);
    const [printShowWindow, setPrintShowWindow] = useState(
        getItem("printShowWindow") !== "false"
    );

    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [editName, setEditName] = useState(false);
    const [editEmail, setEditEmail] = useState(false);
    const [editPassword, setEditPassword] = useState(false);

    const [nameOfCafe, setNameOfCafe] = useState("");
    const [address, setAddress] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [editCafeName, setEditCafeName] = useState(false);
    const [editAddress, setEditAddress] = useState(false);
    const [editPhone, setEditPhone] = useState(false);

    const [managerCode, setManagerCode] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [managerCodeExists, setManagerCodeExists] = useState(false);

    const modalRef = useRef();
    const role = user?.role || null;

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setEmail(user.email || "");
            if (!getItem("language")) {
                setLanguage(user.language || "en");
            }
        }
    }, [user]);

    const handleClickOutside = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            onClose();
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);

        api.get("/settings/get-settings")
            .then((res) => {
                const data = res.data.data;
                setManagerCodeExists(data.managerCodeExists);
                setIsUploading(data.uploadSync);
                setStorageInfo(data.storageInfo);
            })
            .catch(() =>
                showError(
                    language === "en"
                        ? "Failed to fetch settings"
                        : "سیٹنگز حاصل کرنے میں ناکامی"
                )
            );

        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        getItem("language") && setLanguage(getItem("language"));
        getItem("name") && setNameOfCafe(getItem("name"));
        getItem("address") && setAddress(getItem("address"));
        getItem("phoneNumber") && setPhoneNumber(getItem("phoneNumber"));
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

    const handleUpdateCode = async () => {
        if (!managerCode.trim())
            return showError(
                language === "en"
                    ? "Enter Manager Code!"
                    : "مینجر کوڈ درج کریں!"
            );
        try {
            const res = await api.put("/settings/update", { managerCode });
            if (res.status === 200) {
                showSuccess(
                    language === "en"
                        ? "Manager Code Updated"
                        : "مینجر کوڈ اپ ڈیٹ ہو گیا"
                );
                setManagerCode("");
                setManagerCodeExists(true);
            }
        } catch {
            showError(language === "en" ? "Server Error!" : "سرور میں خرابی!");
        }
    };

    const handleUpdateAccount = async () => {
        if (!name.trim() || !email.trim())
            return showError(
                language === "en"
                    ? "Name & Email are required!"
                    : "نام اور ای میل ضروری ہیں!"
            );
        try {
            const body = { name, email };
            if (editPassword && password.trim()) body.password = password;

            const res = await api.put("/auth/me", body);
            if (res.status === 200) {
                setEditName(false);
                setEditEmail(false);
                setEditPassword(false);
                setPassword("");
                refetchUser();
            }
        } catch {
            showError(
                language === "en"
                    ? "Failed to update account!"
                    : "اکاؤنٹ اپ ڈیٹ کرنے میں ناکامی"
            );
        }
    };

    const handleSaveChanges = () => {
        setItem("name", nameOfCafe);
        setItem("address", address);
        setItem("phoneNumber", phoneNumber);
        showSuccess(
            language === "en"
                ? "Settings saved successfully!"
                : "سیٹنگز کامیابی سے محفوظ ہو گئیں!"
        );
        setEditCafeName(false);
        setEditAddress(false);
        setEditPhone(false);
    };

    const handleSavePrinter = () => {
        setItem("printWidth", printWidth);
        setItem("printHeight", printHeight);
        setItem("printCenter", printCenter);
        setItem("printFullscreen", printFullscreen);
        setItem("printShowWindow", printShowWindow);
        showSuccess(
            language === "en"
                ? "Printer settings saved!"
                : "پرنٹر سیٹنگز محفوظ ہو گئیں!"
        );
        setEditPrinter(false);
    };

    const handleUploadingStatus = async () => {
        try {
            const res = await api.put("/settings/upload-sync", {
                uploadSync: isUploading,
            });
            if (res.status === 200) setIsUploading(res.data.data.uploadSync);
        } catch (error) {
            showError(
                language === "en"
                    ? "Failed to update uploading status"
                    : "اپ لوڈنگ کی حیثیت اپ ڈیٹ کرنے میں ناکامی"
            );
        }
    };

    const fetchDevices = async () => {
        setIsScanningDevices(true);
        try {
            if (
                navigator.mediaDevices &&
                navigator.mediaDevices.enumerateDevices
            ) {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = devices.filter(
                    (device) => device.kind === "videoinput"
                );
                setAvailableDevices(videoInputs);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setTimeout(() => setIsScanningDevices(false), 600);
        }
    };

    const handleSaveScanner = () => {
        setItem("selectedScanner", selectedScanner);
        showSuccess(
            language === "en"
                ? "Barcode scanner preference saved!"
                : "بار کوڈ اسکینر کی ترجیح محفوظ ہوگئی!"
        );
    };

    return (
        <div className="bg-(--surface) rounded-3xl p-6 border border-(--border) shadow-[0_18px_50px_rgba(64,45,28,0.12)]">
            <div
                ref={modalRef}
                className="bg-(--surface) w-full max-h-[80vh] overflow-y-auto flex flex-col"
            >
                <div className="flex flex-col md:flex-row overflow-y-auto space-y-6 md:space-y-0 md:space-x-6 mb-6">
                    <div className="flex-1 space-y-4">
                        <p className="text-(--ink) font-medium">
                            {language === "en"
                                ? "Account Details"
                                : "اکاؤنٹ کی تفصیلات"}
                        </p>

                        <div className="relative">
                            <input
                                type="text"
                                value={name}
                                disabled={!editName}
                                onChange={(e) => setName(e.target.value)}
                                className={`w-full px-4 py-2 border rounded-xl text-(--ink) ${editName ? "bg-(--surface) focus:outline-none focus:ring-1 focus:ring-(--accent-2)" : "bg-(--surface-muted) cursor-not-allowed"}`}
                            />
                            <Edit
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-(--muted) cursor-pointer hover:text-(--accent-2)"
                                onClick={() => setEditName(true)}
                                size={18}
                            />
                        </div>

                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                disabled={!editEmail}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full px-4 py-2 border rounded-xl text-(--ink) ${editEmail ? "bg-(--surface) focus:outline-none focus:ring-1 focus:ring-(--accent-2)" : "bg-(--surface-muted) cursor-not-allowed"}`}
                            />
                            <Edit
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-(--muted) cursor-pointer hover:text-(--accent-2)"
                                onClick={() => setEditEmail(true)}
                                size={18}
                            />
                        </div>

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                disabled={!editPassword}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={
                                    language === "en"
                                        ? "Enter new password"
                                        : "نیا پاس ورڈ درج کریں"
                                }
                                className={`w-full px-4 py-2 border rounded-xl text-(--ink) ${editPassword ? "bg-(--surface) focus:outline-none focus:ring-1 focus:ring-(--accent-2)" : "bg-(--surface-muted) cursor-not-allowed"}`}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-2">
                                <Edit
                                    className="text-(--muted) cursor-pointer hover:text-(--accent-2)"
                                    onClick={() => setEditPassword(true)}
                                    size={18}
                                />
                                {editPassword &&
                                    (showPassword ? (
                                        <EyeOff
                                            className="text-(--muted) cursor-pointer hover:text-(--accent-2)"
                                            onClick={() =>
                                                setShowPassword(false)
                                            }
                                            size={18}
                                        />
                                    ) : (
                                        <Eye
                                            className="text-(--muted) cursor-pointer hover:text-(--accent-2)"
                                            onClick={() =>
                                                setShowPassword(true)
                                            }
                                            size={18}
                                        />
                                    ))}
                            </div>
                        </div>

                        {(editName || editEmail || editPassword) && (
                            <button
                                onClick={handleUpdateAccount}
                                className="mt-2 w-full py-3 bg-(--accent-2) text-white text-sm font-semibold rounded-xl
              hover:bg-[#0b5f59] transition shadow-md"
                            >
                                {language === "en"
                                    ? "Update Account"
                                    : "اکاؤنٹ اپ ڈیٹ کریں"}
                            </button>
                        )}

                        {role === "admin" && (
                            <div className="mt-8 border border-(--border) rounded-2xl p-5 shadow-[0_14px_30px_rgba(64,45,28,0.10)] bg-(--surface-muted) hover:shadow-[0_14px_30px_rgba(64,45,28,0.10)] transition-all">
                                <h2 className="text-(--ink) font-semibold">
                                    {language === "en"
                                        ? "Manager Free Food Code"
                                        : "مینجر فری فوڈ کوڈ"}
                                </h2>
                                <input
                                    type="password"
                                    placeholder={
                                        managerCodeExists
                                            ? language === "en"
                                                ? "Update Code"
                                                : "کوڈ اپ ڈیٹ کریں"
                                            : language === "en"
                                                ? "Enter Code"
                                                : "کوڈ درج کریں"
                                    }
                                    value={managerCode}
                                    onChange={(e) =>
                                        setManagerCode(e.target.value)
                                    }
                                    className="w-full px-4 py-2 border rounded-xl mt-2 focus:outline-none focus:ring-1 focus:ring-(--accent-2)"
                                />
                                <button
                                    onClick={handleUpdateCode}
                                    className="mt-3 w-full py-3 bg-(--accent-2) text-white text-sm font-semibold rounded-xl
              hover:bg-[#0b5f59] transition shadow-md"
                                >
                                    {managerCodeExists
                                        ? language === "en"
                                            ? "Update Code"
                                            : "کوڈ اپ ڈیٹ کریں"
                                        : language === "en"
                                            ? "Set Code"
                                            : "کوڈ سیٹ کریں"}
                                </button>
                            </div>
                        )}

                        {role === "admin" && (
                            <div className="mt-8 border border-(--border) rounded-2xl p-5 shadow-[0_14px_30px_rgba(64,45,28,0.10)] bg-(--surface-muted) hover:shadow-[0_14px_30px_rgba(64,45,28,0.10)] transition-all">
                                <h2 className="text-(--ink) font-semibold">
                                    {language === "en"
                                        ? "Auto Uploading"
                                        : "خودکار اپ لوڈنگ"}
                                </h2>
                                <p className="text-sm text-(--muted)">
                                    {language === "en"
                                        ? "Automatically sync uploads when connected to the internet."
                                        : "انٹرنیٹ سے جڑنے پر اپ لوڈز خود بخود ہم آہنگ کریں۔"}
                                </p>
                                <label className="relative inline-flex items-center cursor-pointer mt-2">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={isUploading}
                                        onChange={(e) =>
                                            setIsUploading(e.target.checked)
                                        }
                                    />
                                    <div className="w-12 h-6 bg-(--surface-muted) rounded-full peer peer-checked:bg-(--accent-2) transition-all duration-300"></div>
                                    <div className="absolute left-0 top-0.5 w-5 h-5 bg-(--surface) border border-(--border) rounded-full transition-all duration-300 translate-x-0 peer-checked:translate-x-6 peer-checked:border-(--accent-2)"></div>
                                </label>
                                <button
                                    onClick={handleUploadingStatus}
                                    className="mt-4 w-full py-3 bg-(--accent-2) text-white text-sm font-semibold rounded-xl
              hover:bg-[#0b5f59] transition shadow-md"
                                >
                                    {language === "en"
                                        ? "Save Upload Preference"
                                        : "اپ لوڈ کی ترجیح محفوظ کریں"}
                                </button>
                            </div>
                        )}

                        {isUploading && (
                            <div className="mt-8 border border-(--border) rounded-2xl p-5 shadow-[0_14px_30px_rgba(64,45,28,0.10)] bg-(--surface-muted) hover:shadow-[0_14px_30px_rgba(64,45,28,0.10)] transition-all">
                                <h2 className="text-(--ink) font-semibold">
                                    {language === "en"
                                        ? "Download Sync Data"
                                        : "ڈیٹا ڈاؤن لوڈ ہم آہنگ کریں"}
                                </h2>

                                <button
                                    disabled={loadingType !== null}
                                    onClick={async () => {
                                        setLoadingType("all");

                                        try {
                                            const res = await api.post(
                                                "/syncRoutes/uploadSync",
                                                {
                                                    loggedInUserData: user,
                                                    type: "all",
                                                }
                                            );

                                            if (res.status === 200) {
                                                showSuccess(
                                                    language === "en"
                                                        ? "All Sync Completed!"
                                                        : "آل سنک مکمل ہو گیا!"
                                                );
                                            }
                                        } catch (error) {
                                            showError(
                                                language === "en"
                                                    ? "All Sync failed!"
                                                    : "آل سنک ناکام ہو گیا!"
                                            );
                                        } finally {
                                            setLoadingType(null);
                                        }
                                    }}
                                    className={`mt-3 w-full py-3 text-white text-sm font-semibold rounded-xl transition shadow-md
        ${loadingType ? "bg-(--surface-muted) cursor-not-allowed" : "bg-(--ink) hover:bg-[#0b5f59]"}`}
                                >
                                    {loadingType === "all"
                                        ? language === "en"
                                            ? "Processing..."
                                            : "پروسیسنگ ہو رہی ہے..."
                                        : language === "en"
                                            ? "All Sync"
                                            : "آل سنک"}
                                </button>

                                <button
                                    disabled={loadingType !== null}
                                    onClick={async () => {
                                        setLoadingType("required");

                                        try {
                                            const res = await api.post(
                                                "/syncRoutes/uploadSync",
                                                {
                                                    loggedInUserData: user,
                                                    type: "required",
                                                }
                                            );

                                            if (res.status === 200) {
                                                showSuccess(
                                                    language === "en"
                                                        ? "Required Sync Completed!"
                                                        : "ریکوائرڈ سنک مکمل ہو گیا!"
                                                );
                                            }
                                        } catch (error) {
                                            showError(
                                                language === "en"
                                                    ? "Required Sync failed!"
                                                    : "ریکوائرڈ سنک ناکام ہو گیا!"
                                            );
                                        } finally {
                                            setLoadingType(null);
                                        }
                                    }}
                                    className={`mt-3 w-full py-3 text-white text-sm font-semibold rounded-xl transition shadow-md
        ${loadingType ? "bg-(--surface-muted) cursor-not-allowed" : "bg-(--accent-2) hover:bg-[#0b5f59]"}`}
                                >
                                    {loadingType === "required"
                                        ? language === "en"
                                            ? "Processing..."
                                            : "پروسیسنگ ہو رہی ہے..."
                                        : language === "en"
                                            ? "Required Sync"
                                            : "ریکوائرڈ سنک"}
                                </button>
                            </div>
                        )}
                        {storageInfo && (
                            <div className="mt-8 border border-(--border) rounded-2xl p-5 shadow-[0_14px_30px_rgba(64,45,28,0.10)] bg-(--surface-muted) hover:shadow-[0_14px_30px_rgba(64,45,28,0.10)] transition-all">
                                <h2 className="text-(--ink) font-semibold mb-3">
                                    {language === "en"
                                        ? "Database Storage"
                                        : "ڈیٹا بیس اسٹوریج"}
                                </h2>

                                <PieChart width={180} height={180}>
                                    <Pie
                                        data={[
                                            {
                                                name: "Used",
                                                value: storageInfo.storageUsedMB,
                                            },
                                            {
                                                name: "Free",
                                                value: storageInfo.freeMB,
                                            },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        startAngle={90}
                                        endAngle={-270}
                                        innerRadius={60}
                                        outerRadius={80}
                                        dataKey="value"
                                        paddingAngle={0}
                                        cornerRadius={10}
                                    >
                                        <Cell fill="#4f46e5" />
                                        <Cell fill="#e5e7eb" />
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => `${value} MB`}
                                    />
                                </PieChart>

                                <p className="mt-2 text-(--muted) text-sm text-center">
                                    {language === "en"
                                        ? `Used: ${storageInfo.storageUsedMB} MB / 512 MB`
                                        : `استعمال شدہ: ${storageInfo.storageUsedMB} MB / 512 MB`}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 space-y-4">
                        {role === "admin" && (
                            <>
                                <p className="text-(--ink) font-medium">
                                    {language === "en"
                                        ? "Cafe Information"
                                        : "کیفی معلومات"}
                                </p>

                                <div className="relative">
                                    <input
                                        type="text"
                                        value={nameOfCafe}
                                        disabled={!editCafeName}
                                        onChange={(e) =>
                                            setNameOfCafe(e.target.value)
                                        }
                                        placeholder={
                                            language === "en"
                                                ? "Enter cafe name"
                                                : "کیفی کا نام درج کریں"
                                        }
                                        className={`w-full px-4 py-2 border rounded-xl text-(--ink) ${editCafeName ? "bg-(--surface) focus:outline-none focus:ring-1 focus:ring-(--accent-2)" : "bg-(--surface-muted) cursor-not-allowed"}`}
                                    />
                                    <Edit
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-(--muted) cursor-pointer hover:text-(--accent-2)"
                                        onClick={() => setEditCafeName(true)}
                                        size={18}
                                    />
                                </div>

                                <div className="relative">
                                    <input
                                        type="text"
                                        value={address}
                                        disabled={!editAddress}
                                        onChange={(e) =>
                                            setAddress(e.target.value)
                                        }
                                        placeholder={
                                            language === "en"
                                                ? "Enter address"
                                                : "پتہ درج کریں"
                                        }
                                        className={`w-full px-4 py-2 border rounded-xl text-(--ink) ${editAddress ? "bg-(--surface) focus:outline-none focus:ring-1 focus:ring-(--accent-2)" : "bg-(--surface-muted) cursor-not-allowed"}`}
                                    />
                                    <Edit
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-(--muted) cursor-pointer hover:text-(--accent-2)"
                                        onClick={() => setEditAddress(true)}
                                        size={18}
                                    />
                                </div>

                                <div className="relative">
                                    <input
                                        type="text"
                                        value={phoneNumber}
                                        disabled={!editPhone}
                                        onChange={(e) =>
                                            setPhoneNumber(e.target.value)
                                        }
                                        placeholder={
                                            language === "en"
                                                ? "03XX-XXXXXXX"
                                                : "03XX-XXXXXXX"
                                        }
                                        className={`w-full px-4 py-2 border rounded-xl text-(--ink) ${editPhone ? "bg-(--surface) focus:outline-none focus:ring-1 focus:ring-(--accent-2)" : "bg-(--surface-muted) cursor-not-allowed"}`}
                                    />
                                    <Edit
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-(--muted) cursor-pointer hover:text-(--accent-2)"
                                        onClick={() => setEditPhone(true)}
                                        size={18}
                                    />
                                </div>

                                {(editCafeName || editAddress || editPhone) && (
                                    <button
                                        onClick={handleSaveChanges}
                                        className=" mt-2 w-full py-3 bg-(--accent-2) text-white text-sm font-semibold rounded-xl
              hover:bg-[#0b5f59] transition shadow-md"
                                    >
                                        {language === "en"
                                            ? "Save Changes"
                                            : "تبدیلیاں محفوظ کریں"}
                                    </button>
                                )}
                            </>
                        )}

                        <div className="mb-6 border border-(--border) rounded-2xl p-5 shadow-[0_14px_30px_rgba(64,45,28,0.10)] bg-(--surface-muted) hover:shadow-[0_14px_30px_rgba(64,45,28,0.10)] transition-all">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-(--ink) font-medium mb-1">
                                    {language === "en"
                                        ? "Printer Settings"
                                        : "پرنٹر سیٹنگز"}
                                </h2>
                                <button
                                    onClick={() => setEditPrinter(!editPrinter)}
                                    className="text-(--muted) hover:text-(--ink) text-sm"
                                >
                                    {editPrinter
                                        ? language === "en"
                                            ? "Cancel"
                                            : "منسوخ کریں"
                                        : language === "en"
                                            ? "Edit"
                                            : "ترمیم کریں"}
                                </button>
                            </div>

                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center gap-2">
                                    <label className="w-28">
                                        {language === "en"
                                            ? "Width:"
                                            : "چوڑائی:"}
                                    </label>
                                    <input
                                        type="number"
                                        value={printWidth}
                                        disabled={!editPrinter}
                                        onChange={(e) =>
                                            setPrintWidth(
                                                Number(e.target.value)
                                            )
                                        }
                                        className="flex-1 px-3 py-2 border rounded-xl focus:ring-1 focus:ring-(--accent-2)"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="w-28">
                                        {language === "en"
                                            ? "Height:"
                                            : "اونچائی:"}
                                    </label>
                                    <input
                                        type="number"
                                        value={printHeight}
                                        disabled={!editPrinter}
                                        onChange={(e) =>
                                            setPrintHeight(
                                                Number(e.target.value)
                                            )
                                        }
                                        className="flex-1 px-3 py-2 border rounded-xl focus:ring-1 focus:ring-(--accent-2)"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="w-28">
                                        {language === "en"
                                            ? "Center Popup:"
                                            : "مرکز میں دکھائیں:"}
                                    </label>
                                    <input
                                        type="checkbox"
                                        disabled={!editPrinter}
                                        checked={printCenter}
                                        onChange={(e) =>
                                            setPrintCenter(e.target.checked)
                                        }
                                        className="ml-2"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="w-28">
                                        {language === "en"
                                            ? "Fullscreen:"
                                            : "فل اسکرین:"}
                                    </label>
                                    <input
                                        type="checkbox"
                                        disabled={!editPrinter}
                                        checked={printFullscreen}
                                        onChange={(e) =>
                                            setPrintFullscreen(e.target.checked)
                                        }
                                        className="ml-2"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="w-28">
                                        {language === "en"
                                            ? "Print Window:"
                                            : "پرنٹ ونڈو:"}
                                    </label>
                                    <input
                                        type="checkbox"
                                        className="ml-2"
                                        checked={printShowWindow}
                                        onChange={(e) =>
                                            setPrintShowWindow(e.target.checked)
                                        }
                                        disabled={!editPrinter}
                                    />
                                </div>
                                {editPrinter && (
                                    <button
                                        onClick={handleSavePrinter}
                                        className="mt-2 w-full py-3 bg-(--accent-2) text-white text-sm font-semibold rounded-xl hover:bg-[#0b5f59] transition shadow-md"
                                    >
                                        {language === "en"
                                            ? "Save Printer Settings"
                                            : "پرنٹر سیٹنگز محفوظ کریں"}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mt-2 mb-10 border border-(--border) rounded-2xl p-5 shadow-[0_14px_30px_rgba(64,45,28,0.10)] bg-(--surface-muted) hover:shadow-[0_14px_30px_rgba(64,45,28,0.10)] transition-all">
                            <label className="block text-(--ink) font-medium mb-1">
                                {language === "en" ? "Language" : "زبان"}
                            </label>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-(--accent-2)"
                            >
                                <option value="en">English</option>
                                <option value="ur">اردو</option>
                            </select>
                            <button
                                disabled={savingLanguage}
                                onClick={async () => {
                                    setSavingLanguage(true);
                                    try {
                                        await api.put(
                                            "/settings/update-language",
                                            { language }
                                        );
                                        setItem("language", language);
                                        refetchUser();
                                        showSuccess(
                                            language === "en"
                                                ? "Language updated successfully!"
                                                : "زبان کامیابی سے اپ ڈیٹ ہو گئی!"
                                        );
                                    } catch {
                                        showError(
                                            language === "en"
                                                ? "Failed to update language"
                                                : "زبان اپ ڈیٹ کرنے میں ناکامی"
                                        );
                                    } finally {
                                        setSavingLanguage(false);
                                    }
                                }}
                                className="mt-3 w-full py-3 bg-(--accent-2) text-white text-sm font-semibold rounded-xl hover:bg-[#0b5f59] transition shadow-md"
                            >
                                {savingLanguage
                                    ? language === "en"
                                        ? "Saving..."
                                        : "محفوظ کیا جا رہا ہے..."
                                    : language === "en"
                                        ? "Save Language"
                                        : "زبان محفوظ کریں"}
                            </button>
                        </div>

                        <div className="mt-4 border border-(--border) rounded-2xl p-5 shadow-[0_14px_30px_rgba(64,45,28,0.10)] bg-(--surface-muted) hover:shadow-[0_14px_30px_rgba(64,45,28,0.10)] transition-all">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-(--ink) font-semibold flex items-center gap-2">
                                    <ScanBarcodeIcon
                                        size={20}
                                        className="text-(--accent-2)"
                                    />
                                    {language === "en"
                                        ? "Barcode Scanner"
                                        : "بار کوڈ اسکینر"}
                                </h2>
                                <RefreshCw
                                    size={16}
                                    className={`cursor-pointer text-(--muted) hover:text-(--accent-2) transition-all ${isScanningDevices ? "animate-spin text-(--accent-2)" : ""}`}
                                    onClick={fetchDevices}
                                />
                            </div>
                            <p className="text-[11px] text-(--muted) mb-3 leading-tight">
                                {language === "en"
                                    ? "Select your preferred device for scanning items. Most hardware scanners act as 'Default'."
                                    : "اشیاء کو اسکین کرنے کے لیے اپنی پسندیدہ ڈیوائس منتخب کریں۔"}
                            </p>
                            <select
                                value={selectedScanner}
                                onChange={(e) =>
                                    setSelectedScanner(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-(--border) rounded-xl focus:outline-none focus:ring-1 focus:ring-(--accent-2) text-sm bg-(--surface) cursor-pointer"
                            >
                                <option value="default">
                                    Default / HID Keyboard
                                </option>
                                {availableDevices.map((device, idx) => (
                                    <option
                                        key={device.deviceId || idx}
                                        value={device.deviceId}
                                    >
                                        {device.label ||
                                            `Scanner Interface ${idx + 1}`}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleSaveScanner}
                                className="mt-3 w-full py-2.5 bg-(--accent-2) text-white text-[11px] font-bold rounded-xl hover:bg-[#0b5f59] transition shadow-[0_14px_30px_rgba(64,45,28,0.10)]"
                            >
                                {language === "en"
                                    ? "SAVE SCANNER PREFERENCE"
                                    : "اسکینر کی ترجیح محفوظ کریں"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModel;
