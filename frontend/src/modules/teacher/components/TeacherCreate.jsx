
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTeacherCreate } from '../api/teacher.api.js';
import { useHotkeys } from 'react-hotkeys-hook';
import ImageCropper from '../../../common/components/ImageCropper.jsx'
import boy_user from '../../../assets/images/boy-user.jpg'
const TeacherCreate = ({ setVisibility, setData }) => {
    let teacherCreationMutate = useTeacherCreate()

    const fileInputRef = useRef(null);

    const [imagePreview, setImagePreview] = useState(null);
    const [showAdvancedFields, setShowAdvancedFields] = useState(false);
    const [tempInputs, setTempInputs] = useState({ language: '', skill: '', experience: '', degree: '' });
    const [isRollEditable, setIsRollEditable] = useState(false);

    const generateRollNo = () => Math.floor(100000 + Math.random() * 900000).toString();

    const [formData, setFormData] = useState({
        teacherId: generateRollNo(),
        name: '',
        fatherName: '',
        phone: '',
        email: '',
        address: '',
        post: 'teacher',
        education: '',
        isSalary: false,
        salary: "",
        isAbsenceCutEnabled: false, // UI Toggle
        perAttendenceCut: 0,
        cnicNo: '',
        hiringDate: new Date().toISOString().split('T')[0],
        // Partner Logic
        isPartner: false,
        partnerType: '', // 'overall' or 'custom'
        overallPartnerShareValue: '',
        // Bank Details
        bankName: '',
        accountNumber: '',
        // Arrays
        givenClasses: [],
        languages: [],
        skills: [],
        experiences: [],
        educationDegrees: [],
        teacherProfileImage: null,
        notes: '',
        isActive: true
    });

    useHotkeys("esc", (e) => { e.preventDefault(); e.stopPropagation(); setVisibility(false); }, { enableOnFormTags: true })

    useEffect(() => {
        if (!formData.teacherId) return;

        const checkDuplicate = async () => {
            try {
                const response = await apiClient.get(`/check-duplicate-teacher/${formData.teacherId}`);

                if (response.data.duplicate) {
                    yourFunction(); // replace with your actual function
                }
            } catch (error) {
                console.error("Error checking duplicate:", error);
            }
        };

        const debounce = setTimeout(() => {
            checkDuplicate();
        }, 500);

        return () => clearTimeout(debounce);
    }, [formData.teacherId]);



    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const addTag = (category, stateKey) => {
        const val = tempInputs[category].trim();
        if (!val) return;
        setFormData(prev => ({ ...prev, [stateKey]: [...prev[stateKey], val] }));
        setTempInputs(prev => ({ ...prev, [category]: '' }));
    };

    const removeTag = (stateKey, index) => {
        setFormData(prev => ({ ...prev, [stateKey]: prev[stateKey].filter((_, i) => i !== index) }));
    };

    // const handleProfileChange = (e) => {
    //     const file = e.target.files[0];
    //     if (file) {
    //         setFormData(prev => ({ ...prev, teacherProfileImage: file }));
    //         setImagePreview(URL.createObjectURL(file));
    //     }
    // };


    const handleProfileChange = (files) => {
        const file = files[0];
        if (file) {
            setFormData(prev => ({ ...prev, teacherProfileImage: file }));
            setImagePreview(URL.createObjectURL(file));
        }
    };




    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();

            // Logic: Separate Files/Arrays from regular fields
            Object.keys(formData).forEach(key => {
                if (!['teacherProfileImage', 'documents', 'languages', 'skills', 'experiences', 'educationDegrees', 'givenClasses'].includes(key)) {
                    data.append(key, formData[key]);
                }
            });

            // Append Arrays as JSON
            ['languages', 'skills', 'experiences', 'educationDegrees', 'givenClasses'].forEach(key => {
                data.append(key, JSON.stringify(formData[key]));
            });

            if (formData.teacherProfileImage) data.append('teacherProfileImage', formData.teacherProfileImage);
            formData?.documents?.forEach((file) => data.append('documents', file));


            await teacherCreationMutate.mutateAsync(data)

            toast.success("Faculty Registered Successfully");
            setVisibility(false);

        } catch (error) {
            console.error(error)
        }
        toast.info("Processing Submission...");
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"></div>

            <div className="relative max-h-[95vh] w-full max-w-[90%] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row animate-in zoom-in-95">

                {/* Left Panel: Profile Photo Section */}
                <div className="lg:w-[20%] bg-linear-to-b from-cyan-700 to-cyan-600 p-8 flex flex-col items-center border-r border-slate-100">
                    <div className="relative mb-8 flex-shrink-0 w-50 h-50">

                        <ImageCropper
                            accept="image/*"
                            aspectRatio={1}
                            cropShape="round"
                            showPreview={false}
                            onChange={handleProfileChange}
                        >
                            <div className="w-50 h-50 rounded-full bg-cyan-800 border-4 border-cyan-500/30 overflow-hidden cursor-pointer hover:scale-105 transition-all flex items-center justify-center">
                                {imagePreview
                                    ? <img src={imagePreview} className="w-50 h-50 object-cover rounded-full" />
                                    : <div className="w-50 h-50 rounded-full flex flex-col items-center justify-center gap-2">
                                        <i className="ri-user-settings-line text-6xl text-cyan-400" />
                                        <span className="text-[9px] font-black text-cyan-300 uppercase tracking-widest">Upload Photo</span>
                                    </div>
                                }
                            </div>
                        </ImageCropper>

                    </div>
                    <h2 className="text-xl font-black text-white text-center uppercase tracking-tighter">New Registration</h2>
                    <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-widest">{formData.post}</p>
                </div>

                {/* Right Panel: Scrollable Form */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden">
                    <button onClick={() => setVisibility(false)} className="absolute right-6 top-6 z-20 w-10 h-10 bg-slate-50 hover:bg-rose-500 hover:text-white rounded-full flex items-center justify-center transition-all">
                        <i className="ri-close-line text-xl"></i>
                    </button>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-10 custom-scrollbar">

                        {/* Section 1: Basic Identity */}
                        <section className="space-y-6">
                            <SectionHeader title="Basic Personal Information" />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="relative">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Reg ID</label>
                                    <input name="teacherId" value={formData.teacherId} onChange={handleChange} readOnly={!isRollEditable} className={`w-full bg-slate-50 border-2 rounded-2xl px-4 py-3 font-bold ${isRollEditable ? 'border-cyan-500' : 'border-transparent'}`} />
                                    <button type="button" onClick={() => setIsRollEditable(!isRollEditable)} className="absolute right-3 top-9 text-slate-400"><i className={isRollEditable ? "ri-lock-unlock-line" : "ri-lock-line"}></i></button>
                                </div>
                                <CustomInput autoFocus label="Full Name" name="name" value={formData.name} onChange={handleChange} required icon="ri-user-line" />
                                <CustomInput label="Father Name" name="fatherName" value={formData.fatherName} onChange={handleChange} icon="ri-parent-line" />
                                <CustomInput label="Phone No" name="phone" value={formData.phone} onChange={handleChange} required icon="ri-phone-line" />
                                <CustomInput label="Hiring Date" name="hiringDate" type="date" value={formData.hiringDate} onChange={handleChange} icon="ri-calendar-line" />
                                <CustomSelect label="Designation" name="post" value={formData.post} onChange={handleChange} options={[{ v: 'teacher', n: 'Teacher' }, { v: 'intern', n: 'Intern' }]} opLabel="n" opValue="v" />
                            </div>
                        </section>






                        {/* Section 2: Financial & Partnership */}
                        {/* <section className="p-6 bg-slate-50 rounded-[2rem] space-y-6">
                            <SectionHeader title="Contract & Financials" />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">

                                {formData.post === 'teacher' && (
                                    <CustomInput label="Fixed Monthly Salary" name="salary" type="number" 
    onWheel={(e) => e.target.blur()} value={formData.salary} onChange={handleChange} icon="ri-money-dollar-circle-line" />
                                )}

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 mb-2 ml-1 text-[10px] font-black text-slate-400 uppercase">
                                        Absence Deduction
                                        <input type="checkbox" name="isAbsenceCutEnabled" checked={formData.isAbsenceCutEnabled} onChange={handleChange} className="w-4 h-4 accent-cyan-600" />
                                    </label>
                                    {formData.isAbsenceCutEnabled && (
                                        <div className="animate-in fade-in slide-in-from-left-2">
                                            <CustomInput label="" name="perAttendenceCut" type="number" 
    onWheel={(e) => e.target.blur()} value={formData.perAttendenceCut} onChange={handleChange} icon="ri-scissors-cut-line" />
                                        </div>
                                    )}
                                </div>


                            </div>
                        </section> */}

                        {/* Section 2: Financial & Partnership */}
                        <section className="p-8 bg-slate-50 rounded-[2.5rem] space-y-8 border border-slate-100 shadow-sm">
                            <SectionHeader title="Contract & Financials" icon="ri-bank-card-line" />

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">

                                {/* Step 1: Enable Salary Toggle */}
                                <div className={`space-y-4 p-5 rounded-2xl border transition-all duration-300 ${formData.isSalary ? 'bg-white border-cyan-200 shadow-md scale-[1.02]' : 'bg-white/50 border-slate-200 opacity-90'}`}>
                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="flex items-center gap-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${formData.isSalary ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                <i className="ri-money-dollar-circle-line text-lg"></i>
                                            </div>
                                            Salary Setup
                                        </span>
                                        <input
                                            type="checkbox"
                                            name="isSalary"
                                            checked={formData.isSalary}
                                            onChange={handleChange}
                                            className="w-5 h-5 accent-cyan-600 cursor-pointer"
                                        />
                                    </label>

                                    {formData.isSalary && (
                                        <div className="animate-in zoom-in-95 fade-in duration-300 pt-2">
                                            <CustomInput
                                                label="Fixed Monthly Salary"
                                                name="salary"
                                                type="number"
                                                onWheel={(e) => e.target.blur()}
                                                value={formData.salary}
                                                onChange={handleChange}
                                                icon="ri-wallet-3-line"
                                                placeholder="Enter Amount"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Step 2: Absence Deduction - Only visible if Salary > 0 */}
                                {formData.isSalary && Number(formData.salary) > 0 && (
                                    <div className={`space-y-4 p-5 rounded-2xl border animate-in slide-in-from-right-5 duration-500 transition-all ${formData.isAbsenceCutEnabled ? 'bg-white border-red-200 shadow-md scale-[1.02]' : 'bg-white/50 border-slate-200'}`}>
                                        <label className="flex items-center justify-between cursor-pointer group">
                                            <span className="flex items-center gap-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${formData.isAbsenceCutEnabled ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                    <i className="ri-scissors-cut-line text-lg"></i>
                                                </div>
                                                Absence Policy
                                            </span>
                                            <input
                                                type="checkbox"
                                                name="isAbsenceCutEnabled"
                                                checked={formData.isAbsenceCutEnabled}
                                                onChange={handleChange}
                                                className="w-5 h-5 accent-red-500 cursor-pointer"
                                            />
                                        </label>

                                        {formData.isAbsenceCutEnabled && (
                                            <div className="animate-in slide-in-from-top-2 fade-in duration-300 pt-2">
                                                <CustomInput
                                                    label="Per Day Deduction"
                                                    name="perAttendenceCut"
                                                    type="number"
                                                    onWheel={(e) => e.target.blur()}
                                                    value={formData.perAttendenceCut}
                                                    onChange={handleChange}
                                                    icon="ri-hand-coin-line"
                                                    placeholder="Amount per absence"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>
                        </section>


                        <div className="flex flex-wrap gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">

                            {/* Is Partner Toggle */}
                            <div className="flex items-center gap-4 py-3 px-5 bg-white rounded-2xl shadow-sm border border-slate-100 min-w-[200px] justify-between">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Business Partner</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isPartner"
                                        className="sr-only peer"
                                        checked={formData.isPartner}
                                        onChange={(e) => { setFormData(prev => ({ ...formData, isPartner: !formData.isPartner, partnerType: "" })) }}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-cyan-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>
                            {formData.isPartner && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    {/* Toggle Buttons */}
                                    <div className="flex p-1 bg-slate-100 rounded-xl w-72">
                                        {['overall', 'custom'].map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, partnerType: type, overallPartnerShareValue: "" })}
                                                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${formData.partnerType === type ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-500'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Sirf Overall par input dikhega */}
                                    {formData.partnerType === 'overall' && (
                                        <div className="w-full max-w-sm animate-in slide-in-from-left-2">
                                            <CustomInput label="Institute Share (%)" name="overallPartnerShareValue" type="number"
                                                onWheel={(e) => e.target.blur()} value={formData.overallPartnerShareValue} onChange={handleChange} icon="ri-percent-line" />
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>



                        <div className="flex flex-wrap gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">



                            {/* Is Active Toggle */}
                            <div className="flex items-center gap-4 py-3 px-5 bg-white rounded-2xl shadow-sm border border-slate-100 min-w-[200px] justify-between">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Account Status</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isActive" // Ensure you add 'isActive' in your formData state
                                        className="sr-only peer"
                                        checked={formData.isActive}
                                        onChange={handleChange}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>

                        </div>


                        {/* Section 4: Advanced Toggle Section */}
                        <div className="flex justify-center">
                            <button type="button" onClick={() => setShowAdvancedFields(!showAdvancedFields)} className="px-6 py-2 bg-slate-900 text-white rounded-full text-[12px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-cyan-600 transition-colors">
                                {showAdvancedFields ? "Hide Extra Details" : "Show Extra Details (Bank, Education, CNIC)"}
                                <i className={showAdvancedFields ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}></i>
                            </button>
                        </div>

                        {showAdvancedFields && (
                            <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <CustomInput label="CNIC Number" name="cnicNo" value={formData.cnicNo} minLength={0} maxLength={13} onChange={handleChange} icon="ri-id-card-line" />
                                    <CustomInput label="Highest Education" name="education" value={formData.education} onChange={handleChange} icon="ri-graduation-cap-line" />
                                    <CustomInput label="Bank Name" name="bankName" value={formData.bankName} onChange={handleChange} icon="ri-bank-line" />
                                    <CustomInput label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} icon="ri-numbers-line" />
                                    <CustomInput label="Official Email" name="email" value={formData.email} onChange={handleChange} icon="ri-mail-line" />
                                    <CustomInput label="Home Address" name="address" value={formData.address} onChange={handleChange} icon="ri-map-pin-line" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <DynamicTagInput label="Languages" category="language" list={formData.languages} value={tempInputs.language} onChange={(v) => setTempInputs({ ...tempInputs, language: v })} onAdd={() => addTag('language', 'languages')} onRemove={(i) => removeTag('languages', i)} />
                                    <DynamicTagInput label="Skills" category="skill" list={formData.skills} value={tempInputs.skill} onChange={(v) => setTempInputs({ ...tempInputs, skill: v })} onAdd={() => addTag('skill', 'skills')} onRemove={(i) => removeTag('skills', i)} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <DynamicTagInput label="Experiences" category="experience" list={formData.experiences} value={tempInputs.experience} onChange={(v) => setTempInputs({ ...tempInputs, experience: v })} onAdd={() => addTag('experience', 'experiences')} onRemove={(i) => removeTag('experiences', i)} />
                                    <DynamicTagInput label="Education Degrees" category="educationDegree" list={formData.educationDegrees} value={tempInputs.degree} onChange={(v) => setTempInputs({ ...tempInputs, degree: v })} onAdd={() => addTag('degree', 'educationDegrees')} onRemove={(i) => removeTag('educationDegrees', i)} />
                                </div>

                                <div className="w-full">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1"> Notes</label>
                                    <textarea name="notes" value={formData.notes} onChange={handleChange} className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 outline-none focus:border-cyan-500 font-bold text-slate-700 min-h-[100px]" placeholder="Update teacher history..." />
                                </div>
                            </div>
                        )}

                        <button type="submit" className="w-full py-5 bg-cyan-600 hover:bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95">
                            Verify & Register Faculty
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- Helper Components ---

const SectionHeader = ({ title }) => (
    <div className="flex items-center gap-3">
        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{title}</h3>
        <div className="h-px flex-1 bg-slate-100"></div>
    </div>
);

const CustomInput = ({ label, icon, value, ...props }) => (
    <div className="relative w-full group">
        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-cyan-600 transition-colors">{label}</label>
        <div className="relative">
            <i className={`${icon} absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-cyan-500 text-lg transition-colors`}></i>
            <input {...props} value={value} className="w-full bg-white border-2 border-slate-100 rounded-xl pl-11 pr-5 py-3 outline-none focus:border-cyan-500 transition-all font-bold text-slate-700 text-sm" />
        </div>
    </div>
);

const CustomSelect = ({ label, options, opLabel, opValue, value, ...props }) => (
    <div className="relative w-full group">
        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-cyan-600 transition-colors">{label}</label>
        <div className="relative">
            <select {...props} value={value} className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition-all font-bold text-slate-700 text-sm appearance-none cursor-pointer">
                {options?.map((opt, i) => <option key={i} value={opt[opValue]}>{opt[opLabel]}</option>)}
            </select>
            <i className="ri-arrow-down-s-line absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg"></i>
        </div>
    </div>
);

const DynamicTagInput = ({ label, list, value, onChange, onAdd, onRemove }) => (
    <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        <div className="flex gap-2">
            <input type="text" value={value} onChange={(e) => onChange(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd())} className="flex-1 bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-[11px] font-bold outline-none" placeholder={`Add ${label}...`} />
            <button type="button" onClick={onAdd} className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-cyan-600 transition-all"><i className="ri-add-line"></i></button>
        </div>
        <div className="flex flex-wrap gap-1.5">
            {list.map((item, i) => (
                <span key={i} className="px-2 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-2">
                    {item} <i className="ri-close-line cursor-pointer text-rose-500" onClick={() => onRemove(i)}></i>
                </span>
            ))}
        </div>
    </div>
);

export default TeacherCreate;