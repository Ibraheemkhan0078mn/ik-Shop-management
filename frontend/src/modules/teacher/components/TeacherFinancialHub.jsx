






























import React, { useState } from 'react';
import TeacherSalaryPaymentCreationComp from './TeacherSalaryPaymentCreationComp';
import TeacherInvoicesAndFeeDeposits from './TeacherInvoicesAndFeeDeposits';
import { useRecalculateTeacherFinancials } from '../api/teacherFinance.api';
import { PermissionGuard } from '@shared/components/PermissionGuard';

const TeacherFinancialHub = ({ teacherId, responseData, onAction }) => {
    let { mutateAsync: teacherFinancialRecalculation } = useRecalculateTeacherFinancials()

    const teacher = responseData?.teacher || {};
    const stats = responseData?.calculations || {};
    const [showAllPayments, setShowAllPayments] = useState(false);
    const [showPaymentCreate, setShowPaymentCreate] = useState(false);


    async function handleRecalculateFinancialsBtnClick() {
        await teacherFinancialRecalculation(teacherId)
    }





    return (
        <div className="w-full h-full min-h-[500px] flex flex-col gap-5 font-sans antialiased text-slate-900">



            {showAllPayments && <TeacherInvoicesAndFeeDeposits teacherId={teacherId} setVisibility={setShowAllPayments} responseData={responseData} />}
            {showPaymentCreate && <TeacherSalaryPaymentCreationComp teacherId={teacherId} setVisible={setShowPaymentCreate} />}



            {/* Main Wallet Card */}
            <div className="bg-gradient-to-br from-cyan-500 via-cyan-600 to-cyan-700 rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-cyan-200/50">
                {/* Decorative Elements */}
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>

                {/* Content */}
                <div className="relative z-10">
                    {/* Header Label */}
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-2 h-2 rounded-full bg-cyan-200 animate-pulse"></div>
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-100">Available Balance</span>
                    </div>

                    {/* Main Amount */}
                    <div className="mb-8">
                        <div className="flex items-baseline gap-3">
                            <span className="text-lg font-medium text-cyan-200">PKR</span>
                            <h1 className="text-6xl md:text-7xl font-black text-white tracking-tight">
                                {stats?.totalRemainingAmount?.toLocaleString()}
                            </h1>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-white/20">
                        <div className="flex gap-8">
                            <div>
                                <p className="text-xs font-semibold text-cyan-200 uppercase tracking-wide mb-1">Paid</p>
                                <p className="text-2xl font-black text-white">PKR {stats?.totalPaidAmount?.toLocaleString()}</p>
                            </div>
                            <div className="border-l border-white/20 pl-8">
                                <p className="text-xs font-semibold text-cyan-200 uppercase tracking-wide mb-">Advance</p>
                                <p className="text-2xl font-black text-white">PKR {stats?.advancedBalance?.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="flex gap-5">
                            <PermissionGuard permission={"teacher-payment-create"}>
                                <button
                                    onClick={() => setShowPaymentCreate(true)}
                                    className="px-8 py-3.5 bg-white text-cyan-600 rounded-2xl font-bold text-sm uppercase tracking-wide transition-all hover:bg-cyan-50 hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2.5"
                                >
                                    <i className="ri-flashlight-fill text-lg"></i>
                                    Give Payment
                                </button>
                            </PermissionGuard>


                            {/* Sync Button Card */}
                            <PermissionGuard permission={"teacher-payment-recalculate"}>
                                <div
                                    onClick={() => { handleRecalculateFinancialsBtnClick() }}
                                >
                                    <button
                                        className="px-8 py-3.5 bg-white text-cyan-600 rounded-2xl font-bold text-sm uppercase tracking-wide transition-all hover:bg-cyan-50 hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2.5"
                                    >
                                        <i className="ri-flashlight-fill text-lg"></i>
                                        Recalculate Finance
                                    </button>
                                </div>
                            </PermissionGuard>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                {/* Base Salary Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-cyan-300 transition-all shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                            <i className="ri-bank-card-2-line text-xl"></i>
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Monthly</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Base Salary</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-slate-400">PKR</span>
                        <p className="text-3xl font-black text-slate-800">{teacher?.salary?.toLocaleString()}</p>
                    </div>
                </div>

                {/* Absence Cut Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-rose-300 transition-all shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <i className="ri-scissors-2-line text-xl"></i>
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Per Day</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Absence Cut</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-slate-400">PKR</span>
                        <p className="text-3xl font-black text-slate-800">{teacher?.perAttendenceCut?.toLocaleString()}</p>
                    </div>
                </div>

                {/* Sync Button Card */}
                {/* <PermissionGuard permission={"teacher-payment-recalculate"}>
                    <div
                        onClick={() => { handleRecalculateFinancialsBtnClick() }}
                        className="bg-white active:scale-95 rounded-2xl p-6 border-2 border-dashed border-slate-200 hover:border-cyan-300 transition-all shadow-sm flex items-center justify-center">
                        <button

                            className="flex flex-col items-center gap-3 group w-full "
                        >
                            <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center transition-all group-hover:bg-cyan-600 group-hover:text-white group-hover:rotate-180 duration-500">
                                <i className="ri-refresh-line text-2xl"></i>
                            </div>
                            <span className="text-sm font-bold text-slate-600 uppercase tracking-wide group-hover:text-cyan-600 transition-colors">Recalculate Account</span>
                        </button>
                    </div>
                </PermissionGuard> */}

            </div>

            {/* Teacher Info & Actions Bar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row items-center justify-between gap-5">

                    {/* Teacher Info */}
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200 flex items-center justify-center text-cyan-600">
                            <i className="ri-fingerprint-line text-2xl"></i>
                        </div>
                        <div>
                            <h4 className="text-base font-black text-slate-800">{teacher?.name || "Active Partner"}</h4>
                            <p className="text-xs font-semibold text-cyan-600 uppercase tracking-wide">ID: {teacher?.id || 'AUTH-00'}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <PermissionGuard permission={"teacher-payment-view"}>
                            <button
                                onClick={() => { setShowAllPayments(true) }}
                                className="px-6 py-3 rounded-xl text-sm font-bold text-cyan-600 hover:text-cyan-600  bg-cyan-100 cursor-pointer border-4 shadow-md hover:scale-105 active:scale-95 border-slate-100 transition-all flex items-center gap-2"
                            >
                                <i className="ri-pulse-line text-base"></i>
                                Full Analysis
                            </button>
                        </PermissionGuard>

                        <div className="w-px h-8 bg-slate-200"></div>

                        {/* <button
                            className="px-6 py-3 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-all flex items-center gap-2"
                        >
                            <i className="ri-download-2-line text-base"></i>
                            Download PDF
                        </button> */}

                        <div className="flex items-center gap-2 ml-3 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-xs font-bold text-emerald-600 uppercase">Live</span>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
};

export default TeacherFinancialHub;