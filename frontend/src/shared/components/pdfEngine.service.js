import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

/**
 * ============================================================================
 *  PDF engine — converts a DOM element into a pixel-perfect PDF.
 *  Uses html2canvas-pro (drop-in fork of html2canvas with oklch/oklab/
 *  color-mix/lab/lch support), so no CSS/color patching is needed anymore.
 * ============================================================================
 */

/**
 * Resolves the target DOM node from an id string, a ref object, or a
 * direct HTMLElement.
 */
function resolveElement(target) {
    if (target instanceof HTMLElement) return target;

    if (target && typeof target === "object" && "current" in target) {
        if (!target.current) {
            throw new Error("[pdfEngine] The ref you passed has no `current` element (is it mounted yet?).");
        }
        return target.current;
    }

    if (typeof target === "string") {
        const el = document.getElementById(target);
        if (!el) {
            throw new Error(`[pdfEngine] No element found with id "${target}".`);
        }
        return el;
    }

    throw new Error("[pdfEngine] Invalid target. Pass an element id, a ref, or an HTMLElement.");
}

/**
 * Temporarily strips scroll clipping / transforms that can cause
 * html2canvas to crop or misalign the captured image, then restores them.
 * Also resolves CSS variables to ensure cross-platform compatibility.
 */
async function withCleanCapture(el, callback) {
    const original = {
        overflow: el.style.overflow,
        height: el.style.height,
        maxHeight: el.style.maxHeight,
        transform: el.style.transform,
        width: el.style.width,
        minWidth: el.style.minWidth,
        maxWidth: el.style.maxWidth,
        boxSizing: el.style.boxSizing,
    };

    el.style.overflow = "visible";
    el.style.maxHeight = "none";
    el.style.height = "auto";
    el.style.transform = "none";
    el.style.width = "794px";
    el.style.minWidth = "794px";
    el.style.maxWidth = "794px";
    el.style.boxSizing = "border-box";

    // Resolve CSS variables for cross-platform compatibility
    const computedStyle = getComputedStyle(document.documentElement);
    const cssVars = {
        '--ink': computedStyle.getPropertyValue('--ink').trim() || '#1f1a17',
        '--surface': computedStyle.getPropertyValue('--surface').trim() || '#ffffff',
        '--surface-muted': computedStyle.getPropertyValue('--surface-muted').trim() || '#f7efe3',
        '--muted': computedStyle.getPropertyValue('--muted').trim() || '#6d5d52',
        '--accent': computedStyle.getPropertyValue('--accent').trim() || '#b45309',
        '--accent-2': computedStyle.getPropertyValue('--accent-2').trim() || '#0f766e',
        '--border': computedStyle.getPropertyValue('--border').trim() || '#e5e7eb',
    };

    // Apply resolved values as inline styles to the root element
    el.style.setProperty('--ink', cssVars['--ink'], 'important');
    el.style.setProperty('--surface', cssVars['--surface'], 'important');
    el.style.setProperty('--surface-muted', cssVars['--surface-muted'], 'important');
    el.style.setProperty('--muted', cssVars['--muted'], 'important');
    el.style.setProperty('--accent', cssVars['--accent'], 'important');
    el.style.setProperty('--accent-2', cssVars['--accent-2'], 'important');
    el.style.setProperty('--border', cssVars['--border'], 'important');

    // Replace CSS variables with actual colors in all descendant elements
    const elementsWithCssVars = el.querySelectorAll('*');
    const colorReplacements = [];

    elementsWithCssVars.forEach((element) => {
        const computed = getComputedStyle(element);
        const originalStyles = {
            color: element.style.color,
            backgroundColor: element.style.backgroundColor,
            borderColor: element.style.borderColor,
        };

        // Store for restoration
        colorReplacements.push({ element, originalStyles });

        // Apply computed colors as inline styles
        if (computed.color && computed.color !== 'rgba(0, 0, 0, 0)') {
            element.style.color = computed.color;
        }
        if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            element.style.backgroundColor = computed.backgroundColor;
        }
        if (computed.borderColor && computed.borderColor !== 'rgba(0, 0, 0, 0)') {
            element.style.borderColor = computed.borderColor;
        }
    });

    try {
        return await callback();
    } finally {
        el.style.overflow = original.overflow;
        el.style.height = original.height;
        el.style.maxHeight = original.maxHeight;
        el.style.transform = original.transform;
        el.style.width = original.width;
        el.style.minWidth = original.minWidth;
        el.style.maxWidth = original.maxWidth;
        el.style.boxSizing = original.boxSizing;
        
        // Remove inline CSS variable overrides from root
        el.style.removeProperty('--ink');
        el.style.removeProperty('--surface');
        el.style.removeProperty('--surface-muted');
        el.style.removeProperty('--muted');
        el.style.removeProperty('--accent');
        el.style.removeProperty('--accent-2');
        el.style.removeProperty('--border');

        // Restore original inline styles
        colorReplacements.forEach(({ element, originalStyles }) => {
            element.style.color = originalStyles.color;
            element.style.backgroundColor = originalStyles.backgroundColor;
            element.style.borderColor = originalStyles.borderColor;
        });
    }
}

