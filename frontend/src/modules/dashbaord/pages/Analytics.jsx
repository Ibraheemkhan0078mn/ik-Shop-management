import React, { useState } from "react";
import {
    TrendingUp,
    DollarSign,
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Edit2,
    Trash2,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
    CheckSquare,
} from "lucide-react";
// import { Card } from "@/components/ui/card";
import Button from "../../../shared/ui/Button.jsx";
import Input from "../../../shared/ui/Input.jsx";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
} from "recharts";

// Mock Data
const financialData = {
    totalProfit: 45680.5,
    totalLoss: 12340.25,
    netProfit: 33340.25,
    profitChange: 12.5,
    duesToReceive: 28500.0,
    duesToGive: 15200.0,
    totalIncome: 125600.0,
    totalExpense: 92259.75,
    incomeChange: 8.3,
    expenseChange: -5.2,
};

function Card({ children }) {
    return (
        <div
            data-slot="card"
            className="p-5 border bg-(--surface) border-(--border) rounded-2xl shadow-[0_14px_30px_rgba(64,45,28,0.10)]"
        >
            {children}
        </div>
    );
}

const stockAlerts = [
    {
        id: "1",
        productName: "Laptop HP ProBook 450",
        currentStock: 3,
        minStock: 10,
        severity: "critical",
    },
    {
        id: "2",
        productName: "Wireless Mouse Logitech",
        currentStock: 8,
        minStock: 15,
        severity: "warning",
    },
    {
        id: "3",
        productName: "USB-C Cable",
        currentStock: 18,
        minStock: 20,
        severity: "info",
    },
];

const expiryAlerts = [
    {
        id: "1",
        productName: "Milk - Fresh Whole",
        expiryDate: "2026-01-15",
        daysRemaining: 3,
        quantity: 45,
        severity: "critical",
    },
    {
        id: "2",
        productName: "Bread - Whole Wheat",
        expiryDate: "2026-01-18",
        daysRemaining: 6,
        quantity: 120,
        severity: "warning",
    },
    {
        id: "3",
        productName: "Yogurt - Greek Style",
        expiryDate: "2026-02-20",
        daysRemaining: 39,
        quantity: 80,
        severity: "info",
    },
];

const topSellingItems = [
    { name: "iPhone 15 Pro", units: 245, revenue: 244755 },
    { name: "Samsung Galaxy S24", units: 189, revenue: 188811 },
    { name: "MacBook Air M2", units: 156, revenue: 155844 },
    { name: "AirPods Pro", units: 432, revenue: 107568 },
    { name: "iPad Air", units: 178, revenue: 106800 },
    { name: "Sony WH-1000XM5", units: 298, revenue: 89400 },
    { name: "Dell XPS 15", units: 87, revenue: 86913 },
];

const revenueProducts = [
    { name: "iPhone 15 Pro", revenue: 244755, profit: 48951 },
    { name: "Samsung Galaxy S24", revenue: 188811, profit: 37762 },
    { name: "MacBook Air M2", revenue: 155844, profit: 31169 },
    { name: "iPad Air", revenue: 106800, profit: 21360 },
    { name: "Dell XPS 15", revenue: 86913, profit: 17383 },
    { name: "Sony WH-1000XM5", revenue: 89400, profit: 17880 },
    { name: "AirPods Pro", revenue: 107568, profit: 21514 },
    { name: "Microsoft Surface", revenue: 75240, profit: 15048 },
    { name: "Nintendo Switch", revenue: 59800, profit: 11960 },
    { name: "PlayStation 5", revenue: 49950, profit: 9990 },
];

const incomeVsExpenseData = [
    { month: "Jul", income: 98000, expense: 72000 },
    { month: "Aug", income: 105000, expense: 78000 },
    { month: "Sep", income: 112000, expense: 82000 },
    { month: "Oct", income: 118000, expense: 88000 },
    { month: "Nov", income: 122000, expense: 90000 },
    { month: "Dec", income: 125600, expense: 92260 },
];

// Component 1: Net Profit Card
function NetProfitCard({ data }) {
    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-(--accent-2) rounded-2xl shadow-[0_10px_18px_rgba(15,118,110,0.25)]">
                    <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <span className="bg-(--accent-2)/20 text-(--accent-2) flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold">
                    <ArrowUpRight className="h-3 w-3" />
                    {data.profitChange}%
                </span>
            </div>
            <h3 className="text-sm text-(--muted) mb-1 uppercase tracking-wide">
                Net Profit
            </h3>
            <p className="text-3xl mb-2 text-(--accent-2) font-display">
                ${data.netProfit.toLocaleString()}
            </p>
            <div className="text-xs text-(--muted) space-y-1">
                <div className="flex justify-between">
                    <span>Total Profit:</span>
                    <span className="text-(--accent-2) font-semibold">
                        ${data.totalProfit.toLocaleString()}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span>Total Loss:</span>
                    <span className="text-rose-600 font-semibold">
                        ${data.totalLoss.toLocaleString()}
                    </span>
                </div>
            </div>
        </Card>
    );
}

