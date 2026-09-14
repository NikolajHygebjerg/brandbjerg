"use client";

export function triggerKursuslederPrint(target: string) {
  document.body.setAttribute("data-print-target", target);
  window.print();
  window.setTimeout(() => {
    document.body.removeAttribute("data-print-target");
  }, 500);
}

/** Åbn browserens print-dialog for en PDF (fx drikkevarerseddel-master). */
export function triggerPdfPrint(pdfUrl: string) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.src = pdfUrl;

  const cleanup = () => {
    iframe.remove();
  };

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      window.setTimeout(cleanup, 1000);
    }
  };

  document.body.appendChild(iframe);
}
