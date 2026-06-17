/**
 * ================================================================
 * ImageCropper.jsx
 * Package: react-easy-crop
 * ================================================================
 *
 * Install:
 *   npm install react-easy-crop
 *
 * CSS ki zaroorat NAHI — react-easy-crop apni styles khud inject
 * karta hai automatically (disableAutomaticStylesInjection na lagao)
 *
 * ── react-easy-crop ka flow samjho ────────────────────────────
 *
 *   1. <Cropper> component image dikhata hai + drag/zoom UI deta hai
 *
 *   2. User jab image move/zoom kare toh:
 *        onCropChange(crop)   → crop = { x, y } position update
 *        onZoomChange(zoom)   → zoom number update
 *
 *   3. Jab user ruke (interaction complete) toh:
 *        onCropComplete(croppedArea, croppedAreaPixels)
 *        croppedAreaPixels = { x, y, width, height } — yeh save karo
 *
 *   4. Confirm pe:
 *        croppedAreaPixels use karke canvas pe actual crop draw karo
 *        canvas → Blob → File → onChange ko do
 *
 * ── Props ──────────────────────────────────────────────────────
 *  accept        string     "image/*" default
 *  multiple      bool       multiple images allow karo
 *  disabled      bool       poora component disable
 *  name          string     form field name
 *  value         File[]     controlled mode ke liye
 *  onChange      fn         (File[]) => void
 *  aspectRatio   number     1=square, 16/9, 4/3, undefined=free
 *  cropShape     string     'rect' ya 'round' (default: 'rect')
 *  showGrid      bool       crop box ke andar grid (default: true)
 *  modalWidth    number     modal width px (default: 680)
 *  modalHeight   number     cropper area height px (default: 460)
 *  showPreview   bool       cropped thumbnails dikhao (default: true)
 *  previewSize   number     thumbnail size px (default: 80)
 *  children      ReactNode  custom trigger UI
 *
 * ── Editing Tools ──────────────────────────────────────────────
 *  Zoom slider   — smooth zoom control
 *  Rotate slider — -180° to +180°
 *  Flip H / V    — mirror karo
 *  Reset         — sab wapas default pe
 *
 * ── Usage ──────────────────────────────────────────────────────
 *
 *  // Simple
 *  <ImageCropper onChange={(files) => } />
 *
 *  // Square crop (profile pic jaisa)
 *  <ImageCropper aspectRatio={1} onChange={setFile} />
 *
 *  // Round crop area
 *  <ImageCropper aspectRatio={1} cropShape="round" onChange={setFile} />
 *
 *  // Custom trigger (tera existing upload UI andar dal do)
 *  <ImageCropper onChange={handleFileChange} showPreview={false}>
 *    <div className="upload-box">Upload Photo</div>
 *  </ImageCropper>
 *
 *  // Bari window
 *  <ImageCropper modalWidth={900} modalHeight={600} onChange={setFile} />
 *
 *  // Controlled mode
 *  <ImageCropper value={myFiles} onChange={setMyFiles} />
 */

import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';

// ──────────────────────────────────────────────────────────────────────────────
// HELPER: File → dataURL string
// react-easy-crop ko image prop mein URL ya dataURL chahiye hoti hai
// ──────────────────────────────────────────────────────────────────────────────
const convertFileToDataURL = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });


// ──────────────────────────────────────────────────────────────────────────────
// HELPER: Canvas pe actual crop draw karo aur File banao
//
// react-easy-crop sirf coordinates deta hai (croppedAreaPixels)
// asli cropping hum khud canvas pe karte hain — yeh standard approach hai
//
// Parameters:
//   imageSrc         — dataURL string
//   croppedAreaPixels — { x, y, width, height } jo onCropComplete se mila
//   rotation         — degrees mein (0 default)
//   flipHorizontal   — bool
//   flipVertical     — bool
//   originalName     — File ka naam + extension ke liye
// ──────────────────────────────────────────────────────────────────────────────
const generateCroppedFile = async (
    imageSrc,
    croppedAreaPixels,
    rotation = 0,
    flipHorizontal = false,
    flipVertical = false,
    originalName = 'cropped.jpg'
) => {
    // Step 1: dataURL se Image object banao
    const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = imageSrc;
    });

    // Step 2: canvas banao
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Step 3: rotation ke liye bounding box calculate karo
    // rotation ho toh canvas ka size bhi badalna padta hai
    const rotationRad = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rotationRad));
    const cos = Math.abs(Math.cos(rotationRad));

    // rotated image ka actual bounding box
    const rotatedWidth = image.width * cos + image.height * sin;
    const rotatedHeight = image.width * sin + image.height * cos;

    // canvas ka size crop area ke barabar rakho (final output)
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    // Step 4: transforms apply karo — sequence important hai
    ctx.save();

    // Crop area ke center pe translate karo
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Flip apply karo agar ho toh
    ctx.scale(
        flipHorizontal ? -1 : 1,
        flipVertical ? -1 : 1
    );

    // Rotation apply karo
    ctx.rotate(rotationRad);

    // Image draw karo — origin center pe hai isliye offsets negative hain
    ctx.drawImage(
        image,
        // Source: original image mein se crop area
        croppedAreaPixels.x - (rotatedWidth - image.width) / 2,
        croppedAreaPixels.y - (rotatedHeight - image.height) / 2,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        // Destination: canvas pe center se
        -croppedAreaPixels.width / 2,
        -croppedAreaPixels.height / 2,
        croppedAreaPixels.width,
        croppedAreaPixels.height
    );

    ctx.restore();

    // Step 5: canvas → Blob → File
    const ext = originalName?.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (!blob) return resolve(null);
            const croppedFile = new File([blob], originalName, { type: mimeType });
            resolve(croppedFile);
        }, mimeType, 0.92); // 92% quality
    });
};


