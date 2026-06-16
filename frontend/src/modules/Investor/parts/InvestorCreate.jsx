
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { useCreateMemberMutation } from '../../member/api/member.rtk.api.js';
import { useHotkeys } from 'react-hotkeys-hook';
import ImageCropper from '../../../common/components/ImageCropper.jsx';
import api from '../../../lib/api.js';

const MemberCreate = ({ setVisibility, setData }) => {
    let [createMember] = useCreateMemberMutation()
    let { data: allclassesData } = useGetAllClassesQuery();

    const fileInputRef = useRef(null);

    const [imagePreview, setImagePreview] = useState(null);
    const [showAdvancedFields, setShowAdvancedFields] = useState(false);
    const [tempInputs, setTempInputs] = useState({ language: '', skill: '', experience: '', degree: '' });
    const [isRollEditable, setIsRollEditable] = useState(false);

    const generateRollNo = () => Math.floor(100000 + Math.random() * 900000).toString();

    const [formData, setFormData] = useState({
        memberId: generateRollNo(),
        name: '',
        fatherName: '',
        phone: '',
        email: '',
        address: '',
        post: 'investor',
        education: '',
        isSalary: false,
        salary: "",
        isAbsenceCutEnabled: false, // UI Toggle
        perAttendenceCut: 0,
        cnicNo: '',
        hiringDate: new Date().toISOString().split('T')[0],
        // Partner Logic
        isPartner: true,
        partnerType: 'custom', // 'overall' or 'custom'
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
        memberProfileImage: null,
        notes: '',
        isActive: true
    });

    useHotkeys("esc", (e) => { e.preventDefault(); e.stopPropagation(); setVisibility(false); }, { enableOnFormTags: true })

    useEffect(() => {
        if (!formData.memberId) return;

        const checkDuplicate = async () => {
            try {
                const response = await api.get(`/memberRoutes/${formData.memberId}`);

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
    }, [formData.memberId]);








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
    //         setFormData(prev => ({ ...prev, memberProfileImage: file }));
    //         setImagePreview(URL.createObjectURL(file));
    //     }
    // };

        const handleProfileChange = (files) => {
        const file = files[0];
        if (file) {
            setFormData(prev => ({ ...prev, memberProfileImage: file }));
            setImagePreview(URL.createObjectURL(file));
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log(formData)
            const data = new FormData();

            // Logic: Separate Files/Arrays from regular fields
            Object.keys(formData).forEach(key => {
                if (!['memberProfileImage', 'documents', 'languages', 'skills', 'experiences', 'educationDegrees', 'givenClasses'].includes(key)) {
                    data.append(key, formData[key]);
                }
            });

            // Append Arrays as JSON
            ['languages', 'skills', 'experiences', 'educationDegrees', 'givenClasses'].forEach(key => {
                data.append(key, JSON.stringify(formData[key]));
            });

            if (formData.memberProfileImage) data.append('memberProfileImage', formData.memberProfileImage);
            formData?.documents?.forEach((file) => data.append('documents', file));


            await createMember(data).unwrap()

            toast.success("Faculty Registered Successfully");
            setVisibility(false);

        } catch (error) {
            console.log(error)
        }
        toast.info("Processing Submission...");
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 app-overlay"></div>

            <div className="relative max-h-[95vh] w-full max-w-[90%] bg-surface rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row app-enter">

                {/* Left Panel: Profile Photo Section */}
                <div className="lg:w-[20%] app-gradient-vertical p-8 flex flex-col items-center border-r border-edge">
                    {/* <div className="relative group w-40 h-40 border-4 shadow-md border-primary-hover rounded-full mb-6">
                        <div onClick={() => fileInputRef.current.click()} className="w-full h-full rounded-full bg-primary-hover border-4 border-edge-brand/30 overflow-hidden cursor-pointer hover:scale-105 transition-all flex items-center justify-center">
                            {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <i className="ri-camera-3-line text-3xl text-ink"></i>}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleProfileChange} hidden accept="image/*" />
                    </div> */}
                    <ImageCropper
                        accept="image/*"
                        aspectRatio={1}
                        cropShape="round"
                        showPreview={false}
                        onChange={handleProfileChange}
                    >
                        <div className="w-50 h-50 rounded-full bg-primary-hover border-4 border-edge-brand/30 overflow-hidden cursor-pointer hover:scale-105 transition-all flex items-center justify-center">
                            {imagePreview
                                ? <img src={imagePreview} className="w-50 h-50 object-cover rounded-full" />
                                : <div className="w-50 h-50 rounded-full flex flex-col items-center justify-center gap-2">
                                    <i className="ri-user-settings-line text-6xl text-accent" />
                                    <span className="text-[9px] font-black text-accent uppercase tracking-widest">Upload Photo</span>
                                </div>
                            }
                        </div>
                    </ImageCropper>
                    <h2 className="text-xl font-black text-primary-foreground text-center uppercase tracking-tighter">New Registration</h2>
                    <p className="text-[10px] text-ink-muted font-bold mt-2 uppercase tracking-widest">{formData.post}</p>
                </div>

                {/* Right Panel: Scrollable Form */}
                <div className="flex-1 flex flex-col bg-surface overflow-hidden">
                    <button onClick={() => setVisibility(false)} className="absolute right-6 top-6 z-20 w-10 h-10 bg-surface-muted hover:bg-danger hover:text-primary-foreground rounded-full flex items-center justify-center transition-all">
                        <i className="ri-close-line text-xl"></i>
                    </button>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-10 custom-scrollbar">

                        {/* Section 1: Basic Identity */}
                        <section className="space-y-6">
                            <SectionHeader title="Basic Personal Information" />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="relative">
                                    <label className="block text-[10px] font-black text-ink-subtle uppercase mb-2 ml-1">Reg ID</label>
                                    <input name="memberId" value={formData.memberId} onChange={handleChange} readOnly={!isRollEditable} className={`w-full bg-surface-muted border-2 rounded-2xl px-4 py-3 font-bold ${isRollEditable ? 'border-edge-brand' : 'border-transparent'}`} />
                                    <button type="button" onClick={() => setIsRollEditable(!isRollEditable)} className="absolute right-3 top-9 text-ink-subtle"><i className={isRollEditable ? "ri-lock-unlock-line" : "ri-lock-line"}></i></button>
                                </div>
                                <CustomInput autoFocus label="Full Name" name="name" value={formData.name} onChange={handleChange} required icon="ri-user-line" />
                                <CustomInput label="Father Name" name="fatherName" value={formData.fatherName} onChange={handleChange} icon="ri-parent-line" />
                                <CustomInput type={"number"} label="Phone No" name="phone" value={formData.phone} onChange={handleChange} required icon="ri-phone-line" />
                                <CustomInput label="Investment Start Date" name="hiringDate" type="date" value={formData.hiringDate} onChange={handleChange} icon="ri-calendar-line" />
                                {/* <CustomSelect label="Designation" name="post" value={formData.post} onChange={handleChange} options={[{ v: 'member', n: 'Member' }, { v: 'intern', n: 'Intern' }]} opLabel="n" opValue="v" /> */}
                            </div>
                        </section>




                        {/* Section 3: Class Selection */}
                        {/* {formData.post === 'member' && (
                            <section className="space-y-4">
                                <SectionHeader title="Class Assignments" />
                                <div className="flex flex-wrap gap-2">
                                    {allclassesData?.map((cls) => (
                                        <button
                                            key={cls._id}
                                            type="button"
                                            onClick={() => {
                                                const exists = formData.givenClasses.includes(cls._id);
                                                setFormData(p => ({
                                                    ...p,
                                                    givenClasses: exists ? p.givenClasses.filter(id => id !== cls._id) : [...p.givenClasses, cls._id]
                                                }));
                                            }}
                                            className={`px-4 py-2 rounded-xl text-[12px] font-black uppercase transition-all border-2 ${formData.givenClasses.includes(cls._id) ? 'bg-primary border-primary text-primary-foreground' : 'bg-surface border-edge text-ink-subtle'}`}
                                        >
                                            {cls.className}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )} */}



                        {/* Section 2: Financial & Partnership */}
                        {/* <section className="p-6 bg-surface-muted rounded-[2rem] space-y-6">
                            <SectionHeader title="Contract & Financials" />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">

                                {formData.post === 'member' && (
                                    <CustomInput label="Fixed Monthly Salary" name="salary" type="number" 
    onWheel={(e) => e.target.blur()} value={formData.salary} onChange={handleChange} icon="ri-money-dollar-circle-line" />
                                )}

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 mb-2 ml-1 text-[10px] font-black text-ink-subtle uppercase">
                                        Absence Deduction
                                        <input type="checkbox" name="isAbsenceCutEnabled" checked={formData.isAbsenceCutEnabled} onChange={handleChange} className="w-4 h-4 accent-primary" />
                                    </label>
                                    {formData.isAbsenceCutEnabled && (
                                        <div className="app-enter slide-in-from-left-2">
                                            <CustomInput label="" name="perAttendenceCut" type="number" 
    onWheel={(e) => e.target.blur()} value={formData.perAttendenceCut} onChange={handleChange} icon="ri-scissors-cut-line" />
                                        </div>
                                    )}
                                </div>


                            </div>
                        </section> */}

                        {/* Section 2: Financial & Partnership */}
                        {/* <section className="p-8 bg-surface-muted rounded-[2.5rem] space-y-8 border border-edge shadow-sm">
                            <SectionHeader title="Contract & Financials" icon="ri-bank-card-line" />

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">

                                <div className={`space-y-4 p-5 rounded-2xl border transition-all duration-300 ${formData.isSalary ? 'bg-surface border-edge-brand shadow-md scale-[1.02]' : 'bg-surface/50 border-edge opacity-90'}`}>
                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="flex items-center gap-3 text-[11px] font-black text-ink-muted uppercase tracking-widest">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${formData.isSalary ? 'bg-primary-muted text-primary-foreground' : 'bg-surface-muted text-ink-subtle'}`}>
                                                <i className="ri-money-dollar-circle-line text-lg"></i>
                                            </div>
                                            Salary Setup
                                        </span>
                                        <input
                                            type="checkbox"
                                            name="isSalary"
                                            checked={formData.isSalary}
                                            onChange={handleChange}
                                            className="w-5 h-5 accent-primary cursor-pointer"
                                        />
                                    </label>

                                    {formData.isSalary && (
                                        <div className="app-enter pt-2">
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

                                {formData.isSalary && Number(formData.salary) > 0 && (
                                    <div className={`space-y-4 p-5 rounded-2xl border app-enter transition-all ${formData.isAbsenceCutEnabled ? 'bg-surface border-danger shadow-md scale-[1.02]' : 'bg-surface/50 border-edge'}`}>
                                        <label className="flex items-center justify-between cursor-pointer group">
                                            <span className="flex items-center gap-3 text-[11px] font-black text-ink-muted uppercase tracking-widest">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${formData.isAbsenceCutEnabled ? 'bg-danger text-primary-foreground' : 'bg-surface-muted text-ink-subtle'}`}>
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
                                            <div className="app-enter pt-2">
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
                        </section> */}

                        {/* 
                        <div className="flex flex-wrap gap-6 p-6 bg-surface-muted rounded-[2rem] border border-edge">

                            <div className="flex items-center gap-4 py-3 px-5 bg-surface rounded-2xl shadow-sm border border-edge min-w-[200px] justify-between">
                                <span className="text-[10px] font-black text-ink-muted uppercase tracking-widest">Business Partner</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isPartner"
                                        className="sr-only peer"
                                        checked={formData.isPartner}
                                        onChange={(e) => { setFormData(prev => ({ ...formData, isPartner: !formData.isPartner, partnerType: "" })) }}
                                    />
                                    <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>
                            {formData.isPartner && (
                                <div className="space-y-4 app-enter">
                                    <div className="flex p-1 bg-surface-muted rounded-xl w-72">
                                        {['overall', 'custom'].map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, partnerType: type, overallPartnerShareValue: "" })}
                                                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${formData.partnerType === type ? 'bg-primary text-primary-foreground shadow-md' : 'text-ink-muted'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>

                                    {formData.partnerType === 'overall' && (
                                        <div className="w-full max-w-sm app-enter">
                                            <CustomInput label="Institute Share (%)" name="overallPartnerShareValue" type="number" 
    onWheel={(e) => e.target.blur()} value={formData.overallPartnerShareValue} onChange={handleChange} icon="ri-percent-line" />
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
 */}


                        <div className="flex flex-wrap gap-6 p-6 bg-surface-muted rounded-[2rem] border border-edge">



                            {/* Is Active Toggle */}
                            <div className="flex items-center gap-4 py-3 px-5 bg-surface rounded-2xl shadow-sm border border-edge min-w-[200px] justify-between">
                                <span className="text-[10px] font-black text-ink-muted uppercase tracking-widest">Account Status</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isActive" // Ensure you add 'isActive' in your formData state
                                        className="sr-only peer"
                                        checked={formData.isActive}
                                        onChange={handleChange}
                                    />
                                    <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-success after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>

                        </div>


                        {/* Section 4: Advanced Toggle Section */}
                        <div className="flex justify-center">
                            <button type="button" onClick={() => setShowAdvancedFields(!showAdvancedFields)} className="px-6 py-2 bg-inverse text-primary-foreground rounded-full text-[12px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary transition-colors">
                                {showAdvancedFields ? "Hide Extra Details" : "Show Extra Details (Bank, Education, CNIC)"}
                                <i className={showAdvancedFields ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}></i>
                            </button>
                        </div>

                        {showAdvancedFields && (
                            <div className="space-y-8 app-enter">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <CustomInput type={"number"} label="CNIC Number" name="cnicNo" value={formData.cnicNo} minLength={0} maxLength={13} onChange={handleChange} icon="ri-id-card-line" />
                                    <CustomInput label="Highest Education" name="education" value={formData.education} onChange={handleChange} icon="ri-graduation-cap-line" />
                                    <CustomInput label="Bank Name" name="bankName" value={formData.bankName} onChange={handleChange} icon="ri-bank-line" />
                                    <CustomInput type={"number"} label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} icon="ri-numbers-line" />
                                    <CustomInput type={"email"} label="Official Email" name="email" value={formData.email} onChange={handleChange} icon="ri-mail-line" />
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
                                    <label className="block text-[10px] font-black text-ink-subtle uppercase mb-2 ml-1"> Notes</label>
                                    <textarea name="notes" value={formData.notes} onChange={handleChange} className="w-full bg-surface border-2 border-edge rounded-2xl p-4 outline-none focus:border-edge-brand font-bold text-ink min-h-[100px]" placeholder="Update member history..." />
                                </div>
                            </div>
                        )}

                        <button type="submit" className="w-full py-5 bg-primary hover:bg-inverse text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95">
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
        <h3 className="text-[11px] font-black text-ink uppercase tracking-widest">{title}</h3>
        <div className="h-px flex-1 bg-surface-muted"></div>
    </div>
);

const CustomInput = ({ label, icon, value, ...props }) => (
    <div className="relative w-full group">
        <label className="block text-[11px] font-black text-ink-subtle uppercase tracking-widest mb-2 ml-1 group-focus-within:text-primary transition-colors">{label}</label>
        <div className="relative">
            <i className={`${icon} absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle group-focus-within:text-ink text-lg transition-colors`}></i>
            <input {...props} value={value} className="w-full bg-surface border-2 border-edge rounded-xl pl-11 pr-5 py-3 outline-none focus:border-edge-brand transition-all font-bold text-ink text-sm" />
        </div>
    </div>
);

const CustomSelect = ({ label, options, opLabel, opValue, value, ...props }) => (
    <div className="relative w-full group">
        <label className="block text-[11px] font-black text-ink-subtle uppercase tracking-widest mb-2 ml-1 group-focus-within:text-primary transition-colors">{label}</label>
        <div className="relative">
            <select {...props} value={value} className="w-full bg-surface border-2 border-edge rounded-xl px-4 py-3 outline-none focus:border-edge-brand transition-all font-bold text-ink text-sm appearance-none cursor-pointer">
                {options?.map((opt, i) => <option key={i} value={opt[opValue]}>{opt[opLabel]}</option>)}
            </select>
            <i className="ri-arrow-down-s-line absolute right-4 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none text-lg"></i>
        </div>
    </div>
);

const DynamicTagInput = ({ label, list, value, onChange, onAdd, onRemove }) => (
    <div className="bg-surface-muted p-4 rounded-2xl space-y-3">
        <label className="text-[11px] font-black text-ink-subtle uppercase tracking-widest">{label}</label>
        <div className="flex gap-2">
            <input type="text" value={value} onChange={(e) => onChange(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd())} className="flex-1 bg-surface border-2 border-edge rounded-xl px-4 py-2 text-[11px] font-bold outline-none" placeholder={`Add ${label}...`} />
            <button type="button" onClick={onAdd} className="w-9 h-9 bg-inverse text-primary-foreground rounded-xl flex items-center justify-center hover:bg-primary transition-all"><i className="ri-add-line"></i></button>
        </div>
        <div className="flex flex-wrap gap-1.5">
            {list.map((item, i) => (
                <span key={i} className="px-2 py-1 bg-surface border border-edge text-ink rounded-lg text-[11px] font-bold flex items-center gap-2">
                    {item} <i className="ri-close-line cursor-pointer text-danger" onClick={() => onRemove(i)}></i>
                </span>
            ))}
        </div>
    </div>
);

export default MemberCreate;