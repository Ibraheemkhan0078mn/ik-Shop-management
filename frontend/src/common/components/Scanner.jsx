import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, ScanLine, Camera } from "lucide-react";

const Scanner = ({ onScan, onClose }) => {
  const scannerRef = useRef(null);
  const stoppedRef = useRef(false);
  const [error, setError] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [permissionState, setPermissionState] = useState("asking"); // asking | granted | denied

  useEffect(() => {
    const scannerId = "qr-scanner-region";

    const startScanner = async () => {
      try {
        // ── Step 1: Permission pehle lo ──
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          setError("Koi camera nahi mila");
          setPermissionState("denied");
          return;
        }
        setPermissionState("granted");

        // ── Step 2: Best camera select karo (back prefer) ──
        const backCam = cameras.find(c =>
          c.label.toLowerCase().includes("back") ||
          c.label.toLowerCase().includes("rear") ||
          c.label.toLowerCase().includes("environment")
        );
        const selectedCam = backCam || cameras[0];

        // ── Step 3: Scanner banao ──
        scannerRef.current = new Html5Qrcode(scannerId, { verbose: false });

        // Dynamic qrbox — 70% of viewfinder for max detection area
        // const qrboxFunction = (viewfinderWidth, viewfinderHeight) => {
        //   const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.7);
        //   return { width: size, height: size };
        // };
        const qrboxFunction = (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.7);
          return { width: size, height: size };
        };



        await scannerRef.current.start(
          { deviceId: { exact: selectedCam.id } },
          {
            fps: 30,
            qrbox: qrboxFunction,
            disableFlip: false,
            aspectRatio: 1.0,
            focusMode: "continuous",        // ← auto focus always on
            advanced: [{ zoom: 1.0 }],
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true  // ← native GPU API
            },
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
            ],
          },
          (decodedText) => {
            if (stoppedRef.current) return;
            stoppedRef.current = true;
            setScanned(true);

            // Beep
            try {
              const actx = new AudioContext();
              const o = actx.createOscillator();
              const g = actx.createGain();
              o.connect(g); g.connect(actx.destination);
              o.frequency.value = 1200;
              g.gain.setValueAtTime(0.3, actx.currentTime);
              g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.15);
              o.start(); o.stop(actx.currentTime + 0.15);
            } catch { }

            setTimeout(() => {
              if (scannerRef.current?.isScanning) {
                scannerRef.current.stop().catch(() => { });
              }
              onScan?.(decodedText);
            }, 300);
          },
          () => { } // scan fail — ignore karo
        );
      } catch (err) {
        console.error(err);
        if (err?.name === "NotAllowedError" || err?.message?.includes("permission")) {
          setError("Camera permission denied — browser settings mein allow karo");
          setPermissionState("denied");
        } else {
          setError(err?.message || "Camera start nahi hua");
          setPermissionState("denied");
        }
      }
    };

    startScanner();
    // useEffect cleanup
    return () => {
      stoppedRef.current = true
      try { scannerRef.current?.stop().catch(() => { }) } catch { }
    }
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.85)" }}
    >
      {/* Close button */}
      <button
        // Close button
        onClick={async () => {
          stoppedRef.current = true;
          try {
            if (scannerRef.current?.isScanning) {
              await scannerRef.current.stop();
            }
          } catch { }
          onClose();
        }}
        className="absolute top-5 right-5 bg-surface/10 hover:bg-surface/20 text-primary-foreground rounded-full p-2 transition-all"
      >
        <X size={22} />
      </button>

      {/* Title */}
      <p className="text-primary-foreground font-black text-xl tracking-widest uppercase mb-4 opacity-80">
        Scan QR / Barcode
      </p>

      {/* Camera Box */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl bg-black"
        style={{ width: "70vw", maxWidth: "700px", aspectRatio: "1/1" }}
      >
        {/* Scanner div */}
        <div id="qr-scanner-region" className="w-full h-full" />

        {/* Asking permission loader */}
        {permissionState === "asking" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
            <Camera size={40} className="text-accent animate-pulse" />
            <p className="text-primary-foreground text-sm font-medium">Camera permission le raha hai...</p>
          </div>
        )}

        {/* Corner overlays — only when scanning */}
        {permissionState === "granted" && !scanned && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 border-accent rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 border-accent rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 border-accent rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 border-accent rounded-br-lg" />
            <div
              className="absolute left-6 right-6 h-0.5 bg-accent opacity-80 rounded-full"
              style={{ animation: "scanline 1.8s ease-in-out infinite", top: "10%" }}
            />
          </div>
        )}

        {/* Success flash */}
        {scanned && (
          <div className="absolute inset-0 bg-green-400/30 flex items-center justify-center">
            <div className="bg-success rounded-full p-5 shadow-xl">
              <ScanLine size={40} className="text-primary-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Hint */}
      {permissionState === "granted" && !scanned && (
        <p className="text-primary-foreground/50 text-sm mt-5 tracking-wide">
          QR ya Barcode frame ke andar rakho — auto detect hoga
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 bg-danger/20 border border-danger/40 text-danger text-sm px-5 py-3 rounded-xl text-center max-w-sm">
          {error}
        </div>
      )}

      <style>{`
        @keyframes scanline {
          0%   { top: 10%; opacity: 1; }
          50%  { top: 85%; opacity: 0.6; }
          100% { top: 10%; opacity: 1; }
        }
        #qr-scanner-region video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 16px;
        }
        #qr-scanner-region img { display: none !important; }
      `}</style>
    </div>
  );
};

export default Scanner;