async function waitForCaptureAssets(element) {
    // Wait for fonts with extended timeout for cross-platform compatibility
    if (document.fonts?.ready) {
        try {
            // Force font loading check
            await document.fonts.load('12px Arial');
            await document.fonts.load('12px sans-serif');
            
            await Promise.race([
                document.fonts.ready,
                new Promise(resolve => setTimeout(resolve, 3000)) // 3s timeout
            ]);
        } catch (e) {
            console.warn('Font loading timeout, proceeding anyway');
        }
    }

    // Extended delay for font rendering across different systems
    await new Promise(resolve => setTimeout(resolve, 500));

    const images = Array.from(element.querySelectorAll("img"));
    await Promise.all(images.map(async (image) => {
        if (!image.complete) {
            await new Promise((resolve) => {
                image.addEventListener("load", resolve, { once: true });
                image.addEventListener("error", resolve, { once: true });
                setTimeout(resolve, 3000); // 3s timeout for images
            });
        }

        if (image.decode) {
            try {
                await image.decode();
            } catch {
                // A failed image should not block PDF generation.
            }
        }
    }));

    // Multiple RAF calls for stable rendering across browsers and systems
    await new Promise((resolve) => 
        requestAnimationFrame(() => 
            requestAnimationFrame(() => 
                requestAnimationFrame(() => 
                    requestAnimationFrame(resolve)
                )
            )
        )
    );
}

/**
 * Converts a DOM element into a pixel-perfect, zero-margin PDF and
 * triggers a download. Supports multi-page output for long content.
 *
 * @param {HTMLElement|string|React.RefObject} target - Element to capture
 * @param {Object} options
 * @param {string} options.fileName - Name of the downloaded PDF file
 * @param {number} options.scale - Resolution multiplier (e.g., 2 for retina)
 * @param {string} options.backgroundColor - Background color for the PDF
 * @param {boolean} options.multiPage - Whether to split content across multiple pages
 * @param {boolean} options.download - Whether to auto-download the PDF
 * @param {number} options.pdfScale - Scale factor for PDF dimensions (default: 1)
 * @param {boolean} options.useCORS - Whether to use CORS for images
 * @param {boolean} options.logging - Whether to enable html2canvas logging
 * @returns {Promise<{pdf: jsPDF; canvas: HTMLCanvasElement}>}
 */
export async function generatePdfFromElement(target, options = {}) {
    const {
        fileName = "document.pdf",
        scale = 2,
        backgroundColor = "#ffffff",
        multiPage = false,
        download = true,
        pdfScale = 1,
        useCORS = true,
        logging = false,
    } = options;

    const element = resolveElement(target);

    await waitForCaptureAssets(element);

    let canvas, pdf;

    await withCleanCapture(element, async () => {
        canvas = await html2canvas(element, {
            scale,
            backgroundColor,
            useCORS,
            logging,
            allowTaint: true,
            imageTimeout: 15000,
            removeContainer: true,
        });
    });

    const imgData = canvas.toDataURL("image/png", 1.0);
    const canvasWidthPx = canvas.width;
    const canvasHeightPx = canvas.height;

    // Calculate PDF dimensions based on options
    const effectivePdfScale = pdfScale || 1;
    const pxToMm = 0.264583; // 96 DPI
    const pdfWidthMm = (canvasWidthPx * pxToMm) * effectivePdfScale;
    const pdfHeightMm = (canvasHeightPx * pxToMm) * effectivePdfScale;

    if (!multiPage) {
        pdf = new jsPDF({
            orientation: pdfWidthMm > pdfHeightMm ? "landscape" : "portrait",
            unit: "mm",
            format: [pdfWidthMm, pdfHeightMm],
        });
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidthMm, pdfHeightMm, undefined, "FAST");
    } else {
        const A4_WIDTH_MM = 210;
        const A4_HEIGHT_MM = 297;

        const scaledHeightMm = (canvasHeightPx * A4_WIDTH_MM) / canvasWidthPx;

        pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        if (scaledHeightMm <= A4_HEIGHT_MM) {
            pdf.addImage(imgData, "PNG", 0, 0, A4_WIDTH_MM, scaledHeightMm, undefined, "FAST");
        } else {
            const pageHeightPx = (A4_HEIGHT_MM * canvasWidthPx) / A4_WIDTH_MM;
            let renderedHeightPx = 0;
            let pageIndex = 0;

            const sliceCanvas = document.createElement("canvas");
            const sliceCtx = sliceCanvas.getContext("2d");
            sliceCanvas.width = canvasWidthPx;

            while (renderedHeightPx < canvasHeightPx) {
                const remaining = canvasHeightPx - renderedHeightPx;
                const thisSliceHeightPx = Math.min(pageHeightPx, remaining);

                sliceCanvas.height = thisSliceHeightPx;
                sliceCtx.clearRect(0, 0, sliceCanvas.width, sliceCanvas.height);
                sliceCtx.drawImage(
                    canvas,
                    0, renderedHeightPx, canvasWidthPx, thisSliceHeightPx,
                    0, 0, canvasWidthPx, thisSliceHeightPx
                );

                const sliceImgData = sliceCanvas.toDataURL("image/png", 1.0);
                const sliceHeightMm = (thisSliceHeightPx * A4_WIDTH_MM) / canvasWidthPx;

                if (pageIndex > 0) pdf.addPage();
                pdf.addImage(sliceImgData, "PNG", 0, 0, A4_WIDTH_MM, sliceHeightMm, undefined, "FAST");

                renderedHeightPx += thisSliceHeightPx;
                pageIndex += 1;
            }
        }
    }

    if (download) {
        pdf.save(fileName);
    }

    return { pdf, canvas };
}
