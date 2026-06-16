import React, { useContext, useEffect } from 'react'

const AdminSideMemberFilteration = ({ setMemberFilterationPanelVisibility, memberFilterationPanelVisibility }) => {





























    return (
     




        // {/* MAIN CONTAINER */}
        // <div className={`fixed top-0 right-0 h-screen w-full sm:w-[420px] z-[100] bg-surface border-l border-edge shadow-[-20px_0_50px_rgba(0,0,0,0.05)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${memberFilterationPanelVisibility ? "translate-x-0" : "translate-x-full"}`}>

        //     {/* HEADER SECTION */}
        //     <div className="px-6 sm:px-8 py-6 border-b border-edge flex items-center justify-between bg-surface shrink-0">
        //         <div className="space-y-1">
        //             <h3 className="text-xl font-black text-ink tracking-tight">Filters</h3>
        //             <p className="text-[10px] font-black text-ink uppercase tracking-[0.2em]">Refine Members</p>
        //         </div>
        //         <button
        //             onClick={() => setMemberFilterationPanelVisibility(prev => !prev)}
        //             className="w-10 h-10 rounded-full bg-surface-muted text-ink-subtle flex items-center justify-center hover:bg-primary-muted hover:text-primary-foreground transition-all duration-300 group"
        //         >
        //             <i className="ri-close-line text-2xl group-hover:rotate-90 transition-transform"></i>
        //         </button>
        //     </div>

        //     {/* BODY - SCROLLABLE CONTENT */}
        //     <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar bg-surface">

        //         {/* INPUTS: ID & NAME */}
        //         <div className="space-y-5">
        //             <div className="flex flex-col gap-2 group">
        //                 <label className="text-[10px] font-black text-ink-subtle uppercase tracking-widest ml-1 group-focus-within:text-ink transition-colors">Institute ID</label>
        //                 <input
        //                     className="w-full bg-surface-muted border-2 border-transparent rounded-2xl py-3 px-5 outline-none transition-all duration-300 font-bold text-ink focus:border-edge-brand/20 focus:bg-surface focus:ring-4 focus:ring-primary/5 placeholder:font-normal"
        //                     type="text"
        //                     value={MemberFilterationObjContextState.memberInstituteId}
        //                     onChange={(e) => setMemberFilterationObjContextState({ ...MemberFilterationObjContextState, memberInstituteId: e.target.value })}
        //                     placeholder="Search ID..."
        //                 />
        //             </div>

        //             <div className="flex flex-col gap-2 group">
        //                 <label className="text-[10px] font-black text-ink-subtle uppercase tracking-widest ml-1 group-focus-within:text-ink transition-colors">Member Name</label>
        //                 <input
        //                     className="w-full bg-surface-muted border-2 border-transparent rounded-2xl py-3 px-5 outline-none transition-all duration-300 font-bold text-ink focus:border-edge-brand/20 focus:bg-surface focus:ring-4 focus:ring-primary/5 placeholder:font-normal"
        //                     type="text"
        //                     value={MemberFilterationObjContextState.memberName}
        //                     onChange={(e) => setMemberFilterationObjContextState({ ...MemberFilterationObjContextState, memberName: e.target.value })}
        //                     placeholder="Search Name..."
        //                 />
        //             </div>
        //         </div>

        //         {/* MEMBER POST CHIPS — commented out in original, kept commented but styled if you re-enable */}
        //         {/* 
        // <div className="space-y-3">
        //     <label className="text-[10px] font-black text-ink-subtle uppercase tracking-widest ml-1">Member Post</label>
        //     <div className="flex flex-wrap gap-2">
        //         {[
        //             { label: 'All', value: '' },
        //             { label: 'Member', value: 'member' },
        //             { label: 'Intern', value: 'intern' },
        //         ].map((item) => (
        //             <button
        //                 key={item.value}
        //                 onClick={() => setMemberFilterationObjContextState({ ...MemberFilterationObjContextState, post: item.value })}
        //                 className={`px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all duration-300 border-2 
        //                 ${MemberFilterationObjContextState.post === item.value
        //                     ? "bg-primary-muted border-edge-brand text-primary-foreground shadow-md shadow-sm"
        //                     : "bg-surface border-edge text-ink-subtle hover:border-edge-brand hover:text-ink"}`}
        //             >
        //                 {item.label}
        //             </button>
        //         ))}
        //     </div>
        // </div>
        // */}
        //         {/* MAIN CONTAINER */}
        //         <div className={`fixed top-0 right-0 h-screen w-full sm:w-[420px] z-[100] bg-surface border-l border-edge shadow-[-20px_0_50px_rgba(0,0,0,0.05)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${memberFilterationPanelVisibility ? "translate-x-0" : "translate-x-full"}`}>

        //             {/* HEADER SECTION */}
        //             <div className="px-6 sm:px-8 py-6 border-b border-edge flex items-center justify-between bg-surface shrink-0">
        //                 <div className="space-y-1">
        //                     <h3 className="text-xl font-black text-ink tracking-tight">Filters</h3>
        //                     <p className="text-[10px] font-black text-ink uppercase tracking-[0.2em]">Refine Members</p>
        //                 </div>
        //                 <button
        //                     onClick={() => setMemberFilterationPanelVisibility(prev => !prev)}
        //                     className="w-10 h-10 rounded-full bg-surface-muted text-ink-subtle flex items-center justify-center hover:bg-primary-muted hover:text-primary-foreground transition-all duration-300 group"
        //                 >
        //                     <i className="ri-close-line text-2xl group-hover:rotate-90 transition-transform"></i>
        //                 </button>
        //             </div>

        //             {/* BODY - SCROLLABLE CONTENT */}
        //             <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar bg-surface">

        //                 {/* INPUTS: ID & NAME */}
        //                 <div className="space-y-5">
        //                     <div className="flex flex-col gap-2 group">
        //                         <label className="text-[10px] font-black text-ink-subtle uppercase tracking-widest ml-1 group-focus-within:text-ink transition-colors">Institute ID</label>
        //                         <input
        //                             className="w-full bg-surface-muted border-2 border-transparent rounded-2xl py-3 px-5 outline-none transition-all duration-300 font-bold text-ink focus:border-edge-brand/20 focus:bg-surface focus:ring-4 focus:ring-primary/5 placeholder:font-normal"
        //                             type="text"
        //                             value={MemberFilterationObjContextState.memberInstituteId}
        //                             onChange={(e) => setMemberFilterationObjContextState({ ...MemberFilterationObjContextState, memberInstituteId: e.target.value })}
        //                             placeholder="Search ID..."
        //                         />
        //                     </div>

        //                     <div className="flex flex-col gap-2 group">
        //                         <label className="text-[10px] font-black text-ink-subtle uppercase tracking-widest ml-1 group-focus-within:text-ink transition-colors">Member Name</label>
        //                         <input
        //                             className="w-full bg-surface-muted border-2 border-transparent rounded-2xl py-3 px-5 outline-none transition-all duration-300 font-bold text-ink focus:border-edge-brand/20 focus:bg-surface focus:ring-4 focus:ring-primary/5 placeholder:font-normal"
        //                             type="text"
        //                             value={MemberFilterationObjContextState.memberName}
        //                             onChange={(e) => setMemberFilterationObjContextState({ ...MemberFilterationObjContextState, memberName: e.target.value })}
        //                             placeholder="Search Name..."
        //                         />
        //                     </div>
        //                 </div>

        //                 {/* MEMBER POST CHIPS — commented out in original, kept commented but styled if you re-enable */}
        //                 {/* 
        // <div className="space-y-3">
        //     <label className="text-[10px] font-black text-ink-subtle uppercase tracking-widest ml-1">Member Post</label>
        //     <div className="flex flex-wrap gap-2">
        //         {[
        //             { label: 'All', value: '' },
        //             { label: 'Member', value: 'member' },
        //             { label: 'Intern', value: 'intern' },
        //         ].map((item) => (
        //             <button
        //                 key={item.value}
        //                 onClick={() => setMemberFilterationObjContextState({ ...MemberFilterationObjContextState, post: item.value })}
        //                 className={`px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all duration-300 border-2 
        //                 ${MemberFilterationObjContextState.post === item.value
        //                     ? "bg-primary-muted border-edge-brand text-primary-foreground shadow-md shadow-sm"
        //                     : "bg-surface border-edge text-ink-subtle hover:border-edge-brand hover:text-ink"}`}
        //             >
        //                 {item.label}
        //             </button>
        //         ))}
        //     </div>
        // </div>
        // */}

        //             </div>

        //             {/* FOOTER */}
        //             <div className="p-6 sm:p-8 border-t border-edge bg-surface-muted shrink-0">
        //                 <button
        //                     onClick={handleRemoveAllMemberFilterFunction}
        //                     className="w-full py-4 bg-surface border-2 border-edge text-ink-muted rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 hover:bg-danger-muted hover:border-danger hover:text-danger active:scale-[0.98] flex items-center justify-center gap-3 shadow-sm"
        //                 >
        //                     <i className="ri-restart-line text-lg"></i>
        //                     Reset Filtration
        //                 </button>
        //             </div>

        //         </div>
        //     </div>
        // </div>

        <>+</>
    )

}

export default AdminSideMemberFilteration


