import { useState } from "react";
import { StickyNote, List, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const App = () => {
    const [language, setLanguage] = useState("en"); // 'en' or 'ur'

    // Summary Stats Data
    const stats = [
        {
            title: "Total Sales",
            value: "$124,500",
        },
        {
            title: "Total Orders",
            value: "1,240",
        },
        {
            title: "Returns",
            value: "$1,200",
        },
        {
            title: "Net Profit",
            value: "$45,200",
        },
    ];

    const salesReportItems = [
        {
            key: "sales-summary",
            module: "sales",
            title: {
                en: "Sales Summary",
                ur: "سیلز کا خلاصہ",
            },
            description: "Overview of all sales with totals and statistics",
        },
        {
            key: "sales-by-category",
            module: "sales",
            title: {
                en: "Sales by Category",
                ur: "زمرہ کے لحاظ سے سیلز",
            },
            description: "Sales breakdown by product category",
        },
        {
            key: "sales-by-customer",
            module: "sales",
            title: {
                en: "Sales by Customer",
                ur: "گاہک کے لحاظ سے سیلز",
            },
            description: "Sales breakdown by customer",
        },
    ];

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
                        className="bg-(--surface) p-6 rounded-3xl border border-(--border) shadow-[0_14px_30px_rgba(64,45,28,0.10)]"
                    >
                        <h3 className="text-(--muted) text-sm font-medium">
                            {stat.title}
                        </h3>
                        <p className="text-2xl font-bold text-(--ink) mt-1">
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Reports Grid Section */}
            <div className="max-w-7xl mx-auto">
                <h2 className="text-lg font-semibold text-(--ink) font-display mb-6 px-1">
                    {language === "en" ? "Sales Reports" : "سیلز رپورٹس"}
                </h2>

                <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
                    {salesReportItems.map((item) => (
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
                                        <div className="wrap-break-word">
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
