/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import html2canvas, { Options } from "html2canvas";

// Ensure Intl.Segmenter is disabled before html2canvas is evaluated
// This prevents Chrome 128+ regression where words merge and punctuation overlaps
if (typeof window !== "undefined" && (window as any).Intl) {
  try {
    delete (window as any).Intl.Segmenter;
  } catch {
    (window as any).Intl.Segmenter = undefined;
  }
}

/**
 * Sanitize CSS string by replacing unsupported color functions (oklch, oklab, lab, lch, color-mix)
 * with standard RGB/RGBA values so html2canvas doesn't throw:
 * "Attempting to parse an unsupported color function 'oklab'"
 */
export function sanitizeCSS(css: string): string {
  if (!css) return "";

  let cleaned = css;

  // Replace modern CSS color spaces with safe RGB/RGBA
  cleaned = cleaned
    .replace(/oklch\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)/gi, "rgba(120, 120, 120, 1)")
    .replace(/oklab\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)/gi, "rgba(120, 120, 120, 1)")
    .replace(/color-mix\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)/gi, "rgba(120, 120, 120, 1)")
    .replace(/lab\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)/gi, "rgba(120, 120, 120, 1)")
    .replace(/lch\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)/gi, "rgba(120, 120, 120, 1)");

  // Double-pass simple replacement for any remaining stray color functions
  cleaned = cleaned
    .replace(/oklch\([^)]+\)/gi, "rgba(120, 120, 120, 1)")
    .replace(/oklab\([^)]+\)/gi, "rgba(120, 120, 120, 1)")
    .replace(/lab\([^)]+\)/gi, "rgba(120, 120, 120, 1)")
    .replace(/lch\([^)]+\)/gi, "rgba(120, 120, 120, 1)");

  return cleaned;
}

/**
 * Extract, sanitize, and return all active stylesheets currently loaded in the document
 */
export function getSanitizedDocumentStyles(): string {
  let combinedCSS = "";
  try {
    for (let i = 0; i < document.styleSheets.length; i++) {
      try {
        const sheet = document.styleSheets[i];
        const rules = sheet.cssRules || sheet.rules;
        if (rules) {
          for (let j = 0; j < rules.length; j++) {
            combinedCSS += rules[j].cssText + "\n";
          }
        }
      } catch (e) {
        // Skip cross-origin or restricted stylesheets
      }
    }
  } catch (err) {
    console.warn("Could not read document stylesheets:", err);
  }

  return sanitizeCSS(combinedCSS);
}

/**
 * Safe wrapper around html2canvas that:
 * 1. Disables Intl.Segmenter to prevent text squishing/merging and punctuation overlap in Chrome 128+
 * 2. Enforces consistent font metrics (Arial, Helvetica) with proper word spacing
 * 3. Removes outer card borders, rounded corners, and shadows so PDF has NO outer page border
 * 4. Prevents crashes from Tailwind v4's oklch/oklab color functions
 */
