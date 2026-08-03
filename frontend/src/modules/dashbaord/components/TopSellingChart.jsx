import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

export default function TopSellingChart({ topSelling = {} }) {
    const language = useSelector((state) => state.auth?.language || "en");

    // Filters: today, 3 Days, 7 Days, 30 Days
    const filters = ["today", "threeDays", "sevenDays", "thirtyDays"];
    const [activeFilter, setActiveFilter] = useState("sevenDays");

    // Check which filter has data by default
    useEffect(() => {
        for (let f of filters) {
            if (topSelling[f]?.length > 0) {
                setActiveFilter(f);
                break;
            }
        }
    }, [topSelling]);

    const handleFilterClick = (filter) => setActiveFilter(filter);

    const items = topSelling[activeFilter] || [];

    const chartData = items.map((it) => ({
        item: it.name || "Unknown",
        qty: Number(it.soldQty ?? 0),
    }));

    return (
        <div className="w-full bg-(--surface) dark:bg-(--surface) rounded-xl shadow-md p-6 border border-[#f5f3ee]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#6b4e16] dark:text-(--ink) mb-2 sm:mb-0">
                    {language === "en"
                        ? "Top Selling Products"
                        : "ٹاپ بیچنے والی مصنوعات"}
                </h2>

                {/* Filter Buttons */}
                <div className="flex gap-2 flex-wrap">
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => handleFilterClick(filter)}
                            className={`  px-5 py-2 text-sm font-semibold rounded-full border transition-all duration-300 ${
                                activeFilter === filter
                                    ? "bg-(--accent-2) text-white"
                                    : "bg-(--surface-muted) dark:bg-(--surface) text-(--ink) dark:text-(--muted) border-(--border) hover:bg-(--surface-muted)"
                            }`}
                        >
                            {language === "en"
                                ? filter === "threeDays"
                                    ? "3 Days"
                                    : filter === "sevenDays"
                                      ? "7 Days"
                                      : filter === "thirtyDays"
                                        ? "30 Days"
                                        : "Today"
                                : filter === "threeDays"
                                  ? "3 دن"
                                  : filter === "sevenDays"
                                    ? "7 دن"
                                    : filter === "thirtyDays"
                                      ? "30 دن"
                                      : "آج"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="w-full h-[300px] mt-4">
                {chartData.length === 0 ? (
                    <div className="text-center text-(--muted) mt-10">
                        {language === "en"
                            ? "No sales data available"
                            : "کوئی فروخت کا ڈیٹا دستیاب نہیں"}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{
                                top: 20,
                                right: 20,
                                left: 40,
                                bottom: 20,
                            }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e5e7eb"
                            />
                            <XAxis
                                type="number"
                                tick={{ fontSize: 12, fill: "#6b7280" }}
                                axisLine={false}
                            />
                            <YAxis
                                type="category"
                                dataKey="item"
                                tick={{ fontSize: 12, fill: "#6b7280" }}
                                axisLine={false}
                                tickMargin={8}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "white",
                                    borderRadius: "8px",
                                    border: "1px solid #e5e7eb",
                                }}
                                formatter={(value) => [value, "Sold Qty"]}
                            />
                            <Bar
                                dataKey="qty"
                                fill="#2563eb"
                                radius={[6, 6, 6, 6]}
                                barSize={20}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
