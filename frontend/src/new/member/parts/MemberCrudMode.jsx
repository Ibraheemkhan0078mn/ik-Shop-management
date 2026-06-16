import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useGetAllClassesQuery } from '../../class/services/class.rtk.service.js';
import { useHotkeys } from 'react-hotkeys-hook';
import ImageCropper from '../../../shared/components/ImageCropper';
import {
    useGetMemberByIdQuery,
    useCreateMemberMutation,
    useUpdateMemberMutation,
} from '../api/member.rtk.api';

const generateRollNo = () => Math.floor(100000 + Math.random() * 900000).toString();

const DEFAULT_FORM = {
    memberDocId: '',
    memberId: generateRollNo(),
    name: '',
    fatherName: '',
    phone: '',
    email: '',
    address: '',
    post: 'member',
    education: '',
    isSalary: false,
    salary: '',
    isAbsenceCutEnabled: false,
    perAttendenceCut: 0,
    cnicNo: '',
    hiringDate: new Date().toISOString().split('T')[0],
    isPartner: false,
    partnerType: '',
    overallPartnerShareValue: '',
    bankName: '',
    accountNumber: '',
    notes: '',
    givenClasses: [],
    languages: [],
    skills: [],
    experiences: [],
    educationDegrees: [],
    memberProfileImage: null,
    isActive: true,
};

/**
 * MemberModal
 * @param {'create' | 'update'} operation
 * @param {string} [memberId]  — required when operation === 'update'
 * @param {Function} setVisibility
 */
