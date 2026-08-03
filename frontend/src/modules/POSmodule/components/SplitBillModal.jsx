import { useState } from "react";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getPosLabels } from "../labels/posLabels.js";

// ─────────────────────────────────────────────────────────────────────────────
//  SplitBillModal
//
//  Opens when the cashier clicks "Split Bill".
//  Lets the cashier enter how many people are splitting the total.
//  PosPage then prints a slip showing each person's share.
//
//  Props:
//    onClose         — closes the modal
//    onConfirm(count) — sends the person count to PosPage
// ─────────────────────────────────────────────────────────────────────────────
export default function SplitBillModal({ onClose, onConfirm }) {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getPosLabels(language);

    const [personCount, setPersonCount] = useState(2);

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-80">

                <h3 className="text-lg font-semibold text-gray-800 mb-5">
                    {labels.splitBill}
                </h3>

                <div className="mb-5">
                    <label className="block text-sm text-gray-600 mb-1">
                        {labels.numberOfPeople}
                    </label>
                    <input
                        type="number"
                        min={2}
                        value={personCount}
                        autoFocus
                        onChange={(e) => setPersonCount(Number(e.target.value))}
                        onKeyDown={(e) => e.key === "Enter" && onConfirm(personCount)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700">
                        {labels.cancel}
                    </button>
                    <button onClick={() => onConfirm(personCount)}
                        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition">
                        {labels.printSplit}
                    </button>
                </div>
            </div>
        </div>
    );
}
