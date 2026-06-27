import React from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartCard from './ChartCard.jsx';
import { useGetStockLevelByCategoryQuery, useGetInventoryValueByCategoryQuery } from '../services/dashboard.service.js';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function InventoryOverviewCharts() {
  const { data: stockLevelData, isLoading: stockLevelLoading } = useGetStockLevelByCategoryQuery();
  const { data: inventoryValueData, isLoading: inventoryValueLoading } = useGetInventoryValueByCategoryQuery();

  const stockLevelChartData = stockLevelData?.map(d => ({
    name: d.name,
    stockLevel: d.stockLevel,
  })) || [];

  const inventoryValueChartData = inventoryValueData?.map(d => ({
    name: d.name,
    value: d.value,
    percentage: d.percentage,
  })) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Stock Level by Category */}
      <ChartCard
        title="Stock Level by Category"
        loading={stockLevelLoading}
        height={300}
        showFilter={false}
        emptyMessage="No stock data available"
        isEmpty={stockLevelChartData.length === 0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stockLevelChartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" stroke="var(--muted)" />
            <YAxis dataKey="name" type="category" width={100} stroke="var(--muted)" />
            <Tooltip />
            <Legend />
            <Bar dataKey="stockLevel" fill="#10b981" name="Stock Level" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Inventory Value by Category */}
      <ChartCard
        title="Inventory Value by Category"
        loading={inventoryValueLoading}
        height={300}
        showFilter={false}
        emptyMessage="No inventory value data available"
        isEmpty={inventoryValueChartData.length === 0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={inventoryValueChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.percentage.toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {inventoryValueChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `Rs ${value.toLocaleString()}`} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