const MemberCrudModel = ({ operation, memberId, setVisibility }) => {
    const isUpdate = operation === 'update';

    // ── RTK Queries / Mutations ──────────────────────────────────────────────
    const { data: memberData } = useGetMemberByIdQuery(memberId, { skip: !isUpdate || !memberId });
    const [createMember] = useCreateMemberMutation();
    const [updateMember] = useUpdateMemberMutation();

    const { data: allClassesData } = useGetAllClassesQuery();

    // ── Local State ──────────────────────────────────────────────────────────
    const [imagePreview, setImagePreview] = useState(null);
    const [showAdvancedFields, setShowAdvancedFields] = useState(false);
    const [tempInputs, setTempInputs] = useState({ language: '', skill: '', experience: '', degree: '' });
    const [isRollEditable, setIsRollEditable] = useState(false);
    const [formData, setFormData] = useState(DEFAULT_FORM);

    // ── Hotkeys ──────────────────────────────────────────────────────────────
    useHotkeys('esc', (e) => { e.preventDefault(); e.stopPropagation(); setVisibility(false); }, { enableOnFormTags: true });

    // ── Hydrate form on UPDATE ───────────────────────────────────────────────
    useEffect(() => {
        if (isUpdate && memberData) {
            setFormData({
                memberDocId: memberData._id,
                memberId: memberData.instituteId || '',
                name: memberData.name || '',
                fatherName: memberData.fatherName || '',
                phone: memberData.phoneNo || '',
                email: memberData.email || '',
                address: memberData.address || '',
                post: memberData.post || 'member',
                education: memberData.education || '',
                salary: memberData.salary || '',
                isSalary: memberData.isSalary ?? false,
                isAbsenceCutEnabled: memberData.isAbsenceCutEnabled ?? false,
                perAttendenceCut: memberData.perAttendenceCut || 0,
                cnicNo: memberData.cnic || '',
                hiringDate: memberData.hiringDate
                    ? new Date(memberData.hiringDate).toISOString().split('T')[0]
                    : '',
                isPartner: memberData.isPartner ?? false,
                partnerType: memberData.partnerType || '',
                overallPartnerShareValue: memberData.overallPartnerShareValue || '',
                bankName: memberData.bankName || '',
                accountNumber: memberData.accountNumber || '',
                notes: memberData.notes || '',
                givenClasses: memberData.givenClasses || [],
                languages: memberData.languages || [],
                skills: memberData.skills || [],
                experiences: memberData.experiences || [],
                educationDegrees: memberData.educationDegrees || [],
                memberProfileImage: null,
                isActive: memberData.isActive ?? true,
            });

            if (memberData.profileImage) {
                setImagePreview(`http://localhost:4000/uploads/${memberData.profileImage}`);
            }
        }
    }, [isUpdate, memberData]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        if (name === 'post' && value === 'member') {
            setFormData(prev => ({ ...prev, isPartner: false }));
        }
        if (name === 'isAbsenceCutEnabled' && !checked) {
            setFormData(prev => ({ ...prev, perAttendenceCut: '' }));
        }
        if (name === 'isSalary' && !checked) {
            setFormData(prev => ({ ...prev, salary: '', isAbsenceCutEnabled: false, perAttendenceCut: '' }));
        }
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
            const data = new FormData();

            Object.keys(formData).forEach(key => {
                if (!['memberProfileImage', 'documents', 'languages', 'skills', 'experiences', 'educationDegrees', 'givenClasses'].includes(key)) {
                    data.append(key, formData[key]);
                }
            });

            ['languages', 'skills', 'experiences', 'educationDegrees', 'givenClasses'].forEach(key => {
                data.append(key, JSON.stringify(formData[key]));
            });

            if (formData.memberProfileImage) data.append('memberProfileImage', formData.memberProfileImage);
            formData?.documents?.forEach((file) => data.append('documents', file));

            if (isUpdate) {
                await updateMember(data).unwrap();
                toast.success('Profile Updated Successfully');
            } else {
                await createMember(data).unwrap();
                toast.success('Faculty Registered Successfully');
            }

            setVisibility(false);
        } catch (error) {
            console.error(error);
            toast.error(isUpdate ? 'Error updating profile' : 'Error registering faculty');
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 app-overlay"></div>

            <div className="relative max-h-[95vh] w-full max-w-[90%] bg-surface rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row app-enter">

                {/* Left Panel */}
                <div className="lg:w-[20%] app-gradient-vertical p-8 flex flex-col items-center border-r border-edge">
                    <div className="relative mb-8 flex-shrink-0 w-50 h-50">
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
                    </div>

                    <h2 className="text-xl font-black text-primary-foreground text-center uppercase tracking-tighter">
                        {isUpdate ? <>Modify<br />Faculty</> : <>New<br />Registration</>}
                    </h2>
                    <p className="text-[10px] text-primary-muted font-bold mt-2 uppercase tracking-widest">{formData.post}</p>
                </div>

                {/* Right Panel */}
                <div className="flex-1 flex flex-col bg-surface overflow-hidden">
                    <button
                        onClick={() => setVisibility(false)}
                        className="absolute right-6 top-6 z-20 w-10 h-10 bg-surface-muted hover:bg-danger hover:text-primary-foreground rounded-full flex items-center justify-center transition-all"
                    >
                        <i className="ri-close-line text-xl"></i>
                    </button>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-10 custom-scrollbar">

                        {/* Section: Employment / Basic Info */}
                        <section className="space-y-6">
                            <SectionHeader title={isUpdate ? 'Employment Record' : 'Basic Personal Information'} />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="relative">
                                    <label className="block text-[10px] font-black text-ink-subtle uppercase mb-2 ml-1">Reg ID</label>
                                    <input
                                        name="memberId"
                                        value={formData.memberId}
                                        onChange={handleChange}
                                        readOnly={!isRollEditable}
                                        className={`w-full bg-surface-muted border-2 rounded-2xl px-4 py-3 font-bold ${isRollEditable ? 'border-edge-brand' : 'border-transparent text-ink-subtle'}`}
                                    />
                                    <button type="button" onClick={() => setIsRollEditable(!isRollEditable)} className="absolute right-3 top-9 text-ink-subtle">
                                        <i className={isRollEditable ? 'ri-lock-unlock-line' : 'ri-lock-line'}></i>
                                    </button>
                                </div>
                                <CustomInput autoFocus label="Full Name" name="name" value={formData.name} onChange={handleChange} required icon="ri-user-line" />
                                <CustomInput label="Father Name" name="fatherName" value={formData.fatherName} onChange={handleChange} icon="ri-parent-line" />
                                <CustomInput type="number" label="Phone No" name="phone" value={formData.phone} onChange={handleChange} required icon="ri-phone-line" />
                                <CustomInput label="Hiring Date" name="hiringDate" type="date" value={formData.hiringDate} onChange={handleChange} icon="ri-calendar-line" />
                                <CustomSelect
                                    label="Designation"
                                    name="post"
                                    value={formData.post}
                                    onChange={handleChange}
                                    options={[{ v: 'member', n: 'Member' }, { v: 'intern', n: 'Intern' }]}
                                    opLabel="n"
                                    opValue="v"
                                />
                            </div>
                        </section>

                        {/* Section: Class Assignments (Update only) */}
                        {/* {isUpdate && formData.post === 'member' && (
                            <section className="space-y-4">
                                <SectionHeader title="Class Assignments" />
                                <div className="flex flex-wrap gap-2">
                                    {allClassesData?.map((cls) => (
                                        <button
                                            key={cls._id}
                                            type="button"
                                            onClick={() => {
                                                const exists = formData.givenClasses.includes(cls._id);
                                                setFormData(p => ({
                                                    ...p,
                                                    givenClasses: exists
                                                        ? p.givenClasses.filter(id => id !== cls._id)
                                                        : [...p.givenClasses, cls._id],
                                                }));
                                            }}
                                            className={`px-4 py-2 rounded-xl text-[12px] font-black uppercase transition-all border-2 ${formData.givenClasses.includes(cls._id) ? 'bg-inverse border-inverse text-primary-foreground' : 'bg-surface border-edge text-ink-subtle'}`}
                                        >
                                            {cls.className}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )} */}

                        {/* Section: Partner Toggle */}
                        {formData.post === 'member' && (
                            <div className="flex flex-wrap gap-6 p-6 bg-surface-muted rounded-[2rem] border border-edge">
                                <div className="flex items-center gap-4 py-3 px-5 bg-surface rounded-2xl shadow-sm border border-edge min-w-[200px] justify-between">
                                    <span className="text-[10px] font-black text-ink-muted uppercase tracking-widest">
                                        {isUpdate ? 'Business Partner' : 'Class Partner'}
                                    </span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="isPartner"
                                            className="sr-only peer"
                                            checked={formData.isPartner}
                                            onChange={() => setFormData(prev => ({ ...prev, isPartner: !prev.isPartner, partnerType: '' }))}
                                        />
                                        <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                    </label>
                                </div>
                            </div>
                        )}


                        <div className="flex flex-wrap gap-6 p-6 bg-surface-muted rounded-[2rem] border border-edge">
                            <div className="flex items-center gap-4 py-3 px-5 bg-surface rounded-2xl shadow-sm border border-edge min-w-[200px] justify-between">
                                <span className="text-[10px] font-black text-ink-muted uppercase tracking-widest">
                                    Is Active
                                </span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        className="sr-only peer"
                                        checked={formData.isActive}
                                        onChange={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                    />
                                    <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>
                        </div>









                        {/* Advanced Fields Toggle */}
                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                                className="px-6 py-2 bg-inverse text-primary-foreground rounded-full text-[12px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary transition-colors"
                            >
                                {showAdvancedFields ? 'Hide Extra Details' : 'Show Extra Details (Bank, Education, CNIC)'}
                                <i className={showAdvancedFields ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}></i>
                            </button>
                        </div>

                        {showAdvancedFields && (
                            <div className="space-y-8 app-enter">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <CustomInput type="number" label="CNIC Number" name="cnicNo" value={formData.cnicNo} minLength={0} maxLength={13} onChange={handleChange} icon="ri-id-card-line" />
                                    <CustomInput label="Highest Education" name="education" value={formData.education} onChange={handleChange} icon="ri-graduation-cap-line" />
                                    <CustomInput label="Bank Name" name="bankName" value={formData.bankName} onChange={handleChange} icon="ri-bank-line" />
                                    <CustomInput type="number" label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} icon="ri-numbers-line" />
                                    <CustomInput type="email" label="Official Email" name="email" value={formData.email} onChange={handleChange} icon="ri-mail-line" />
                                    <CustomInput type="text" label="Home Address" name="address" value={formData.address} onChange={handleChange} icon="ri-map-pin-line" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <DynamicTagInput label="Languages" category="language" list={formData.languages} value={tempInputs.language} onChange={(v) => setTempInputs({ ...tempInputs, language: v })} onAdd={() => addTag('language', 'languages')} onRemove={(i) => removeTag('languages', i)} />
                                    <DynamicTagInput label="Skills" category="skill" list={formData.skills} value={tempInputs.skill} onChange={(v) => setTempInputs({ ...tempInputs, skill: v })} onAdd={() => addTag('skill', 'skills')} onRemove={(i) => removeTag('skills', i)} />
                                    <DynamicTagInput label="Experiences" category="experience" list={formData.experiences} value={tempInputs.experience} onChange={(v) => setTempInputs({ ...tempInputs, experience: v })} onAdd={() => addTag('experience', 'experiences')} onRemove={(i) => removeTag('experiences', i)} />
                                    <DynamicTagInput label="Degrees" category="degree" list={formData.educationDegrees} value={tempInputs.degree} onChange={(v) => setTempInputs({ ...tempInputs, degree: v })} onAdd={() => addTag('degree', 'educationDegrees')} onRemove={(i) => removeTag('educationDegrees', i)} />
                                </div>

                                <div className="w-full">
                                    <label className="block text-[10px] font-black text-ink-subtle uppercase mb-2 ml-1">
                                        {isUpdate ? 'Update Notes' : 'Notes'}
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        className="w-full bg-surface border-2 border-edge rounded-2xl p-4 outline-none focus:border-edge-brand font-bold text-ink min-h-[100px]"
                                        placeholder="Update member history..."
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-5 bg-primary hover:bg-inverse text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <i className={`text-xl ${isUpdate ? 'ri-save-3-fill' : 'ri-user-add-line'}`}></i>
                            {isUpdate ? 'Update Faculty Records' : 'Verify & Register Faculty'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// ── Atomic Helper Components ──────────────────────────────────────────────────

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
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd())}
                className="flex-1 bg-surface border-2 border-edge rounded-xl px-4 py-2 text-[11px] font-bold outline-none"
                placeholder={`Add ${label}...`}
            />
            <button type="button" onClick={onAdd} className="w-9 h-9 bg-inverse text-primary-foreground rounded-xl flex items-center justify-center hover:bg-primary transition-all">
                <i className="ri-add-line"></i>
            </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
            {list?.map((item, i) => (
                <span key={i} className="px-2 py-1 bg-surface border border-edge text-ink rounded-lg text-[11px] font-bold flex items-center gap-2">
                    {item} <i className="ri-close-line cursor-pointer text-danger" onClick={() => onRemove(i)}></i>
                </span>
            ))}
        </div>
    </div>
);

export default MemberCrudModel;