// ──────────────────────────────────────────────────────────────────────────────
// COMPONENT: CropModal
// Ek image ka crop + editing modal
//
// Props:
//   imageSrc      — dataURL string
//   aspectRatio   — number ya undefined (free crop)
//   cropShape     — 'rect' | 'round'
//   showGrid      — bool
//   modalWidth    — modal ki width
//   modalHeight   — cropper area ki height
//   onCropDone    — (File) => void
//   onCropCancel  — () => void
//   originalName  — file ka naam
// ──────────────────────────────────────────────────────────────────────────────
const CropModal = ({
    imageSrc,
    aspectRatio,
    cropShape,
    showGrid,
    modalWidth,
    modalHeight,
    onCropDone,
    onCropCancel,
    originalName,
}) => {

    // ── react-easy-crop ke liye zaruri state ──────────────────────────────

    // crop: image ki position { x, y } — Cropper component update karta rehta hai
    const [crop, setCrop] = useState({ x: 0, y: 0 });

    // zoom: 1 = normal, 3 = max — scroll ya slider se change hota hai
    const [zoom, setZoom] = useState(1);

    // rotation: degrees — slider se control hogi
    const [rotation, setRotation] = useState(0);

    // flip state — horizontal aur vertical alag alag track karo
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);

    // croppedAreaPixels: onCropComplete se aata hai
    // yahi actual coordinates hain jo canvas draw mein use honge
    // structure: { x, y, width, height }
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);


    // ── onCropComplete callback ───────────────────────────────────────────
    // react-easy-crop yeh tab call karta hai jab user interaction band kare
    // croppedArea      = percentage mein (0-100)
    // croppedAreaPixels = actual pixels mein — yeh use karenge
    const handleCropComplete = useCallback((croppedArea, croppedAreaPx) => {
        setCroppedAreaPixels(croppedAreaPx);
    }, []);


    // ── Reset: sab values wapas default pe ───────────────────────────────
    const handleReset = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
    };


    // ── Confirm: canvas pe crop draw karo aur File return karo ───────────
    const handleConfirmCrop = useCallback(async () => {
        if (!croppedAreaPixels) return;

        const croppedFile = await generateCroppedFile(
            imageSrc,
            croppedAreaPixels,
            rotation,
            flipH,
            flipV,
            originalName
        );

        if (croppedFile) onCropDone(croppedFile);
    }, [imageSrc, croppedAreaPixels, rotation, flipH, flipV, originalName, onCropDone]);


    // ── Reusable Tool Button ──────────────────────────────────────────────
    const ToolBtn = ({ onClick, icon, label, active = false, danger = false }) => (
        <button
            type="button"
            onClick={onClick}
            title={label}
            className={`
                flex flex-col items-center gap-1 px-3 py-2 rounded-xl
                text-[10px] font-black uppercase tracking-wider transition-all
                ${active ? 'bg-cyan-100 text-cyan-600' : ''}
                ${danger ? 'text-rose-400 hover:bg-rose-50 hover:text-rose-600' : ''}
                ${!active && !danger ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-700' : ''}
            `}
        >
            <i className={`${icon} text-base`} />
            {label}
        </button>
    );

    // ── Slider — zoom aur rotation ke liye reusable ───────────────────────
    const SliderControl = ({ label, value, min, max, step, onChange, displayValue }) => (
        <div className="flex items-center gap-3 flex-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider w-14 flex-shrink-0">
                {label}
            </span>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="flex-1 accent-cyan-500 h-1"
            />
            <span className="text-[11px] font-black text-slate-500 w-10 text-right flex-shrink-0">
                {displayValue}
            </span>
        </div>
    );


    return (
        // ── Backdrop ──────────────────────────────────────────────────────
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">

            {/* ── Modal — width prop se control hoti hai ─────────────────── */}
            <div
                className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                style={{ width: modalWidth, maxWidth: '95vw', maxHeight: '95vh' }}
            >

                {/* ── Header ────────────────────────────────────────────── */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                            Crop & Edit
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate max-w-xs">
                            {originalName}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onCropCancel}
                        className="p-2 rounded-xl hover:bg-slate-100 transition-all group"
                    >
                        <i className="ri-close-line text-lg text-slate-400 group-hover:text-red-500" />
                    </button>
                </div>

                {/* ── Cropper Area ──────────────────────────────────────────
                    IMPORTANT: react-easy-crop ko position:relative parent chahiye
                    height prop se yahan se window ka cropper area badata hai
                ──────────────────────────────────────────────────────────── */}
                <div
                    className="relative bg-slate-900 flex-shrink-0"
                    style={{ height: modalHeight }}
                >
                    <Cropper
                        image={imageSrc}

                        // ── Position + Zoom ─────────────────────────────
                        // crop state: image ki { x, y } position
                        crop={crop}
                        onCropChange={setCrop}

                        // zoom state: 1=normal, minZoom=1, maxZoom=3
                        zoom={zoom}
                        minZoom={1}
                        maxZoom={3}
                        zoomSpeed={0.1}
                        onZoomChange={setZoom}
                        zoomWithScroll={true} // scroll se zoom ho

                        // ── Rotation ─────────────────────────────────────
                        // rotation degrees mein — slider se control karenge
                        rotation={rotation}
                        onRotationChange={setRotation}

                        // ── Crop Area Settings ────────────────────────────
                        // aspect undefined ho toh free crop, number ho toh fixed ratio
                        aspect={aspectRatio}

                        // 'rect' ya 'round' — round avatar ke liye use karo
                        cropShape={cropShape}

                        // crop box ke andar grid lines
                        showGrid={showGrid}

                        // ── Flip via transform prop ───────────────────────
                        // react-easy-crop mein built-in flip nahi hai
                        // transform prop se CSS transform manually override karte hain
                        // default transform hai: translate(x, y) rotate(deg) scale(zoom)
                        // hum usme scaleX/scaleY add karte hain flip ke liye
                        transform={`
                            translate(${crop.x}px, ${crop.y}px)
                            rotate(${rotation}deg)
                            scale(${zoom})
                            scaleX(${flipH ? -1 : 1})
                            scaleY(${flipV ? -1 : 1})
                        `}

                        // ── Callback ──────────────────────────────────────
                        // jab user interaction band kare — croppedAreaPixels milta hai
                        onCropComplete={handleCropComplete}

                        // ── Styling ───────────────────────────────────────
                        classes={{
                            containerClassName: 'rounded-none',
                            cropAreaClassName: 'border-2 border-white/70',
                        }}
                    />
                </div>

                {/* ── Controls ──────────────────────────────────────────── */}
                <div className="flex-shrink-0 bg-slate-50 border-t border-slate-100">

                    {/* Sliders: Zoom + Rotation */}
                    <div className="px-6 py-3 flex flex-col gap-2 border-b border-slate-100">
                        <SliderControl
                            label="Zoom"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.01}
                            onChange={setZoom}
                            displayValue={`${zoom.toFixed(1)}x`}
                        />
                        <SliderControl
                            label="Rotate"
                            value={rotation}
                            min={-180}
                            max={180}
                            step={1}
                            onChange={setRotation}
                            displayValue={`${rotation}°`}
                        />
                    </div>

                    {/* Editing Toolbar */}
                    <div className="px-4 py-2 flex items-center gap-1 flex-wrap">

                        {/* Flip Horizontal */}
                        <ToolBtn
                            onClick={() => setFlipH(prev => !prev)}
                            icon="ri-flip-horizontal-line"
                            label="Flip H"
                            active={flipH}
                        />

                        {/* Flip Vertical */}
                        <ToolBtn
                            onClick={() => setFlipV(prev => !prev)}
                            icon="ri-flip-vertical-line"
                            label="Flip V"
                            active={flipV}
                        />

                        {/* Divider */}
                        <div className="w-px h-8 bg-slate-200 mx-1" />

                        {/* Rotate -90 quick button */}
                        <ToolBtn
                            onClick={() => setRotation(prev => prev - 90)}
                            icon="ri-anticlockwise-2-line"
                            label="Rotate L"
                        />

                        {/* Rotate +90 quick button */}
                        <ToolBtn
                            onClick={() => setRotation(prev => prev + 90)}
                            icon="ri-clockwise-2-line"
                            label="Rotate R"
                        />

                        {/* Divider */}
                        <div className="w-px h-8 bg-slate-200 mx-1" />

                        {/* Reset — sab wapas default */}
                        <ToolBtn
                            onClick={handleReset}
                            icon="ri-refresh-line"
                            label="Reset"
                            danger
                        />
                    </div>
                </div>

                {/* ── Footer ────────────────────────────────────────────── */}
                <div className="px-6 py-4 flex gap-3 justify-end flex-shrink-0 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onCropCancel}
                        className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmCrop}
                        className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white bg-slate-900 hover:bg-cyan-600 rounded-xl transition-all flex items-center gap-2"
                    >
                        <i className="ri-check-line text-sm" />
                        Confirm Crop
                    </button>
                </div>

            </div>
        </div>
    );
};


