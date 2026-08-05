import React, { useState, useEffect } from "react";
import { RefreshCw, Download, CheckCircle, AlertCircle, Info } from "lucide-react";

export default function AppUpdateSettings() {
    const [updateStatus, setUpdateStatus] = useState({
        status: 'idle', // idle, checking, available, not-available, downloading, downloaded, error
        version: null,
        releaseNotes: null,
        percent: 0,
        message: null
    });
    const [currentVersion, setCurrentVersion] = useState('');

    useEffect(() => {
        // Get current app version from electron app
        const fetchVersion = async () => {
            if (window.electronAPI) {
                try {
                    const version = await window.electronAPI.getAppVersion();
                    setCurrentVersion(version);
                } catch (error) {
                    console.error('Failed to get app version:', error);
                    setCurrentVersion('Unknown');
                }
            }
        };
        fetchVersion();
    }, []);

    const checkForUpdates = async () => {
        if (!window.electronAPI) return;

        setUpdateStatus(prev => ({ ...prev, status: 'checking', message: null }));

        try {
            const result = await window.electronAPI.checkForUpdates();
            
            if (result.success) {
                if (result.updateAvailable) {
                    setUpdateStatus({
                        status: 'available',
                        version: result.version,
                        releaseNotes: result.releaseNotes,
                        percent: 0,
                        message: null
                    });
                } else {
                    setUpdateStatus({
                        status: 'not-available',
                        version: null,
                        releaseNotes: null,
                        percent: 0,
                        message: 'You are using the latest version'
                    });
                }
            } else {
                setUpdateStatus({
                    status: 'error',
                    version: null,
                    releaseNotes: null,
                    percent: 0,
                    message: result.error || 'Failed to check for updates'
                });
            }
        } catch (error) {
            setUpdateStatus({
                status: 'error',
                version: null,
                releaseNotes: null,
                percent: 0,
                message: 'Failed to check for updates'
            });
        }
    };

    const downloadUpdate = async () => {
        if (!window.electronAPI) return;

        setUpdateStatus(prev => ({ ...prev, status: 'downloading' }));

        try {
            await window.electronAPI.downloadUpdate();
        } catch (error) {
            setUpdateStatus({
                status: 'error',
                version: null,
                releaseNotes: null,
                percent: 0,
                message: 'Failed to download update'
            });
        }
    };

    const installUpdate = async () => {
        if (!window.electronAPI) return;

        try {
            await window.electronAPI.installUpdate();
            // After installation, the app will restart, so we don't need to update state here
        } catch (error) {
            setUpdateStatus({
                status: 'error',
                version: null,
                releaseNotes: null,
                percent: 0,
                message: 'Failed to install update'
            });
        }
    };

    const refreshVersion = async () => {
        if (window.electronAPI) {
            try {
                const version = await window.electronAPI.getAppVersion();
                setCurrentVersion(version);
            } catch (error) {
                console.error('Failed to refresh app version:', error);
            }
        }
    };

    useEffect(() => {
        if (!window.electronAPI) return;

        const handleUpdateStatus = (data) => {
            setUpdateStatus(prev => ({
                ...prev,
                status: data.status,
                percent: data.percent || prev.percent,
                message: data.message || prev.message
            }));
            
            // Refresh version when update is not available (after successful update and restart)
            if (data.status === 'not-available') {
                refreshVersion();
            }
        };

        window.electronAPI.onUpdateStatus(handleUpdateStatus);

        return () => {
            // Cleanup listener if needed
        };
    }, []);

    const getStatusIcon = () => {
        switch (updateStatus.status) {
            case 'available':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'not-available':
                return <CheckCircle className="w-5 h-5 text-blue-500" />;
            case 'downloading':
                return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />;
            case 'downloaded':
                return <Download className="w-5 h-5 text-green-500" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'checking':
                return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
            default:
                return <Info className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusText = () => {
        switch (updateStatus.status) {
            case 'available':
                return `New version ${updateStatus.version} available`;
            case 'not-available':
                return 'You are using the latest version';
            case 'downloading':
                return `Downloading update... ${updateStatus.percent}%`;
            case 'downloaded':
                return 'Update downloaded and ready to install';
            case 'error':
                return updateStatus.message || 'Error occurred';
            case 'checking':
                return 'Checking for updates...';
            default:
                return 'Check for updates';
        }
    };

    const getStatusColor = () => {
        switch (updateStatus.status) {
            case 'available':
                return 'bg-green-50 border-green-200 text-green-800';
            case 'not-available':
                return 'bg-blue-50 border-blue-200 text-blue-800';
            case 'downloading':
                return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            case 'downloaded':
                return 'bg-green-50 border-green-200 text-green-800';
            case 'error':
                return 'bg-red-50 border-red-200 text-red-800';
            case 'checking':
                return 'bg-blue-50 border-blue-200 text-blue-800';
            default:
                return 'bg-gray-50 border-gray-200 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-(--ink)">App Update</h2>
                <div className="text-sm text-(--muted)">
                    Current Version: {currentVersion}
                </div>
            </div>

            {/* Status Card */}
            <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
                <div className="flex items-center gap-3">
                    {getStatusIcon()}
                    <div className="flex-1">
                        <p className="font-medium">{getStatusText()}</p>
                        {updateStatus.status === 'downloading' && (
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-yellow-500 h-2 rounded-full transition-all"
                                    style={{ width: `${updateStatus.percent}%` }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Update Details */}
            {updateStatus.status === 'available' && (
                <div className="p-4 rounded-lg border border-(--border) bg-(--surface-muted)">
                    <h3 className="font-semibold mb-2 text-(--ink)">Update Details</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-(--muted)">New Version:</span>
                            <span className="font-medium text-(--ink)">{updateStatus.version}</span>
                        </div>
                        {updateStatus.releaseNotes && (
                            <div>
                                <span className="text-(--muted) block mb-1">Release Notes:</span>
                                <div className="text-sm text-(--ink) whitespace-pre-wrap bg-(--surface) p-3 rounded">
                                    {updateStatus.releaseNotes}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
                {updateStatus.status === 'idle' || updateStatus.status === 'not-available' || updateStatus.status === 'error' ? (
                    <button
                        onClick={checkForUpdates}
                        disabled={updateStatus.status === 'checking'}
                        className="flex items-center gap-2 px-4 py-2 bg-(--accent-2) text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`w-4 h-4 ${updateStatus.status === 'checking' ? 'animate-spin' : ''}`} />
                        Check for Updates
                    </button>
                ) : null}

                {updateStatus.status === 'available' && (
                    <button
                        onClick={downloadUpdate}
                        className="flex items-center gap-2 px-4 py-2 bg-(--accent-2) text-white rounded-lg hover:opacity-90"
                    >
                        <Download className="w-4 h-4" />
                        Download Update
                    </button>
                )}

                {updateStatus.status === 'downloaded' && (
                    <button
                        onClick={installUpdate}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:opacity-90"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Install and Restart
                    </button>
                )}
            </div>

            {/* Auto-update Info */}
            <div className="p-4 rounded-lg border border-(--border) bg-(--surface-muted)">
                <h3 className="font-semibold mb-2 text-(--ink)">Auto-update Information</h3>
                <ul className="space-y-2 text-sm text-(--muted)">
                    <li>• The application automatically checks for updates on startup</li>
                    <li>• When an update is available, you will be notified</li>
                    <li>• Updates are downloaded automatically in the background</li>
                    <li>• You can manually check for updates using the button above</li>
                    <li>• After downloading, you need to install the update manually</li>
                </ul>
            </div>

            {!window.electronAPI && (
                <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-800">
                    <p className="font-medium">Electron API not available</p>
                    <p className="text-sm">This feature is only available in the desktop application.</p>
                </div>
            )}
        </div>
    );
}
