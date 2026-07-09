/**
 * ============================================================================
 *  pdfEngine.js
 * ----------------------------------------------------------------------------
 *  A single, reusable engine to convert ANY DOM element (by id or ref) into
 *  a pixel-perfect PDF — same layout, same colors, same spacing, no extra
 *  margins, no gaps, no scaling distortion.
 *
 *  Dependencies (load these once in your app, via CDN or npm):
 *    - html2canvas   (DOM -> canvas screenshot, respects real computed styles)
 *    - jsPDF          (canvas -> PDF)
 *
 *  CDN (add in index.html, before your bundle):
 *    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
 *    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
 *
 *  OR via npm:
 *    npm install html2canvas jspdf
 *    import html2canvas from "html2canvas";
 *    import { jsPDF } from "jspdf";
 *
 * ============================================================================
 */

/* If using npm/ES modules, uncomment these two lines and remove the
   "window.html2canvas" / "window.jspdf" fallback lookup below.
-------------------------------------------------------------------
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
------------------------------------------------------------------- */

/**
 * Resolves the target DOM node from an id string, a ref object, or a
 * direct HTMLElement — so the function is flexible no matter how you call it.
 *
 * @param {string|HTMLElement|{current: HTMLElement}} target
 * @returns {HTMLElement}
 */
function resolveElement(target) {
    // Case 1: already a DOM element
    if (target instanceof HTMLElement) return target;

    // Case 2: React-style ref object { current: HTMLElement }
    if (target && typeof target === "object" && "current" in target) {
        if (!target.current) {
            throw new Error("[pdfEngine] The ref you passed has no `current` element (is it mounted yet?).");
        }
        return target.current;
    }

    // Case 3: an element id string
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
 * Locates the html2canvas and jsPDF constructors regardless of whether
 * they were loaded via <script> tag (global window) or npm import.
 */
function resolveLibs() {
    const html2canvasFn =
        typeof html2canvas !== "undefined"
            ? html2canvas
            : window.html2canvas;

    const jsPDFCtor =
        typeof jsPDF !== "undefined"
            ? jsPDF
            : window.jspdf && window.jspdf.jsPDF;

    if (!html2canvasFn) {
        throw new Error(
            "[pdfEngine] html2canvas not found. Include it via CDN/npm before calling generatePdfFromElement()."
        );
    }
    if (!jsPDFCtor) {
        throw new Error(
            "[pdfEngine] jsPDF not found. Include it via CDN/npm before calling generatePdfFromElement()."
        );
    }
    return { html2canvasFn, jsPDFCtor };
}

/**
 * Temporarily strips scroll clipping / transforms that can cause
 * html2canvas to crop or misalign the captured image, then restores them.
 */
function withCleanCapture(el, callback) {
    const original = {
        overflow: el.style.overflow,
        height: el.style.height,
        maxHeight: el.style.maxHeight,
        transform: el.style.transform,
    };

    // Force full natural size so nothing is clipped by internal scrollbars.
    el.style.overflow = "visible";
    el.style.maxHeight = "none";
    el.style.height = "auto";
    el.style.transform = "none";

    try {
        return callback();
    } finally {
        el.style.overflow = original.overflow;
        el.style.height = original.height;
        el.style.maxHeight = original.maxHeight;
        el.style.transform = original.transform;
    }
}

/**
 * =====================  MAIN ENGINE FUNCTION  =============================
 * Converts a DOM element into a pixel-perfect, zero-margin PDF and
 * triggers a download (or returns the PDF instance).
 *
 * @param {string|HTMLElement|{current:HTMLElement}} target
 *        The element id, ref, or HTMLElement to capture.
 *
 * @param {Object}   [options]
 * @param {string}   [options.fileName="document.pdf"]  Output file name.
 * @param {number}   [options.scale=3]                  Render resolution multiplier
 *                                                       (higher = sharper text/images,
 *                                                       3-4 is print-quality).
 * @param {string}   [options.backgroundColor="#ffffff"] Fallback bg color
 *                                                        (use null to keep transparent).
 * @param {boolean}  [options.multiPage=true]           If the content is taller
 *                                                       than one page, split across
 *                                                       multiple PDF pages instead
 *                                                       of squashing it.
 * @param {boolean}  [options.download=true]            Auto-trigger the file download.
 *                                                       Set false if you want the
 *                                                       jsPDF instance back instead
 *                                                       (e.g. to upload it).
 *
 * @returns {Promise<import("jspdf").jsPDF>} the generated jsPDF instance
 */
export async function generatePdfFromElement(target, options = {}) {
    const {
        fileName = "document.pdf",
        scale = 3,
        backgroundColor = "#ffffff",
        multiPage = true,
        download = true,
    } = options;

    const { html2canvasFn, jsPDFCtor } = resolveLibs();
    const element = resolveElement(target);

    // 1. Take a high-resolution screenshot of the element exactly as rendered.
    const canvas = await withCleanCapture(element, () =>
        html2canvasFn(element, {
            scale,                     // resolution multiplier -> crisp output
            useCORS: true,              // allow cross-origin images (logos, etc.)
            backgroundColor,            // avoid black bg on transparent elements
            logging: false,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
        })
    );

    const canvasWidthPx = canvas.width;
    const canvasHeightPx = canvas.height;

    // 2. Convert canvas pixel size -> mm (jsPDF works in mm by default).
    //    96 CSS px = 1 inch = 25.4 mm  → but our canvas is scaled by `scale`,
    //    so we divide by scale first to get back to real CSS pixels.
    const pxToMm = (px) => (px / scale) * (25.4 / 96);

    const pdfWidthMm = pxToMm(canvasWidthPx);
    const pdfHeightMm = pxToMm(canvasHeightPx);

    const imgData = canvas.toDataURL("image/png", 1.0);

    // 3. Build the PDF.
    let pdf;

    if (!multiPage) {
        // -------- Single page, page size == content size (zero margin) --------
        pdf = new jsPDFCtor({
            orientation: pdfWidthMm > pdfHeightMm ? "landscape" : "portrait",
            unit: "mm",
            format: [pdfWidthMm, pdfHeightMm],
        });
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidthMm, pdfHeightMm, undefined, "FAST");
    } else {
        // -------- Multi page: standard A4 width, sliced height, no gaps --------
        const A4_WIDTH_MM = 210;
        const A4_HEIGHT_MM = 297;

        // Scale the captured image to fit A4 width exactly, keep aspect ratio.
        const scaledHeightMm = (canvasHeightPx * A4_WIDTH_MM) / canvasWidthPx;

        pdf = new jsPDFCtor({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        if (scaledHeightMm <= A4_HEIGHT_MM) {
            // Fits on a single A4 page.
            pdf.addImage(imgData, "PNG", 0, 0, A4_WIDTH_MM, scaledHeightMm, undefined, "FAST");
        } else {
            // Slice the tall canvas into A4-height chunks, page by page,
            // using the *source canvas* (pixel-accurate slicing) instead of
            // just moving a negative Y offset — this avoids blurry/misaligned pages.
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
                    0, renderedHeightPx, canvasWidthPx, thisSliceHeightPx, // source rect
                    0, 0, canvasWidthPx, thisSliceHeightPx                  // dest rect
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

    // 4. Output.
    if (download) {
        pdf.save(fileName);
    }

    return pdf;
}

/* ----------------------------------------------------------------------
   Optional: expose on window for plain <script> usage (non-module HTML)
---------------------------------------------------------------------- */
if (typeof window !== "undefined") {
    window.generatePdfFromElement = generatePdfFromElement;
}