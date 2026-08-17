import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDashboardLabels } from '../labels/dashboardLabels.js';
import { useSettings } from '../../settings/hooks/useSettings.js';
import ChartCard from './ChartCard.jsx';
import { useGetRevenueOverTimeQuery, useGetOrdersOverTimeQuery } from '../services/dashboard.service.js';

export default function SalesCharts({ filter = '30D' }) {
  const { settings } = useSettings();
  const language = settings?.language || "en";
  const labels = getDashboardLabels(language);

  const { data: revenueData, isLoading: revenueLoading } = useGetRevenueOverTimeQuery(filter);
  const { data: ordersData, isLoading: ordersLoading } = useGetOrdersOverTimeQuery(filter);

  const revenueChartData = revenueData?.map(d => ({
    date: d.date,
    retail: d.retail,
    wholesale: d.wholesale,
  })) || [];

  const ordersChartData = ordersData?.map(d => ({
    date: d.date,
    retail: d.retail,
    wholesale: d.wholesale,
  })) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Over Time */}
      <ChartCard
        title={`${labels.totalRevenue} ${labels.retailVsWholesale}`}
        loading={revenueLoading}
        height={350}
        showFilter={false}
        emptyMessage={labels.noDataAvailable}
        isEmpty={revenueChartData.length === 0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={revenueChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              stroke="var(--muted)"
              tick={{ fill: 'var(--muted)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis 
              stroke="var(--muted)"
              tick={{ fill: 'var(--muted)', fontSize: 12 }}
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
              formatter={(value) => [`Rs ${value.toLocaleString()}`, '']}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', color: 'var(--text)' }}
              iconType="circle"
            />
            <Line 
              type="monotone" 
              dataKey="retail" 
              stroke="var(--accent-2)" 
              name={labels.retail} 
              strokeWidth={4}
              dot={{ fill: 'var(--accent-2)', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8 }}
            />
            <Line 
              type="monotone" 
              dataKey="wholesale" 
              stroke="#3b82f6" 
              name={labels.wholesale} 
              strokeWidth={4}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Orders Over Time */}
      <ChartCard
        title={`${labels.totalOrders} ${labels.retailVsWholesale}`}
        loading={ordersLoading}
        height={350}
        showFilter={false}
        emptyMessage={labels.noDataAvailable}
        isEmpty={ordersChartData.length === 0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ordersChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              stroke="var(--muted)"
              tick={{ fill: 'var(--muted)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis 
              stroke="var(--muted)"
              tick={{ fill: 'var(--muted)', fontSize: 12 }}
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
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', color: 'var(--text)' }}
              iconType="rect"
            />
            <Bar 
              dataKey="retail" 
              fill="var(--accent-2)" 
              name={`${labels.retail} ${labels.orders}`}
              radius={[6, 6, 0, 0]}
              barSize={32}
            />
            <Bar 
              dataKey="wholesale" 
              fill="#3b82f6" 
              name={`${labels.wholesale} ${labels.orders}`}
              radius={[6, 6, 0, 0]}
              barSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
