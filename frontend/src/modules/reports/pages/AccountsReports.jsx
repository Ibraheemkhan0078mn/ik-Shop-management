import React, { useState } from "react";
import {
    StickyNote,
    List,
    Wallet,
    TrendingUp,
    Scale,
    Receipt,
    ChevronRight,
    PieChart,
    History,
    Ban,
    DollarSign,
    Landmark,
    FileSpreadsheet,
    ArrowRightLeft,
} from "lucide-react";
import { FINANCE_REGISTRY } from "./Registry";
import { Link } from "react-router-dom";

const App = () => {
    const [language, setLanguage] = useState("en"); // 'en' or 'ur'

    // Financial Summary Stats Data
    const stats = [
        {
            title: language === "en" ? "Total Revenue" : "کل آمدنی",
            value: "$412,000",
        },
        {
            title: language === "en" ? "Total Expenses" : "کل اخراجات",
            value: "$215,400",
        },
        {
            title: language === "en" ? "Net Profit" : "خالص منافع",
            value: "$196,600",
        },
        {
            title: language === "en" ? "Cash on Hand" : "نقدی رقم",
            value: "$84,200",
        },
    ];

    // Financial Report Categories (Profit & Loss removed as per user request)
    const financeReportItems = Object.values(FINANCE_REGISTRY);

    return (
        <div
            className={`min-h-screen bg-(--surface) p-6 rounded-3xl border border-(--border) shadow-[0_18px_50px_rgba(64,45,28,0.12)] ${language === "ur" ? "rtl" : "ltr"}`}
            dir={language === "ur" ? "rtl" : "ltr"}
        >
            {/* Summary Stats Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {stats.map((stat, idx) => (
                    <div
                        key={idx}
                        className="bg-(--surface) p-6 rounded-3xl border border-(--border) shadow-[0_14px_30px_rgba(64,45,28,0.10)] flex items-center gap-4"
                    >
                        <div>
                            <h3 className="text-(--muted) text-sm font-medium">
                                {stat.title}
                            </h3>
                            <p className="text-2xl font-bold text-(--ink) mt-0.5">
                                {stat.value}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reports Grid Section */}
            <div className="max-w-7xl mx-auto">
                <h2 className="text-lg font-semibold text-(--ink) font-display mb-6 px-1">
                    {language === "en"
                        ? "Accounting & Audit Reports"
                        : "اکاؤنٹنگ اور آڈٹ رپورٹس"}
                </h2>

                <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
                    {financeReportItems.map((item) => (
                        <div
                            key={item.key}
                            className="bg-(--surface) border border-(--border) rounded-3xl shadow-[0_14px_30px_rgba(64,45,28,0.10)] p-4 flex flex-col hover:shadow-[0_18px_40px_rgba(64,45,28,0.16)] transition w-full sm:w-[300px] md:w-[320px]"
                        >
                            {/* Title */}
                            <h2
                                className={`text-lg font-semibold text-(--ink) font-display wrap-break-word ${!item.description ? "mb-0" : "mb-2"} capitalize`}
                            >
                                {item.title.en}
                            </h2>

                            {/* Info */}
                            {item?.description && (
                                <div className="space-y-1 text-xs text-(--muted) flex-1">
                                    <div className="flex items-start gap-2">
                                        <StickyNote className="w-3.5 h-3.5 text-(--muted) mt-0.5" />
                                        <div className="wrap-break-word leading-relaxed">
                                            <span className="font-medium text-(--ink)">
                                                {language === "en"
                                                    ? "Notes:"
                                                    : "نوٹس:"}
                                            </span>{" "}
                                            {item.description || "-"}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action */}
                            <Link
                                to={`/reports/${item.module}/details?reportKey=${item.key}`}
                                className="mt-4 text-sm text-(--muted) font-medium hover:text-(--accent-2) flex items-center justify-between border-t border-(--border) pt-3 group cursor-pointer transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <List className="w-4 h-4 text-(--muted) group-hover:text-(--accent-2)" />
                                    {language === "en"
                                        ? "View Report"
                                        : "رپورٹ دیکھیں"}
                                </div>
                                <ChevronRight
                                    className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${language === "ur" ? "rotate-180 group-hover:-translate-x-1" : ""}`}
                                />
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default App;
