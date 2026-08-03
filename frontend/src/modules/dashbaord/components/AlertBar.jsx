import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useGetInventoryAlertKPIsQuery } from '../services/dashboard.service.js';
import { getDashboardLabels } from '../labels/dashboardLabels.js';
import { useSettings } from '../../settings/hooks/useSettings.js';

export default function AlertBar() {
  const { settings } = useSettings();
  const language = settings?.language || "en";
  const labels = getDashboardLabels(language);
  
  const { data: alerts, isLoading } = useGetInventoryAlertKPIsQuery();

  if (isLoading || !alerts || (alerts.expiringIn7Days === 0 && alerts.lowStock === 0 && alerts.outOfStock === 0)) {
    return null;
  }

  const alertChips = [];

  if (alerts.expiringIn7Days > 0) {
    alertChips.push({
      type: 'critical',
      label: `${alerts.expiringIn7Days} ${labels.batchesExpiringIn7Days}`,
      color: 'bg-red-500',
      textColor: 'text-white',
    });
  }

  if (alerts.lowStock > 0) {
    alertChips.push({
      type: 'warning',
      label: `${alerts.lowStock} ${labels.batchesWithLowStock}`,
      color: 'bg-amber-500',
      textColor: 'text-white',
    });
  }

  if (alerts.outOfStock > 0) {
    alertChips.push({
      type: 'critical',
      label: `${alerts.outOfStock} ${labels.batchesOutOfStock}`,
      color: 'bg-red-500',
      textColor: 'text-white',
    });
  }

  if (alertChips.length === 0) return null;

  return (
    <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 mb-6">
      <div className="flex items-center gap-3 overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <AlertTriangle size={18} className="text-amber-500" />
          <span className="text-sm font-semibold text-[var(--ink)]">{labels.activeAlerts}:</span>
        </div>
        {alertChips.map((chip, index) => (
          <button
            key={index}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${chip.color} ${chip.textColor} hover:opacity-90 transition-opacity`}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
