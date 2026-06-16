
import React from "react";
import { X, BadgeX } from "lucide-react";
;
import ClassPartnershipListingUnifiedComp from "./ClassPartnershipListingUnifiedComp";

const NonActiveClassPartnershipRecords = ({ setVisibility, memberId }) => {






  return (



    <div className="fixed inset-0 z-50 app-backdrop bg-black/30 flex justify-center items-center p-4">
      <div className="w-full max-w-lg bg-surface rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-danger bg-danger-muted/60">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
            <BadgeX size={18} className="text-danger" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-ink leading-tight">Non-Active Class Partnerships</h2>
            <p className="text-[11px] text-rose-400 font-medium mt-0.5">
              record outside active date range
            </p>
          </div>
          <button
            onClick={() => setVisibility(false)}
            className="p-1.5 rounded-lg text-rose-300 hover:text-danger hover:bg-rose-100 transition-all"
          >
            <X size={17} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[70vh]">
          <ClassPartnershipListingUnifiedComp memberId={memberId} mode={"nonActive"} />
        </div>

      </div>
    </div>
  );
};

export default NonActiveClassPartnershipRecords;