import React, { useState } from 'react';
import { PermissionGuard } from '../../../common/components/PermissionGaurd';
import NonActiveClassPartnershipRecords from './NonActiveClassPartnershipRecords';
import ClassPartnershipCrudModal from './ClassPartnershipCrudModel';
import ClassPartnershipListingUnifiedComp from './ClassPartnershipListingUnifiedComp';

const ClassPartnership = ({ memberId }) => {

    const [nonActiveClassPartnershipRecordVisibility, setNonActiveClassPartnershipRecordVisibility] = useState(false)
    const [classPartnershipCreaionVisibility, setclassPartnershipCreaionVisibility] = useState(false)















    return (
        <div className="p-2 space-y-6 app-enter slide-in-from-bottom-2 duration-700">

            {classPartnershipCreaionVisibility && <ClassPartnershipCrudModal operation="create" partnerId={memberId} setVisibility={setclassPartnershipCreaionVisibility} />}
            {nonActiveClassPartnershipRecordVisibility && <NonActiveClassPartnershipRecords memberId={memberId} setVisibility={setNonActiveClassPartnershipRecordVisibility} />}




            {/* HEADER SECTION */}
            <div className="flex items-center justify-between gap-2 bg-surface p-5 rounded-[1.5rem] border border-edge/60 shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-ink tracking-tight">Class Partnerships</h2>
                    <p className="text-[10px] text-ink-subtle font-bold uppercase tracking-widest">Manage academic profit sharing</p>
                </div>
                <div className="flex gap-2">
                    <PermissionGuard permission={"member-class-partnership-create"}>
                        <button
                            onClick={() => setclassPartnershipCreaionVisibility(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary text-primary-foreground rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-lg shadow-sm/20 active:scale-95">
                            <i className="ri-add-line"></i>
                            New Partnership
                        </button>
                    </PermissionGuard>
                    <button
                        onClick={() => setNonActiveClassPartnershipRecordVisibility(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary text-primary-foreground rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-lg shadow-sm/20 active:scale-95">
                        <i className="ri-add-line"></i>
                        Non Active Partnership
                    </button>
                </div>
            </div>

            {/* DATA LIST (FLEX TABLE) */}
            <div className="space-y-3">




                <ClassPartnershipListingUnifiedComp memberId={memberId} mode={"active"} />


            </div>
        </div>
        // </div>
    );
};

export default ClassPartnership;