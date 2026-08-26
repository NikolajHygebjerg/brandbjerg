"use client";

export function triggerKursuslederPrint(target: string) {
  document.body.setAttribute("data-print-target", target);
  window.print();
  window.setTimeout(() => {
    document.body.removeAttribute("data-print-target");
  }, 500);
}