// ──────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT: ImageCropper
// <input type="file"> ki jagah use karo — cropper ki power ke saath
// ──────────────────────────────────────────────────────────────────────────────
const ImageCropper = ({
    // ── Normal input props ──────────────────────────────────────────────
    name,
    id,
    accept = 'image/*',
    disabled = false,
    required = false,
    multiple = false,
    className = '',
    style = {},

    // ── Controlled mode ─────────────────────────────────────────────────
    // value pass karo toh controlled, warna internal state se chalta hai
    value,
    onChange,   // (File[]) => void

    // ── Cropper options ─────────────────────────────────────────────────
    aspectRatio,            // 1, 16/9, 4/3 etc. — undefined = free crop
    cropShape = 'rect',   // 'rect' | 'round'
    showGrid = true,     // crop box mein grid lines

    // ── Modal size ───────────────────────────────────────────────────────
    modalWidth = 680,      // ← MODAL WIDTH YAHAN BADLO (px)
    modalHeight = 460,      // ← CROPPER AREA HEIGHT YAHAN BADLO (px)

    // ── UI ───────────────────────────────────────────────────────────────
    children,               // custom trigger — agar pass kiya toh default button nahi
    showPreview = true,     // cropped thumbnails dikhao
    previewSize = 80,       // thumbnail size px
}) => {

    // Hidden file input ka ref — programmatically click karne ke liye
    const hiddenInputRef = useRef(null);

    // ── Crop Queue ────────────────────────────────────────────────────────
    // Multiple mode mein ek ek image crop hoti hai queue se
    // har item: { dataURL: string, originalFile: File }
    const [cropQueue, setCropQueue] = useState([]);
    const [currentQueueIndex, setCurrentQueueIndex] = useState(0);

    // Uncontrolled mode ke liye internal files state
    const [internalFiles, setInternalFiles] = useState([]);

    // ── Controlled vs Uncontrolled ────────────────────────────────────────
    const isControlledMode = value !== undefined;
    const displayFiles = isControlledMode ? (value || []) : internalFiles;


    // ── File input change ─────────────────────────────────────────────────
    // Jab user native file picker se files choose kare
    const handleNativeInputChange = useCallback(async (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (!selectedFiles.length) return;

        // Har file ko dataURL mein convert karo — CropModal ko src chahiye
        const queueItems = await Promise.all(
            selectedFiles.map(async (file) => ({
                dataURL: await convertFileToDataURL(file),
                originalFile: file,
            }))
        );

        setCropQueue(queueItems);
        setCurrentQueueIndex(0);

        // Input reset — same file dobara select ho sake
        e.target.value = '';
    }, []);


    // ── Ek image crop ho gayi ─────────────────────────────────────────────
    const handleSingleCropDone = useCallback((croppedFile) => {
        const isLastImage = currentQueueIndex >= cropQueue.length - 1;

        // multiple mode mein add karo, single mein replace karo
        const updatedFiles = multiple
            ? [...displayFiles, croppedFile]
            : [croppedFile];

        // Parent ko do
        onChange?.(updatedFiles);

        // Uncontrolled mode mein internal state update karo
        if (!isControlledMode) setInternalFiles(updatedFiles);

        if (isLastImage) {
            // Queue khatam — modal band
            setCropQueue([]);
            setCurrentQueueIndex(0);
        } else {
            // Agli image crop karo
            setCurrentQueueIndex(prev => prev + 1);
        }
    }, [currentQueueIndex, cropQueue, displayFiles, multiple, onChange, isControlledMode]);


    // ── Cancel — puri queue discard ───────────────────────────────────────
    const handleCropCancel = useCallback(() => {
        setCropQueue([]);
        setCurrentQueueIndex(0);
    }, []);


    // ── Preview se file hata do ───────────────────────────────────────────
    const handleRemovePreviewFile = useCallback((removeIndex) => {
        const updatedFiles = displayFiles.filter((_, i) => i !== removeIndex);
        onChange?.(updatedFiles);
        if (!isControlledMode) setInternalFiles(updatedFiles);
    }, [displayFiles, onChange, isControlledMode]);


    // ── Native file picker kholo ──────────────────────────────────────────
    const triggerFilePicker = useCallback(() => {
        if (!disabled) hiddenInputRef.current?.click();
    }, [disabled]);


    const shouldShowCropModal = cropQueue.length > 0 && currentQueueIndex < cropQueue.length;
    const currentCropItem = shouldShowCropModal ? cropQueue[currentQueueIndex] : null;


    return (
        <>
            {/* ── Hidden native file input ─────────────────────────────────
                Yeh actual input hai — user ko nahi dikhta
                FormData mein manually append karna hoga:
                    files.forEach(f => formData.append('photo', f))
            ──────────────────────────────────────────────────────────────── */}
            <input
                ref={hiddenInputRef}
                type="file"
                name={name}
                id={id}
                accept={accept}
                multiple={multiple}
                disabled={disabled}
                required={required && displayFiles.length === 0}
                style={{ display: 'none' }}
                onChange={handleNativeInputChange}
            />

            <div className={className} style={style}>

                {/* ── Trigger UI ───────────────────────────────────────────
                    children pass kiya → tera custom UI click se picker khulega
                    nahi kiya → default dashed button dikhega
                ──────────────────────────────────────────────────────────── */}
                {children ? (
                    <div
                        onClick={triggerFilePicker}
                        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                    >
                        {children}
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={triggerFilePicker}
                        disabled={disabled}
                        className={`
                            flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-dashed
                            text-xs font-black uppercase tracking-widest transition-all
                            ${disabled
                                ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                                : 'border-slate-300 text-slate-500 hover:border-cyan-400 hover:text-cyan-600 hover:bg-cyan-50 cursor-pointer'
                            }
                        `}
                    >
                        <i className="ri-image-add-line text-base" />
                        {multiple ? 'Select Images' : 'Select Image'}
                    </button>
                )}

                {/* ── Preview thumbnails ────────────────────────────────────
                    showPreview={false} karo agar apna preview manage karna ho
                    (e.g. StudentCreate mein imagePreview state se karte ho)
                ──────────────────────────────────────────────────────────── */}
                {showPreview && displayFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">

                        {displayFiles.map((file, index) => (
                            <div
                                key={index}
                                className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm"
                                style={{ width: previewSize, height: previewSize }}
                            >
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={`preview-${index}`}
                                    className="w-full h-full object-cover"
                                />
                                {/* Hover pe delete overlay */}
                                <button
                                    type="button"
                                    onClick={() => handleRemovePreviewFile(index)}
                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                    <i className="ri-delete-bin-line text-white text-lg" />
                                </button>
                            </div>
                        ))}

                        {/* Multiple mode mein + button aur images add karne ke liye */}
                        {multiple && !disabled && (
                            <button
                                type="button"
                                onClick={triggerFilePicker}
                                style={{ width: previewSize, height: previewSize }}
                                className="rounded-xl border-2 border-dashed border-slate-300 hover:border-cyan-400 hover:bg-cyan-50 flex items-center justify-center transition-all text-slate-400 hover:text-cyan-500"
                            >
                                <i className="ri-add-line text-xl" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ── Crop Modal ───────────────────────────────────────────────
                Queue mein se current image yahan crop hoti hai
                Multiple mode mein ek ek karke sari images crop hoti hain
            ──────────────────────────────────────────────────────────────── */}
            {shouldShowCropModal && (
                <CropModal
                    imageSrc={currentCropItem.dataURL}
                    aspectRatio={aspectRatio}
                    cropShape={cropShape}
                    showGrid={showGrid}
                    modalWidth={modalWidth}
                    modalHeight={modalHeight}
                    onCropDone={handleSingleCropDone}
                    onCropCancel={handleCropCancel}
                    originalName={currentCropItem.originalFile.name}
                />
            )}
        </>
    );
};

export default ImageCropper;