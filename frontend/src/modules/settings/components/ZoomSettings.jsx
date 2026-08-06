import React, { useEffect, useState } from "react";
import { ZoomIn, ZoomOut, Monitor, RotateCcw } from "lucide-react";
import { getApiUrl } from "../../../shared/utilities/themeApplier.js";

export default function ZoomSettings({ labels }) {
    const [zoom, setZoom] = useState(1.0);
    const [zoomSaving, setZoomSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        // Load zoom from localStorage first, then from settings
        const loadZoom = async () => {
            try {
                // Try localStorage first
                const localZoom = localStorage.getItem('appZoom');
                if (localZoom) {
                    setZoom(parseFloat(localZoom));
                    applyZoom(parseFloat(localZoom));
                } else {
                    // Load from settings
                    const response = await fetch(getApiUrl("/api/settings?userId=global"));
                    const data = await response.json();
                    if (data.success && data.data?.zoom) {
                        setZoom(data.data.zoom);
                        localStorage.setItem('appZoom', data.data.zoom);
                        applyZoom(data.data.zoom);
                    }
                }
            } catch (error) {
                console.error("Failed to load zoom", error);
            }
        };

        loadZoom();
    }, []);

    // Apply zoom using Electron API or CSS transform
    const applyZoom = (zoomLevel) => {
        // Try to use Electron's electronAPI if available
        if (window.electronAPI && window.electronAPI.setZoom) {
            window.electronAPI.setZoom(zoomLevel);
        } else {
            // Fallback to CSS transform for web
            document.body.style.transform = `scale(${zoomLevel})`;
            document.body.style.transformOrigin = 'top left';
            document.body.style.width = `${100 / zoomLevel}%`;
        }
    };

    const handleZoomChange = async (newZoom) => {
        setZoom(newZoom);
        applyZoom(newZoom);
        localStorage.setItem('appZoom', newZoom);

        // Save to backend
        try {
            setZoomSaving(true);
            const response = await fetch(getApiUrl("/api/settings/zoom"), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: "global", zoom: newZoom }),
            });
            const data = await response.json();
            if (data.success) {
                setMessage(`Zoom set to ${Math.round(newZoom * 100)}%`);
            }
        } catch (error) {
            console.error("Failed to save zoom", error);
        } finally {
            setZoomSaving(false);
        }
    };

    const handleZoomIn = () => {
        const newZoom = Math.min(zoom + 0.1, 2.0);
        handleZoomChange(newZoom);
    };

    const handleZoomOut = () => {
        const newZoom = Math.max(zoom - 0.1, 0.5);
        handleZoomChange(newZoom);
    };

    const handleZoomReset = () => {
        handleZoomChange(1.0);
    };

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="rounded-2xl border border-(--border) bg-(--surface) p-6">
                <div className="flex items-center gap-3">
                    <Monitor size={24} className="text-(--accent-2)" />
                    <div>
                        <h2 className="text-xl font-semibold text-(--ink)">Display Zoom</h2>
                        <p className="text-sm text-(--muted)">Adjust the application zoom level (50% - 200%)</p>
                    </div>
                </div>
                {message ? (
                    <div className="mt-4 rounded-lg border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--ink)">
                        {message}
                    </div>
                ) : null}
            </div>

            {/* Zoom Controls Section */}
            <div className="rounded-2xl border border-(--border) bg-(--surface) p-6">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={handleZoomOut}
                        disabled={zoomSaving || zoom <= 0.5}
                        className="flex items-center gap-2 rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm font-medium text-(--ink) hover:bg-(--border) transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <ZoomOut size={16} /> Zoom Out
                    </button>
                    <div className="flex-1 rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-3 text-center">
                        <span className="text-lg font-semibold text-(--ink)">{Math.round(zoom * 100)}%</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleZoomIn}
                        disabled={zoomSaving || zoom >= 2.0}
                        className="flex items-center gap-2 rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm font-medium text-(--ink) hover:bg-(--border) transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <ZoomIn size={16} /> Zoom In
                    </button>
                    <button
                        type="button"
                        onClick={handleZoomReset}
                        disabled={zoomSaving || zoom === 1.0}
                        className="flex items-center gap-2 rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm font-medium text-(--ink) hover:bg-(--border) transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RotateCcw size={16} /> Reset
                    </button>
                </div>
                <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                    disabled={zoomSaving}
                    className="mt-4 w-full h-2 bg-(--border) rounded-lg appearance-none cursor-pointer accent-(--accent-2)"
                />
            </div>

            {/* Info Section */}
            <div className="rounded-2xl border border-(--border) bg-(--surface) p-6">
                <h3 className="text-lg font-semibold text-(--ink) mb-4">Zoom Information</h3>
                <div className="space-y-3 text-sm text-(--muted)">
                    <p>• <strong>50%:</strong> Smallest zoom level for compact viewing</p>
                    <p>• <strong>100%:</strong> Default zoom level (normal size)</p>
                    <p>• <strong>200%:</strong> Largest zoom level for detailed viewing</p>
                    <p>• Zoom settings are saved and automatically applied when you open the application</p>
                </div>
            </div>
        </div>
    );
}
