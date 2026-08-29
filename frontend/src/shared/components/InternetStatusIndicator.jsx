import React from 'react';
import { Wifi, WifiOff, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Reusable Internet Status Indicator Component
 * Shows real-time connection status to online database
 * 
 * @param {Object} connectionStatus - Connection status from useCheckConnectionStatusQuery
 * @param {string} size - Size variant: 'sm', 'md', 'lg'
 * @param {boolean} showLabel - Whether to show text label
 */
export default function InternetStatusIndicator({ 
    connectionStatus, 
    size = 'sm', 
    showLabel = true 
}) {
    const isConnected = connectionStatus?.connected;
    const isLoading = connectionStatus === undefined;

    // Size configurations
    const sizeConfig = {
        sm: {
            containerClass: 'text-xs',
            wifiSize: 12,
            statusSize: 10,
            dotSize: 'w-2 h-2'
        },
        md: {
            containerClass: 'text-sm',
            wifiSize: 14,
            statusSize: 12,
            dotSize: 'w-3 h-3'
        },
        lg: {
            containerClass: 'text-base',
            wifiSize: 16,
            statusSize: 14,
            dotSize: 'w-4 h-4'
        }
    };

    const config = sizeConfig[size] || sizeConfig.sm;

    if (isLoading) {
        return (
            <div className={`flex items-center gap-2 ${config.containerClass}`} style={{ color: "var(--muted)" }}>
                <div className={`${config.dotSize} rounded-full bg-gray-400 animate-pulse`} />
                {showLabel && <span>Checking connection...</span>}
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-2 ${config.containerClass}`}>
            {isConnected ? (
                <>
                    <div className="flex items-center gap-1.5">
                        <Wifi size={config.wifiSize} className="text-green-600" />
                        <CheckCircle size={config.statusSize} className="text-green-600" />
                    </div>
                    {showLabel && (
                        <span className="text-green-700 font-medium">
                            {size === 'lg' ? 'Online Database Connected' : 'Online DB Connected'}
                        </span>
                    )}
                </>
            ) : (
                <>
                    <div className="flex items-center gap-1.5">
                        <WifiOff size={config.wifiSize} className="text-orange-600" />
                        <AlertCircle size={config.statusSize} className="text-orange-600" />
                    </div>
                    {showLabel && (
                        <span className="text-orange-700 font-medium">
                            {size === 'lg' ? 'Offline Mode (Local Only)' : 'Offline Mode'}
                        </span>
                    )}
                </>
            )}
        </div>
    );
}

/**
 * Compact version for headers/toolbars
 */
export function CompactInternetStatus({ connectionStatus }) {
    return <InternetStatusIndicator connectionStatus={connectionStatus} size="sm" showLabel={false} />;
}

/**
 * Full version for main content areas
 */
export function FullInternetStatus({ connectionStatus }) {
    return <InternetStatusIndicator connectionStatus={connectionStatus} size="md" showLabel={true} />;
}

/**
 * Large version for important status displays
 */
export function LargeInternetStatus({ connectionStatus }) {
    return <InternetStatusIndicator connectionStatus={connectionStatus} size="lg" showLabel={true} />;
}