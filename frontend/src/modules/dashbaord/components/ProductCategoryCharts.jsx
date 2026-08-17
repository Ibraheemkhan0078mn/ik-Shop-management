import React from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDashboardLabels } from '../labels/dashboardLabels.js';
import { useSettings } from '../../settings/hooks/useSettings.js';
import ChartCard from './ChartCard.jsx';
import { useGetSalesByCategoryQuery } from '../services/dashboard.service.js';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function ProductCategoryCharts({ filter = '30D' }) {
  const { settings } = useSettings();
  const language = settings?.language || "en";
  const labels = getDashboardLabels(language);
  
  const { data: categoryData, isLoading: categoryLoading } = useGetSalesByCategoryQuery(filter);

  const categoryChartData = categoryData?.map(d => ({
    name: d.name,
    revenue: d.revenue,
    orderCount: d.orderCount,
  })) || [];

  const pieChartData = categoryData?.map(d => ({
    name: d.name,
    value: d.revenue,
  })) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sales by Category - Bar Chart */}
      <ChartCard
        title={labels.salesByCategory}
        loading={categoryLoading}
        height={350}
        showFilter={false}
        emptyMessage={labels.noDataAvailable}
        isEmpty={categoryChartData.length === 0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categoryChartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis 
              type="number" 
              stroke="var(--muted)"
              tick={{ fill: 'var(--muted)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={90}
              stroke="var(--muted)"
              tick={{ fill: 'var(--text)', fontSize: 12, fontWeight: 500 }}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              itemStyle={{ color: 'var(--text)' }}
              labelStyle={{ color: 'var(--muted)' }}
              formatter={(value) => [`Rs ${value.toLocaleString()}`, labels.revenue]}
            />
            <Bar 
              dataKey="revenue" 
              fill="var(--accent-2)" 
              name={labels.revenue}
              radius={[0, 6, 6, 0]}
              barSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Sales by Category - Pie Chart */}
      <ChartCard
        title={`${labels.categoryDistribution} (${labels.revenue})`}
        loading={categoryLoading}
        height={350}
        showFilter={false}
        emptyMessage={labels.noDataAvailable}
        isEmpty={pieChartData.length === 0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}`}
              outerRadius={100}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              paddingAngle={2}
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              itemStyle={{ color: 'var(--text)' }}
              labelStyle={{ color: 'var(--muted)' }}
              formatter={(value) => [`Rs ${value.toLocaleString()}`, labels.revenue]}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', color: 'var(--text)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
