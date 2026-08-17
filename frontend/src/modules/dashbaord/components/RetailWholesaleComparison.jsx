import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDashboardLabels } from '../labels/dashboardLabels.js';
import { useSettings } from '../../settings/hooks/useSettings.js';
import ChartCard from './ChartCard.jsx';
import { useGetRetailVsWholesaleComparisonQuery } from '../services/dashboard.service.js';

export default function RetailWholesaleComparison({ filter = '30D' }) {
  const { settings } = useSettings();
  const language = settings?.language || "en";
  const labels = getDashboardLabels(language);
  
  const { data: comparisonData, isLoading } = useGetRetailVsWholesaleComparisonQuery(filter);

  const chartData = comparisonData?.map(d => ({
    date: d.date,
    retail: d.retail,
    wholesale: d.wholesale,
  })) || [];

  return (
    <ChartCard
      title={labels.retailVsWholesale}
      loading={isLoading}
      height={350}
      showFilter={false}
      emptyMessage={labels.noDataAvailable}
      isEmpty={chartData.length === 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            iconType="rect"
          />
          <Bar 
            dataKey="retail" 
            fill="var(--accent-2)" 
            name={`${labels.retail} ${labels.revenue}`}
            radius={[6, 6, 0, 0]}
            barSize={32}
          />
          <Bar 
            dataKey="wholesale" 
            fill="#3b82f6" 
            name={`${labels.wholesale} ${labels.revenue}`}
            radius={[6, 6, 0, 0]}
            barSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
