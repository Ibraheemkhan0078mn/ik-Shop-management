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
        height={300}
        showFilter={false}
        emptyMessage={labels.noDataAvailable}
        isEmpty={revenueChartData.length === 0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={revenueChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" stroke="var(--muted)" />
            <YAxis stroke="var(--muted)" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="retail" stroke="#10b981" name={labels.retail} strokeWidth={2} />
            <Line type="monotone" dataKey="wholesale" stroke="#3b82f6" name={labels.wholesale} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Orders Over Time */}
      <ChartCard
        title={`${labels.totalOrders} ${labels.retailVsWholesale}`}
        loading={ordersLoading}
        height={300}
        showFilter={false}
        emptyMessage={labels.noDataAvailable}
        isEmpty={ordersChartData.length === 0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ordersChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" stroke="var(--muted)" />
            <YAxis stroke="var(--muted)" />
            <Tooltip />
            <Legend />
            <Bar dataKey="retail" fill="#10b981" name={`${labels.retail} ${labels.orders}`} />
            <Bar dataKey="wholesale" fill="#3b82f6" name={`${labels.wholesale} ${labels.orders}`} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
