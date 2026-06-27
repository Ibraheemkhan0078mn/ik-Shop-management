import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartCard from './ChartCard.jsx';
import { useGetRetailVsWholesaleComparisonQuery } from '../services/dashboard.service.js';

export default function RetailWholesaleComparison() {
  const [filter, setFilter] = React.useState('30D');
  const { data: comparisonData, isLoading } = useGetRetailVsWholesaleComparisonQuery(filter);

  const chartData = comparisonData?.map(d => ({
    date: d.date,
    retail: d.retail,
    wholesale: d.wholesale,
  })) || [];

  return (
    <ChartCard
      title="Retail vs Wholesale Comparison"
      loading={isLoading}
      height={300}
      showFilter
      defaultFilter="30D"
      onFilterChange={setFilter}
      emptyMessage="No comparison data for this period"
      isEmpty={chartData.length === 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" stroke="var(--muted)" />
          <YAxis stroke="var(--muted)" />
          <Tooltip />
          <Legend />
          <Bar dataKey="retail" fill="#10b981" name="Retail Revenue" />
          <Bar dataKey="wholesale" fill="#3b82f6" name="Wholesale Revenue" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
