import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboardLabels } from '../labels/dashboardLabels.js';
import { useSettings } from '../../settings/hooks/useSettings.js';
import ChartCard from './ChartCard.jsx';
import { useGetTopSellingProductsQuery } from '../services/dashboard.service.js';

export default function TopSellingProducts({ filter = '30D' }) {
  const { settings } = useSettings();
  const language = settings?.language || "en";
  const labels = getDashboardLabels(language);
  
  const [metric, setMetric] = useState('revenue');

  const { data: topProductsData, isLoading } = useGetTopSellingProductsQuery({ range: filter, metric });

  const chartData = topProductsData?.map(d => ({
    name: d.name,
    value: metric === 'revenue' ? d.revenue : d.unitsSold,
  })) || [];

  return (
    <div className="col-span-1 lg:col-span-2">
      <ChartCard
        title={labels.topSellingProducts}
        loading={isLoading}
        height={350}
        showFilter={false}
        emptyMessage={labels.noDataAvailable}
        isEmpty={chartData.length === 0}
        filterSlot={
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--app-bg)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
          >
            <option value="revenue">{labels.byRevenue}</option>
            <option value="units">{labels.byUnitsSold}</option>
          </select>
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            layout="vertical"
            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
          >
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
              width={110}
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
              formatter={(value) => [
                metric === 'revenue' ? `Rs ${value.toLocaleString()}` : value,
                metric === 'revenue' ? labels.revenue : labels.unitsSold
              ]}
            />
            <Bar 
              dataKey="value" 
              fill="var(--accent-2)" 
              radius={[0, 6, 6, 0]}
              barSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
