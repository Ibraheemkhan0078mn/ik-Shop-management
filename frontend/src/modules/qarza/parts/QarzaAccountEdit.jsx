import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import api from "../../../services/axiosInstance.js";
import { PlusCircle } from "lucide-react";
import ImageCropper from "../../../common/components/ImageCropper.jsx";

const QarzaAccountEdit = ({ getqarzaAccounts, currentToUpdateAccount, setVisibility, setQarzaAccounts }) => {
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);


    const [formData, setFormData] = useState({
        qarzaProfileImage: "",
        _id: "",
        name: "",
        type: "personal",
        phoneNo: "",
        address: "",
        notes: "",
        isActive: true
    });




    useEffect(() => {
        setFormData({
            ...formData,
            ...currentToUpdateAccount
        })
        setPreview(`http:///uploads/${currentToUpdateAccount?.qarzaProfileImage}`)
    }, [])





    const handleIconClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (files) => {
        const file = files[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
            setFormData((prev) => ({ ...prev, qarzaProfileImage: file }))
        }
    };














    // useEffect(() => {
    //     (
    //         async function () {
    //             try {
    //                 let res = await api.put(`/qarzaRoutes/qarzaAccountUpdate`, formData)
    //                 if (res.data.success) {
    //                     setQarzaAccounts(res.data.accounts)
    //                 }
    //             } catch (error) {
    //                 console.error(error)
    //             }
    //         }
    //     )()

    // }, [])




    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let formDataToSend = new FormData()

        Object.entries(formData).forEach(([key, value]) => {

            if (key != "qarzaProfileImage") {
                formDataToSend.append(key, value)
            }
        });

        formDataToSend.append("qarzaProfileImage", formData.qarzaProfileImage)
        try {
            const res = await api.put(
                `/qarzaRoutes/qarzaAccountUpdate`,
                formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            }
            );

            if (res.data.success) {
                getqarzaAccounts()
                // setQarzaAccounts(res.data.accounts);
                setVisibility(false);
            } else {
                toast.error("Something went wrong while creating account");
            }
        } catch (error) {
            toast.error("Server error");
        }
    };




















    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-8">
            {/* High-End Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xl animate-in fade-in duration-700"
                onClick={() => setVisibility(false)}
            ></div>

            {/* Main Luxury Container */}
            <div className="relative w-full max-w-4xl bg-white/90 backdrop-blur-md rounded-[3rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.3)] border border-white/20 overflow-hidden flex flex-col lg:flex-row animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">

                {/* Left Branding Panel with Cyan Gradient */}
                <div className="hidden lg:flex w-[35%] bg-gradient-to-b from-cyan-600 to-cyan-700 p-12 flex-col justify-between relative overflow-hidden">
                    {/* Abstract visual flair */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>


                    <div className="relative z-10">
                        <div className="flex flex-col items-center">
                            {/* The Clickable Container */}
                            <div className="relative mb-8 flex-shrink-0 w-40 h-40">

                                <ImageCropper
                                    accept="image/*"
                                    aspectRatio={1}
                                    cropShape="round"
                                    showPreview={false}
                                    onChange={handleFileChange}
                                >
                                    <div className="w-40 h-40 rounded-full bg-cyan-800 border-4 border-cyan-500/30 overflow-hidden cursor-pointer hover:scale-105 transition-all flex items-center justify-center">
                                        {preview
                                            ? <img src={preview} className="w-40 h-40 object-cover rounded-full" />
                                            : <div className="w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2">
                                                <i className="ri-user-settings-line text-6xl text-cyan-400" />
                                                <span className="text-[9px] font-black text-cyan-300 uppercase tracking-widest">Upload Photo</span>
                                            </div>
                                        }
                                    </div>
                                </ImageCropper>

                            </div>

                            {/* Hidden File Input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                        <h2 className="text-4xl font-black text-white leading-tight tracking-tighter">Edit <br />Qarza <br />Account</h2>
                        <div className="h-1 w-12 bg-white/40 mt-6 rounded-full"></div>
                    </div>


                    <div className="relative z-10">
                        <p className="text-cyan-100 text-sm font-medium leading-relaxed">
                            Modify existing ledger details. Changes will be reflected immediately across all financial reports.
                        </p>
                    </div>
                </div>

                {/* Form Content Side */}
                <div className="flex-1 flex flex-col max-h-[90vh] lg:h-auto overflow-hidden">

                    {/* Header Controls */}
                    <div className="px-8 pt-8 pb-4 flex justify-between items-center">
                        <div className="lg:hidden">
                            <h2 className="text-xl font-black text-slate-800">Edit Account</h2>
                        </div>
                        <button
                            onClick={() => setVisibility(false)}
                            className="ml-auto w-10 h-10 bg-slate-100 hover:bg-rose-500 hover:text-white rounded-full flex items-center justify-center transition-all duration-300 active:scale-90"
                        >
                            <i className="ri-close-line text-xl"></i>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar px-8 lg:px-12 pb-12 space-y-8">

                        {/* Section: Name & Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2 group">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Account Holder Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Full name"
                                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-cyan-600 focus:bg-white transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-inner"
                                    />
                                    <i className="ri-user-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-cyan-600 text-xl transition-colors"></i>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Profile Category</label>
                                <div className="relative">
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-4 outline-none focus:border-cyan-600 focus:bg-white transition-all font-bold text-slate-700 appearance-none cursor-pointer shadow-inner"
                                    >
                                        <option value="personal">Personal</option>
                                        <option value="others">Others</option>
                                    </select>
                                    <i className="ri-arrow-down-s-line absolute right-4 top-1/2 -translate-y-1/2 text-cyan-600 font-bold pointer-events-none"></i>
                                </div>
                            </div>
                        </div>

                        {/* Section: Phone & Address */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2 group">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Phone Number</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="phoneNo"
                                        value={formData.phoneNo}
                                        onChange={handleChange}
                                        placeholder="03xx xxxxxxx"
                                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-cyan-600 focus:bg-white transition-all font-bold text-slate-700 shadow-inner"
                                    />
                                    <i className="ri-phone-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-cyan-600 text-xl transition-colors"></i>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 group">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Primary Location</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="City or Street"
                                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-cyan-600 focus:bg-white transition-all font-bold text-slate-700 shadow-inner"
                                    />
                                    <i className="ri-map-pin-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-cyan-600 text-xl transition-colors"></i>
                                </div>
                            </div>
                        </div>

                        {/* Section: Notes */}
                        <div className="relative group">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Internal Remarks</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                className="w-full mt-2 bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 outline-none focus:border-cyan-600 focus:bg-white transition-all font-semibold text-slate-700 resize-none h-24 shadow-inner"
                                placeholder="Update details regarding this account holder..."
                            />
                        </div>

                        {/* Account Status Toggle */}
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <input
                                type="checkbox"
                                id="active-toggle"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                                className="w-5 h-5 accent-cyan-600 cursor-pointer"
                            />
                            <label htmlFor="active-toggle" className="text-xs font-black text-slate-500 uppercase tracking-widest cursor-pointer select-none">
                                Account Active Status
                            </label>
                        </div>

                        {/* Submit Action with Gradient Hover */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                className="w-full py-5 bg-slate-900 hover:bg-gradient-to-r hover:from-cyan-600 hover:to-cyan-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl shadow-slate-200 transition-all duration-500 active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                <i className="ri-save-3-line text-lg"></i>
                                Update Account Record
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default QarzaAccountEdit;

