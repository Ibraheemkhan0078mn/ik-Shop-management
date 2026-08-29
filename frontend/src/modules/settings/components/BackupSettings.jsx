import React, { useState, useEffect } from "react";
import { Cloud, Database, RefreshCw, Clock, AlertCircle, CheckCircle, HardDrive, X, FileSpreadsheet } from "lucide-react";
import { useGetStorageInfoQuery, useSyncAllMutation, useSyncRequiredMutation, useStopSyncMutation, useGetSyncStatusQuery, useExportExcelMutation } from "../../backup/api/backup.api.js";
import { useUpdateBackupSettingsMutation } from "../../settings/api/settings.api.js";
import { convertToMilliseconds } from "../../../shared/utilities/time.utility.js";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";
import { toast } from "sonner";

export default function BackupSettings({ settingsData, userId, labels }) {
    const [syncIntervalValue, setSyncIntervalValue] = useState(settingsData?.backup?.syncIntervalValue || settingsData?.backup?.syncInterval || 4);
    const [syncIntervalUnit, setSyncIntervalUnit] = useState(settingsData?.backup?.syncIntervalUnit || 'hours');
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [excelBackupPath, setExcelBackupPath] = useState(settingsData?.backup?.excelBackupPath || "./backups/excel");
    const [isExporting, setIsExporting] = useState(false);

    // Disable automatic polling for storage info to prevent excessive API calls
    const { data: storageInfo, isLoading: storageLoading, refetch: refetchStorage } = useGetStorageInfoQuery(undefined, {
        pollingInterval: 0, // Disable auto-polling
        refetchOnMountOrArgChange: false, // Don't refetch on every mount
        refetchOnFocus: false, // Don't refetch when window regains focus
    });
    
    const [syncAll, { isLoading: syncAllLoading }] = useSyncAllMutation();
    const [syncRequired, { isLoading: syncRequiredLoading }] = useSyncRequiredMutation();
    const [stopSync] = useStopSyncMutation();
    const [updateBackupSettings] = useUpdateBackupSettingsMutation();
    const [exportExcel] = useExportExcelMutation();
    const { data: syncStatus } = useGetSyncStatusQuery(undefined, {
        pollingInterval: 0, // Disable auto-polling
    });

    // Update sync interval in settings when changed
    const handleIntervalChange = async (value, unit) => {
        setSyncIntervalValue(value);
        setSyncIntervalUnit(unit);
        try {
            console.log("Sending backup settings:", { userId: userId || "global", backup: { syncIntervalValue: value, syncIntervalUnit: unit } });
            await updateBackupSettings({ 
                userId: userId || "global",
                backup: { syncIntervalValue: value, syncIntervalUnit: unit }
            }).unwrap();
            console.log("Sync interval updated to:", value, unit);
        } catch (error) {
            console.error("Failed to update sync interval:", error);
        }
    };

    // Update Excel backup path in settings when changed
    const handleExcelPathChange = async (path) => {
        setExcelBackupPath(path);
        try {
            await updateBackupSettings({ 
                userId: userId || "global",
                backup: { syncIntervalValue, syncIntervalUnit, excelBackupPath: path }
            }).unwrap();
            console.log("Excel backup path updated to:", path);
        } catch (error) {
            console.error("Failed to update xl backup path:", error);
        }
    };

    // Handle Excel export
    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const result = await exportExcel(userId || "global").unwrap();
            toast.success(labels.excelExportSuccess || "Excel export completed successfully");
            console.log("Excel export result:", result);
        } catch (error) {
            console.error("Excel export failed:", error);
            toast.error(labels.excelExportFailed || "Excel export failed");
        } finally {
            setIsExporting(false);
        }
    };

    const handleSyncAll = async () => {
        setIsSyncing(true);
        try {
            const result = await syncAll().unwrap();
            setLastSyncTime(new Date());
            await refetchStorage(); // Manually refetch storage after sync
            toast.success(labels.syncCompleted || "Sync completed successfully");
            console.log("✅ Sync all completed:", result);
        } catch (error) {
            console.error("❌ Sync all failed:", error);
            toast.error(labels.syncFailed || "Sync failed");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSyncRequired = async () => {
        // Prevent multiple simultaneous syncs
        if (isSyncing) {
            console.log("⏭️ Sync already in progress, skipping...");
            return;
        }

        setIsSyncing(true);
        try {
            const result = await syncRequired().unwrap();
            setLastSyncTime(new Date());
            await refetchStorage(); // Manually refetch storage after sync
            console.log("✅ Sync required completed:", result);
        } catch (error) {
            console.error("❌ Sync required failed:", error);
            toast.error(labels.syncFailed || "Sync failed");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleStopSync = async () => {
        try {
            await stopSync().unwrap();
            setIsSyncing(false);
            toast.info(labels.syncStopped || "Sync stopped");
            console.log("🛑 Sync stopped");
        } catch (error) {
            console.error("❌ Stop sync failed:", error);
            toast.error(labels.stopSyncFailed || "Failed to stop sync");
        }
    };

    // Interval-based sync activation
    useEffect(() => {
        if (!syncIntervalValue || syncIntervalValue === 0) {
            console.log("⏸️ Auto-sync disabled (interval is 0)");
            return;
        }

        const intervalMs = convertToMilliseconds(syncIntervalValue, syncIntervalUnit);
        console.log(`🔄 Auto-sync configured: every ${syncIntervalValue} ${syncIntervalUnit} (${intervalMs}ms)`);

        // Set up recurring interval (NO immediate sync on mount to prevent duplicate syncs)
        const intervalId = setInterval(() => {
            console.log("⏰ Running scheduled sync (required)...");
            handleSyncRequired();
        }, intervalMs);

        return () => {
            console.log("🛑 Clearing sync interval");
            clearInterval(intervalId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [syncIntervalValue, syncIntervalUnit]); // Only re-run when interval settings change

    const timeUnitOptions = [
        { value: 'seconds', label: labels.seconds || 'Seconds' },
        { value: 'minutes', label: labels.minutes || 'Minutes' },
        { value: 'hours', label: labels.hours || 'Hours' },
        { value: 'days', label: labels.days || 'Days' },
    ];

    const storagePercentage = storageInfo ? storageInfo.percentage : 0;
    const storageColor = storagePercentage > 80 ? "text-red-600" : storagePercentage > 60 ? "text-yellow-600" : "text-green-600";

    // Debug logging
    console.log("Storage Percentage:", storagePercentage);
    console.log("Storage Info Data:", storageInfo?.data);
    console.log("Storage Info:", storageInfo);

    // Format bytes to human readable format
    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 MB';
        const mb = bytes / (1024 * 1024);
        if (mb < 1024) return `${mb.toFixed(2)} MB`;
        const gb = mb / 1024;
        return `${gb.toFixed(2)} GB`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold text-[var(--ink)] mb-2">{labels.backupAndSync}</h2>
                <p className="text-sm text-[var(--muted)]">{labels.backupAndSyncDescription}</p>
            </div>

            {/* Online Sync Section */}
            <div className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Cloud size={24} className="text-[var(--accent-2)]" />
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--ink)]">{labels.onlineSync}</h3>
                        <p className="text-sm text-[var(--muted)]">{labels.onlineSyncDescription}</p>
                    </div>
                </div>

                {storageLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <RefreshCw size={24} className="animate-spin text-[var(--muted)]" />
                    </div>
                ) : (
                    <>
                        {/* Storage Usage */}
                        <div className="mb-6 p-4 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <HardDrive size={20} className="text-[var(--muted)]" />
                                    <span className="text-sm font-medium text-[var(--ink)]">{labels.storageUsage}</span>
                                </div>
                                <span className={`text-lg font-bold ${storageColor}`}>
                                    {storagePercentage}%
                                </span>
                            </div>
                            <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                                <div
                                    className="h-full transition-all duration-300"
                                    style={{
                                        width: `${storagePercentage}%`,
                                        background: storagePercentage > 80 ? '#dc2626' : storagePercentage > 60 ? '#f59e0b' : '#10b981'
                                    }}
                                />
                            </div>
                            <div className="flex items-center justify-between mt-2 text-xs text-[var(--muted)]">
                                <span>{labels.used}: {formatBytes(storageInfo?.used)}</span>
                                <span>{labels.total}: {formatBytes(storageInfo?.total)}</span>
                                <span>{labels.remaining}: {formatBytes(storageInfo?.remaining)}</span>
                            </div>
                        </div>

                        {/* Sync Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <button
                                onClick={handleSyncAll}
                                disabled={isSyncing || syncAllLoading}
                                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--app-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Database size={20} />
                                <span>{labels.syncAllData}</span>
                                {(isSyncing || syncAllLoading) && <RefreshCw size={16} className="animate-spin" />}
                            </button>
                            <button
                                onClick={handleSyncRequired}
                                disabled={isSyncing || syncRequiredLoading}
                                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--app-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RefreshCw size={20} />
                                <span>{labels.syncRequiredOnly}</span>
                                {(isSyncing || syncRequiredLoading) && <RefreshCw size={16} className="animate-spin" />}
                            </button>
                            {(isSyncing || syncAllLoading || syncRequiredLoading) && (
                                <button
                                    onClick={handleStopSync}
                                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-red-500 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                >
                                    <X size={20} />
                                    <span>{labels.stopSync}</span>
                                </button>
                            )}
                        </div>

                        {/* Last Sync Status */}
                        {lastSyncTime && (
                            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                                <CheckCircle size={16} className="text-green-600" />
                                <span className="text-sm text-[var(--muted)]">
                                    {labels.lastSynced}: {lastSyncTime.toLocaleString()}
                                </span>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Auto Sync Interval Section */}
            <div className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Clock size={24} className="text-[var(--accent-2)]" />
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--ink)]">{labels.autoSyncInterval}</h3>
                        <p className="text-sm text-[var(--muted)]">{labels.autoSyncIntervalDescription}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-[var(--ink)] mb-3 block">{labels.syncFrequency}</label>
                        <div className="flex gap-3">
                            <input
                                type="number"
                                min="0"
                                value={syncIntervalValue}
                                onChange={(e) => setSyncIntervalValue(parseInt(e.target.value) || 0)}
                                className="flex-1 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                                placeholder={labels.enterValue}
                            />
                            <select
                                value={syncIntervalUnit}
                                onChange={(e) => setSyncIntervalUnit(e.target.value)}
                                className="px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                            >
                                {timeUnitOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => handleIntervalChange(syncIntervalValue, syncIntervalUnit)}
                                className="px-6 py-3 rounded-lg bg-[var(--accent-2)] text-white hover:bg-[var(--accent-2)]/90 transition-colors"
                            >
                                {labels.set}
                            </button>
                        </div>
                    </div>

                    {syncIntervalValue > 0 && (
                        <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                            <CheckCircle size={16} className="text-green-600" />
                            <span className="text-sm text-[var(--muted)]">
                                {labels.autoSyncActive} {syncIntervalValue} {syncIntervalUnit === 'seconds' ? labels.second : syncIntervalUnit === 'minutes' ? labels.minute : syncIntervalUnit === 'hours' ? labels.hour : labels.day}{syncIntervalValue > 1 ? 's' : ''}.
                            </span>
                        </div>
                    )}

                    {syncIntervalValue === 0 && (
                        <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                            <AlertCircle size={16} className="text-yellow-600" />
                            <span className="text-sm text-[var(--muted)]">
                                {labels.autoSyncDisabled}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Info Section */}
            <div className="card p-6">
                <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-[var(--accent-2)] mt-0.5" />
                    <div className="text-sm text-[var(--muted)]">
                        <p className="font-medium text-[var(--ink)] mb-1">{labels.aboutBackupSync}</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>{labels.syncAllDescription}</li>
                            <li>{labels.syncRequiredDescription}</li>
                            <li>{labels.autoSyncDescription}</li>
                            <li>{labels.storageUsageDescription}</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Excel Backup Section */}
            <div className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <FileSpreadsheet size={24} className="text-[var(--accent-2)]" />
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--ink)]">{labels.excelBackup}</h3>
                        <p className="text-sm text-[var(--muted)]">{labels.excelBackupDescription}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-[var(--ink)] mb-3 block">{labels.excelBackupPath}</label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={excelBackupPath}
                                onChange={(e) => setExcelBackupPath(e.target.value)}
                                className="flex-1 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                                placeholder={labels.enterExcelBackupPath}
                            />
                            <button
                                onClick={() => handleExcelPathChange(excelBackupPath)}
                                className="px-6 py-3 rounded-lg bg-[var(--accent-2)] text-white hover:bg-[var(--accent-2)]/90 transition-colors"
                            >
                                {labels.set}
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <PermissionGuard execute={() => handleExportExcel()} permission="settings.view" isConfirmation={true}>
                            <button
                                disabled={isExporting}
                                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FileSpreadsheet size={18} />
                                {isExporting ? labels.exporting : labels.exportExcel}
                            </button>
                        </PermissionGuard>
                    </div>
                </div>
            </div>
        </div>
    );
}
