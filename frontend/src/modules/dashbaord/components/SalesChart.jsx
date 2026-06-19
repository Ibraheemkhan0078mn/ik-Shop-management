import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

export default function SalesChart({
    dailySales = {},
    title = "Sales",
    theme = "other",
}) {
    const language = useSelector((state) => state.auth?.language || "en");

    const [timeRange, setTimeRange] = useState("today");

    const rangeMap = {
        today: "today",
        "3day": "threeDays",
        "7day": "sevenDays",
        "30day": "thirtyDays",
        "1year": "oneYear",
    };

    const timeRanges = ["today", "3day", "7day", "30day", "1year"];

    const formatRangeLabel = (range) => {
        const labels = {
            today: { en: "Today", ur: "آج" },
            "3day": { en: "3 Days", ur: "3 دن" },
            "7day": { en: "7 Days", ur: "7 دن" },
            "30day": { en: "30 Days", ur: "30 دن" },
            "1year": { en: "1 Year", ur: "1 سال" },
        };
        return labels[range][language];
    };

    const chartData = dailySales[rangeMap[timeRange]] || [];

    // THEME COLORS FOR CHART + BUTTONS
    const themeColors = {
        gym: {
            stroke: "#22c55e",
            gradientFrom: "#22c55e",
            gradientTo: "#a7f3d0",
            activeBtn: "bg-(--accent-2) text-white border-(--accent-2)",
            idleBtn:
                "bg-(--accent-2)/12 text-(--accent-2) border-(--accent-2)/30 hover:bg-(--accent-2)/18",
        },
        hostel: {
            stroke: "#f97316",
            gradientFrom: "#f97316",
            gradientTo: "#fed7aa",
            activeBtn: "bg-(--accent) text-white border-[color:var(--accent)]",
            idleBtn:
                "bg-(--accent)/10 text-(--accent) border-(--accent)/30 hover:bg-(--accent)/15",
        },
        other: {
            stroke: "#2563eb",
            gradientFrom: "#2563eb",
            gradientTo: "#bfdbfe",
            activeBtn: "bg-(--accent-2) text-white border-(--accent-2)",
            idleBtn:
                "bg-(--surface-muted) dark:bg-(--surface) text-(--ink) dark:text-(--muted) border-(--border) hover:bg-(--surface-muted)",
        },
    };

    const colors = themeColors[theme] || themeColors.other;

    return (
        <div className="w-full bg-(--surface) dark:bg-(--surface) rounded-xl shadow-md p-6 border border-[#ffffff]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#6b4e16] dark:text-(--ink)">
                    {language === "en" ? title : "فروخت کا گراف"}
                </h2>

                {/* THEME BASED BUTTONS */}
                <div className="flex gap-2 mt-3 sm:mt-0 flex-wrap">
                    {timeRanges.map((range) => {
                        const isActive = timeRange === range;
                        return (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`
                  px-5 py-2 text-sm font-semibold rounded-full border transition-all duration-300 
                  ${
                      isActive
                          ? `${colors.activeBtn} shadow-md scale-[1.05]`
                          : `${colors.idleBtn} shadow-sm`
                  }
                `}
                            >
                                {formatRangeLabel(range)}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Area Chart */}
            <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient
                                id="fillSales"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor={colors.gradientFrom}
                                    stopOpacity={0.7}
                                />
                                <stop
                                    offset="95%"
                                    stopColor={colors.gradientTo}
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

                        <XAxis
                            dataKey="date"
                            tickFormatter={(value) =>
                                new Date(value).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })
                            }
                            tick={{ fontSize: 12, fill: "#6b7280" }}
                            tickMargin={8}
                            axisLine={false}
                        />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: "white",
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                            }}
                            labelFormatter={(value) =>
                                new Date(value).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })
                            }
                            formatter={(value) => [`Rs. ${value}`, "Sales"]}
                        />

                        <Area
                            type="monotone"
                            dataKey="sales"
                            stroke={colors.stroke}
                            strokeWidth={2}
                            fill="url(#fillSales)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