export async function safeHtml2Canvas(
  element: HTMLElement,
  options: Partial<Options> = {}
): Promise<HTMLCanvasElement> {
  // Wait for fonts to be completely ready before measuring and capturing
  if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font readiness errors
    }
  }

  // Ensure Intl.Segmenter is disabled on window
  const win = typeof window !== "undefined" ? (window as any) : null;
  if (win && win.Intl) {
    try {
      delete win.Intl.Segmenter;
    } catch {
      win.Intl.Segmenter = undefined;
    }
  }

  const cleanCSS = getSanitizedDocumentStyles();
  const userOnClone = options.onclone;

  const mergedOptions: Partial<Options> = {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    allowTaint: true,
    ...options,
    onclone: (clonedDoc, clonedElement) => {
      try {
        // A. Disable Intl.Segmenter in cloned iframe window
        if (clonedDoc.defaultView && (clonedDoc.defaultView as any).Intl) {
          try {
            delete (clonedDoc.defaultView as any).Intl.Segmenter;
          } catch {
            (clonedDoc.defaultView as any).Intl.Segmenter = undefined;
          }
        }

        // B. Copy document fonts to cloned document
        if (typeof document !== "undefined" && document.fonts && clonedDoc.fonts) {
          try {
            document.fonts.forEach((font) => clonedDoc.fonts.add(font));
          } catch {}
        }

        // C. Sanitize existing style elements instead of removing them, preserving component styles
        const existingStyles = clonedDoc.querySelectorAll("style");
        existingStyles.forEach((s) => {
          if (s.textContent) {
            s.textContent = sanitizeCSS(s.textContent);
          }
        });

        // D. Remove same-origin / relative stylesheet link elements
        const host = window.location.host;
        const links = clonedDoc.querySelectorAll("link[rel='stylesheet']");
        links.forEach((link) => {
          const href = link.getAttribute("href");
          if (href) {
            if (href.startsWith("/") || href.includes(host) || !href.startsWith("http")) {
              link.remove();
            }
          }
        });

        // E. Inject sanitized stylesheet
        const styleTag = clonedDoc.createElement("style");
        styleTag.type = "text/css";
        styleTag.innerHTML = cleanCSS;
        clonedDoc.head.appendChild(styleTag);

        // F. Inject overrides for:
        // 1. Exact typography with word spacing to prevent overlapping text
        // 2. Removal of outer container borders and shadows (NO garis tepi halaman)
        // 3. Crisp black borders for official report tables
        const printOverrideTag = clonedDoc.createElement("style");
        printOverrideTag.type = "text/css";
        printOverrideTag.innerHTML = `
          /* Standard font metrics across browser layout and canvas 2D context */
          *, *::before, *::after {
            font-family: Arial, "Helvetica Neue", Helvetica, sans-serif !important;
            font-feature-settings: normal !important;
            font-variant: normal !important;
            letter-spacing: normal !important;
            word-spacing: normal !important;
            text-rendering: geometricPrecision !important;
            -webkit-font-smoothing: antialiased !important;
          }

          /* Remove card borders, rounded corners, and shadows so PDF has NO outer page border */
          .dokumen-cetak-resmi, 
          .dokumen-cetak-landscape, 
          .print-page-wrapper,
          #bku-official-document-sheet,
          [ref="printRef"],
          .border-slate-200,
          .border-slate-200\\/80,
          .rounded-2xl,
          .rounded-xl,
          .rounded-lg {
            border: none !important;
            border-width: 0 !important;
            border-radius: 0px !important;
            box-shadow: none !important;
            outline: none !important;
          }

          /* Ensure official report tables retain crisp, standard 1px borders */
          table.border-collapse,
          table.border-collapse td,
          table.border-collapse th,
          td.border,
          th.border,
          .bku-screen-table th,
          .bku-screen-table td,
          .bku-table,
          .bku-table th,
          .bku-table td {
            border: 1px solid #000000 !important;
          }

          /* Keep borderless metadata cells completely borderless */
          .border-none,
          td.border-none,
          th.border-none,
          .meta-table,
          .meta-table td,
          .meta-table th {
            border: none !important;
            border-width: 0px !important;
          }
        `;
        clonedDoc.head.appendChild(printOverrideTag);

        // G. Sanitize inline styles on every element in the cloned document
        const allElements = clonedDoc.querySelectorAll("*");
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl.style && htmlEl.style.cssText) {
            const cssText = htmlEl.style.cssText;
            const lower = cssText.toLowerCase();
            if (
              lower.includes("oklch") ||
              lower.includes("oklab") ||
              lower.includes("color-mix") ||
              lower.includes("lab(") ||
              lower.includes("lch(")
            ) {
              htmlEl.style.cssText = sanitizeCSS(cssText);
            }
          }
        });

        // H. Ensure the cloned container element has NO outer border, shadow, or radius
        if (clonedElement) {
          clonedElement.style.border = "none";
          clonedElement.style.borderWidth = "0px";
          clonedElement.style.borderRadius = "0px";
          clonedElement.style.boxShadow = "none";
          clonedElement.style.filter = "none";
          clonedElement.style.outline = "none";
        }
      } catch (err) {
        console.warn("safeHtml2Canvas onclone preparation error:", err);
      }

      // Call user-provided onclone handler if any
      if (userOnClone) {
        userOnClone(clonedDoc, clonedElement);
      }
    }
  };

  return html2canvas(element, mergedOptions);
}