// Component 2: Dues to Receive Card
function DuesToReceiveCard({ amount }) {
    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-(--accent) rounded-2xl shadow-[0_10px_18px_rgba(180,83,9,0.25)]">
                    <ArrowDownRight className="h-6 w-6 text-white" />
                </div>
                <DollarSign className="h-5 w-5 text-(--accent)" />
            </div>
            <h3 className="text-sm text-(--muted) mb-1 uppercase tracking-wide">
                Dues to Receive
            </h3>
            <p className="text-3xl mb-2 text-(--accent) font-display">
                ${amount.toLocaleString()}
            </p>
            <p className="text-xs text-(--muted)">
                Pending receivables from customers
            </p>
        </Card>
    );
}

// Component 3: Dues to Give Card
function DuesToGiveCard({ amount }) {
    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-[#7c2d12] rounded-2xl shadow-[0_10px_18px_rgba(124,45,18,0.25)]">
                    <ArrowUpRight className="h-6 w-6 text-white" />
                </div>
                <DollarSign className="h-5 w-5 text-[#7c2d12]" />
            </div>
            <h3 className="text-sm text-(--muted) mb-1 uppercase tracking-wide">
                Dues to Give
            </h3>
            <p className="text-3xl mb-2 text-[#7c2d12] font-display">
                ${amount.toLocaleString()}
            </p>
            <p className="text-xs text-(--muted)">
                Pending payables to suppliers
            </p>
        </Card>
    );
}

