import React, { useState, useEffect } from "react";
import { Cloud, Database, RefreshCw, Clock, AlertCircle, CheckCircle, HardDrive, X } from "lucide-react";
import { useGetStorageInfoQuery, useSyncAllMutation, useSyncRequiredMutation, useStopSyncMutation, useGetSyncStatusQuery } from "../../backup/api/backup.api.js";
import { useUpdateBackupSettingsMutation } from "../../settings/api/settings.api.js";
import { convertToMilliseconds } from "../../../shared/utilities/time.utility.js";

export default function BackupSettings({ settingsData, userId, labels }) {
    const [syncIntervalValue, setSyncIntervalValue] = useState(settingsData?.backup?.syncIntervalValue || settingsData?.backup?.syncInterval || 4);
    const [syncIntervalUnit, setSyncIntervalUnit] = useState(settingsData?.backup?.syncIntervalUnit || 'hours');
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);

    const { data: storageInfo, isLoading: storageLoading, refetch: refetchStorage } = useGetStorageInfoQuery();
    
    // Debug logging
    console.log("Storage Info:", storageInfo);
    console.log("Storage Loading:", storageLoading);
    const [syncAll] = useSyncAllMutation();
    const [syncRequired] = useSyncRequiredMutation();
    const [stopSync] = useStopSyncMutation();
    const [updateBackupSettings] = useUpdateBackupSettingsMutation();
    const { data: syncStatus } = useGetSyncStatusQuery();

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

    const handleSyncAll = async () => {
        setIsSyncing(true);
        try {
            await syncAll().unwrap();
            setLastSyncTime(new Date());
            await refetchStorage();
        } catch (error) {
            console.error("Sync all failed:", error);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSyncRequired = async () => {
        setIsSyncing(true);
        try {
            await syncRequired().unwrap();
            setLastSyncTime(new Date());
            await refetchStorage();
        } catch (error) {
            console.error("Sync required failed:", error);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleStopSync = async () => {
        try {
            await stopSync().unwrap();
            setIsSyncing(false);
        } catch (error) {
            console.error("Stop sync failed:", error);
        }
    };

    // Interval-based sync activation
    useEffect(() => {
        if (!syncIntervalValue || syncIntervalValue === 0) return;

        const intervalMs = convertToMilliseconds(syncIntervalValue, syncIntervalUnit);
        console.log(`Auto-sync will run every ${syncIntervalValue} ${syncIntervalUnit} (${intervalMs}ms)`);

        const intervalId = setInterval(async () => {
            console.log("Running scheduled sync (required)...");
            await handleSyncRequired();
        }, intervalMs);

        return () => clearInterval(intervalId);
    }, [syncIntervalValue, syncIntervalUnit]);

    const timeUnitOptions = [
        // { value: 'seconds', label: 'Seconds' },
        { value: 'minutes', label: 'Minutes' },
        { value: 'hours', label: 'Hours' },
        { value: 'days', label: 'Days' },
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
                <h2 className="text-xl font-semibold text-[var(--ink)] mb-2">Backup & Sync Settings</h2>
                <p className="text-sm text-[var(--muted)]">Manage online database backup and synchronization</p>
            </div>

            {/* Online Sync Section */}
            <div className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Cloud size={24} className="text-[var(--accent-2)]" />
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--ink)]">Online Sync</h3>
                        <p className="text-sm text-[var(--muted)]">Cloud storage and synchronization status</p>
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
                                    <span className="text-sm font-medium text-[var(--ink)]">Storage Usage</span>
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
                                <span>Used: {formatBytes(storageInfo?.used)}</span>
                                <span>Total: {formatBytes(storageInfo?.total)}</span>
                                <span>Remaining: {formatBytes(storageInfo?.remaining)}</span>
                            </div>
                        </div>

                        {/* Sync Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <button
                                onClick={handleSyncAll}
                                disabled={isSyncing}
                                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--app-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Database size={20} />
                                <span>Sync All Data</span>
                                {isSyncing && <RefreshCw size={16} className="animate-spin" />}
                            </button>
                            <button
                                onClick={handleSyncRequired}
                                disabled={isSyncing}
                                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--app-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RefreshCw size={20} />
                                <span>Sync Required Only</span>
                                {isSyncing && <RefreshCw size={16} className="animate-spin" />}
                            </button>
                            {isSyncing && (
                                <button
                                    onClick={handleStopSync}
                                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-red-500 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                >
                                    <X size={20} />
                                    <span>Stop Sync</span>
                                </button>
                            )}
                        </div>

                        {/* Last Sync Status */}
                        {lastSyncTime && (
                            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                                <CheckCircle size={16} className="text-green-600" />
                                <span className="text-sm text-[var(--muted)]">
                                    Last synced: {lastSyncTime.toLocaleString()}
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
                        <h3 className="text-lg font-semibold text-[var(--ink)]">Auto Sync Interval</h3>
                        <p className="text-sm text-[var(--muted)]">Configure automatic backup synchronization</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-[var(--ink)] mb-3 block">Sync Frequency</label>
                        <div className="flex gap-3">
                            <input
                                type="number"
                                min="0"
                                value={syncIntervalValue}
                                onChange={(e) => setSyncIntervalValue(parseInt(e.target.value) || 0)}
                                className="flex-1 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                                placeholder="Enter value"
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
                                Set
                            </button>
                        </div>
                    </div>

                    {syncIntervalValue > 0 && (
                        <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                            <CheckCircle size={16} className="text-green-600" />
                            <span className="text-sm text-[var(--muted)]">
                                Auto-sync is active. Data will sync every {syncIntervalValue} {syncIntervalUnit === 'seconds' ? 'second' : syncIntervalUnit === 'minutes' ? 'minute' : syncIntervalUnit === 'hours' ? 'hour' : 'day'}{syncIntervalValue > 1 ? 's' : ''}.
                            </span>
                        </div>
                    )}

                    {syncIntervalValue === 0 && (
                        <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                            <AlertCircle size={16} className="text-yellow-600" />
                            <span className="text-sm text-[var(--muted)]">
                                Auto-sync is disabled. Manual sync only.
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
                        <p className="font-medium text-[var(--ink)] mb-1">About Backup & Sync</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Sync All: Uploads complete database to cloud storage</li>
                            <li>Sync Required: Only uploads changed/modified data</li>
                            <li>Auto-sync: Automatically syncs at configured intervals</li>
                            <li>Storage usage shows cloud database space utilization</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