// Component 5: Stock Alerts
function StockAlertsCard({ alerts }) {
    const getSeverityspan = (severity) => {
        switch (severity) {
            case "critical":
                return (
                    <span className="bg-[#b91c1c] rounded-full px-2 py-1 text-white text-xs">
                        Critical
                    </span>
                );
            case "warning":
                return (
                    <span className="bg-[#b45309] rounded-full px-2 py-1 text-white text-xs">
                        Warning
                    </span>
                );
            case "info":
                return (
                    <span className="bg-(--accent-2) rounded-full px-2 py-1 text-white text-xs">
                        Info
                    </span>
                );
            default:
                return <span>Unknown</span>;
        }
    };

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl flex items-center gap-2 font-display">
                    <AlertTriangle className="h-5 w-5 text-[#b45309]" />
                    Stock Alerts
                </h3>
                <span className="text-xs uppercase tracking-wide text-(--muted)">
                    {alerts.length} alerts
                </span>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className="p-4 rounded-2xl border border-(--border) bg-(--surface-muted)"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm text-(--ink)">
                                        {alert.productName}
                                    </span>
                                </div>
                                <div className="text-xs text-(--muted)">
                                    <span>Current: </span>
                                    <span className="font-semibold text-(--ink)">
                                        {alert.currentStock}
                                    </span>
                                    <span className="mx-2">|</span>
                                    <span>Min: </span>
                                    <span className="font-semibold text-(--ink)">
                                        {alert.minStock}
                                    </span>
                                </div>
                            </div>
                            {getSeverityspan(alert.severity)}
                        </div>
                        <div className="w-full bg-white rounded-full h-2 mt-2 border border-(--border)">
                            <div
                                className={`h-2 rounded-full ${
                                    alert.severity === "critical"
                                        ? "bg-[#b91c1c]"
                                        : alert.severity === "warning"
                                          ? "bg-[#b45309]"
                                          : "bg-(--accent-2)"
                                }`}
                                style={{
                                    width: `${(alert.currentStock / alert.minStock) * 100}%`,
                                }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

// Component 6: Expiry Alerts
function ExpiryAlertsCard({ alerts }) {
    const getSeverityspan = (severity) => {
        switch (severity) {
            case "critical":
                return (
                    <span className="bg-[#b91c1c] rounded-full px-2 py-1 text-white text-xs">
                        Critical
                    </span>
                );
            case "warning":
                return (
                    <span className="bg-[#b45309] rounded-full px-2 py-1 text-white text-xs">
                        Warning
                    </span>
                );
            case "info":
                return (
                    <span className="bg-(--accent-2) rounded-full px-2 py-1 text-white text-xs">
                        Info
                    </span>
                );
            default:
                return <span>Unknown</span>;
        }
    };

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl flex items-center gap-2 font-display">
                    <Calendar className="h-5 w-5 text-[#b91c1c]" />
                    Expiry Alerts
                </h3>
                <span className="text-xs uppercase tracking-wide text-(--muted)">
                    {alerts.length} items
                </span>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className="p-4 rounded-2xl border border-(--border) bg-(--surface-muted)"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm text-(--ink)">
                                        {alert.productName}
                                    </span>
                                </div>
                                <div className="text-xs space-y-1 text-(--muted)">
                                    <div>
                                        <span>Expires: </span>
                                        <span className="font-semibold text-(--ink)">
                                            {new Date(
                                                alert.expiryDate,
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div>
                                        <span>Days Left: </span>
                                        <span className="font-semibold text-(--ink)">
                                            {alert.daysRemaining}
                                        </span>
                                        <span className="mx-2">|</span>
                                        <span>Qty: </span>
                                        <span className="font-semibold text-(--ink)">
                                            {alert.quantity}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {getSeverityspan(alert.severity)}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

// Component 7: Income vs Expense Chart
function IncomeExpenseChart({ data }) {
    return (
        <Card>
            <h3 className="text-xl mb-4 flex items-center gap-2 font-display">
                <TrendingUp className="h-5 w-5 text-(--accent-2)" />
                Income vs Expense (Last 6 Months)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7d7c4" />
                    <XAxis dataKey="month" stroke="#7b6a5e" />
                    <YAxis stroke="#7b6a5e" />
                    <Tooltip
                        formatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="income"
                        stroke="#0f766e"
                        strokeWidth={3}
                        name="Income"
                    />
                    <Line
                        type="monotone"
                        dataKey="expense"
                        stroke="#b45309"
                        strokeWidth={3}
                        name="Expense"
                    />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
}

// Component 8: Todo List
function TodoList() {
    const [todos, setTodos] = useState([]);
    const [newTodoText, setNewTodoText] = useState("");
    const [editingTodo, setEditingTodo] = useState();
    const [editText, setEditText] = useState("");

    const addTodo = () => {
        if (newTodoText.trim()) {
            const newTodo = {
                id: Date.now().toString(),
                text: newTodoText,
                completed: false,
                createdAt: new Date().toISOString(),
            };
            setTodos([newTodo, ...todos]);
            setNewTodoText("");
        }
    };

    const toggleTodo = (id) => {
        setTodos(
            todos.map((todo) =>
                todo.id === id ? { ...todo, completed: !todo.completed } : todo,
            ),
        );
    };

    const deleteTodo = (id) => {
        setTodos(todos.filter((todo) => todo.id !== id));
    };

    const startEditing = (todo) => {
        setEditingTodo(todo.id);
        setEditText(todo.text);
    };

    const saveEdit = (id) => {
        if (editText.trim()) {
            setTodos(
                todos.map((todo) =>
                    todo.id === id ? { ...todo, text: editText } : todo,
                ),
            );
        }
        setEditingTodo(null);
        setEditText("");
    };

    const cancelEdit = () => {
        setEditingTodo(null);
        setEditText("");
    };

    return (
        <Card>
            <h3 className="text-xl mb-4 flex items-center gap-2 font-display">
                <CheckCircle2 className="h-5 w-5 text-(--accent-2)" />
                Todo List
            </h3>
            <div className="space-y-3">
                <div className="flex gap-2">
                    <Input
                        value={newTodoText}
                        onChange={(e) => setNewTodoText(e.target.value)}
                        className="py-1! bg-(--surface-muted) border border-(--border)"
                        placeholder="Add new task..."
                        onKeyDown={(e) => {
                            if (e.key === "Enter") addTodo();
                        }}
                    />
                    <Button onClick={addTodo} size="sm">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                <div className="space-y-2 max-h-[280px] overflow-y-auto">
                    {todos.length === 0 ? (
                        <p className="text-center text-(--muted) py-8 text-sm">
                            No tasks yet. Add one above!
                        </p>
                    ) : (
                        todos.map((todo) => (
                            <div
                                key={todo.id}
                                className={`p-3 rounded-lg border-2 ${
                                    todo.completed
                                        ? "bg-(--accent-2)/12 border-(--accent-2)/30"
                                        : "bg-(--surface) border-(--border)"
                                }`}
                            >
                                {editingTodo === todo.id ? (
                                    <div className="space-y-2">
                                        <Input
                                            value={editText}
                                            onChange={(e) =>
                                                setEditText(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter")
                                                    saveEdit(todo.id);
                                                if (e.key === "Escape")
                                                    cancelEdit();
                                            }}
                                            autoFocus
                                            className="text-sm"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() =>
                                                    saveEdit(todo.id)
                                                }
                                                size="sm"
                                                className="flex-1"
                                            >
                                                Save
                                            </Button>
                                            <Button
                                                onClick={cancelEdit}
                                                size="sm"
                                                variant="outline"
                                                className="flex-1"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={todo.completed}
                                            onChange={() => toggleTodo(todo.id)}
                                            className="mt-1 h-4 w-4 rounded border-(--border) text-(--accent-2) cursor-pointer"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className={`text-sm ${
                                                    todo.completed
                                                        ? "line-through text-(--muted)"
                                                        : "text-(--ink)"
                                                }`}
                                            >
                                                {todo.text}
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                onClick={() =>
                                                    startEditing(todo)
                                                }
                                                size="sm"
                                                variant="outline"
                                                className="hover:bg-(--surface-muted) hover:text-(--accent-2) transition-colors duration-300"
                                            >
                                                <Edit2 size={14} />
                                            </Button>
                                            <Button
                                                onClick={() =>
                                                    deleteTodo(todo.id)
                                                }
                                                size="sm"
                                                variant="outline"
                                                className="hover:bg-rose-100 hover:text-rose-600 transition-colors duration-300"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {todos.length > 0 && (
                    <div className="pt-3 border-t border-(--border) text-xs text-(--muted)">
                        <div className="flex justify-between">
                            <span>
                                Completed:{" "}
                                {todos.filter((t) => t.completed).length}
                            </span>
                            <span>Total: {todos.length}</span>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}

// Component 9: Top Selling Items Chart
function TopSellingItemsChart({ data }) {
    return (
        <Card>
            <h3 className="text-xl mb-4 flex items-center gap-2 font-display">
                <TrendingUp className="h-5 w-5 text-(--accent-2)" />
                Top Selling Items (by Units Sold)
            </h3>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7d7c4" />
                    <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        stroke="#7b6a5e"
                    />
                    <YAxis yAxisId="left" orientation="left" stroke="#7b6a5e" />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#7b6a5e"
                    />
                    <Tooltip />
                    <Legend />
                    <Bar
                        yAxisId="left"
                        dataKey="units"
                        fill="#0f766e"
                        name="Units Sold"
                    />
                    <Bar
                        yAxisId="right"
                        dataKey="revenue"
                        fill="#b45309"
                        name="Revenue ($)"
                    />
                </BarChart>
            </ResponsiveContainer>
        </Card>
    );
}

// Component 10: Top Revenue Products Chart
function TopRevenueProductsChart({ data }) {
    return (
        <Card>
            <h3 className="text-xl mb-4 flex items-center gap-2 font-display">
                <DollarSign className="h-5 w-5 text-(--accent)" />
                Top 10 Revenue Generating Products
            </h3>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7d7c4" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip
                        formatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#b45309" name="Revenue" />
                    <Bar dataKey="profit" fill="#0f766e" name="Profit" />
                </BarChart>
            </ResponsiveContainer>
        </Card>
    );
}

export default function Dashboard() {
    return (
        <div className="min-h-screen space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-2 grid grid-cols-1 gap-6">
                    <NetProfitCard data={financialData} />
                    <div className="grid grid-cols-2 items-center gap-6">
                        <DuesToReceiveCard
                            amount={financialData.duesToReceive}
                        />
                        <DuesToGiveCard amount={financialData.duesToGive} />
                    </div>
                </div>

                <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StockAlertsCard alerts={stockAlerts} />
                    <ExpiryAlertsCard alerts={expiryAlerts} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-(--surface) p-6 rounded-3xl border border-(--border) shadow-[0_16px_40px_rgba(64,45,28,0.12)]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-(--ink) font-display">
                            {labels.incomeVsExpense}
                        </h3>
                        <select className="text-sm border border-(--border) rounded-xl bg-(--surface-muted) px-3 py-2 text-(--ink)">
                            <option>{labels.last30Days}</option>
                            <option>{labels.last6Months}</option>
                        </select>
                    </div>
                    <div className="h-max">
                        <IncomeExpenseChart data={incomeVsExpenseData} />
                    </div>
                </div>

                <div>
                    <TodoList />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <TopSellingItemsChart data={topSellingItems} />
                <TopRevenueProductsChart data={revenueProducts} />
            </div>
        </div>
    );
}
