"use client";

import { useEffect, useEffectEvent, type RefObject } from "react";

const dialogs: HTMLElement[] = [];
const focusableSelector = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function useDialog<T extends HTMLElement>(ref: RefObject<T | null>, onClose: () => void, native = false) {
  const close = useEffectEvent(onClose);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    dialogs.push(element);
    if (native && element instanceof HTMLDialogElement) element.showModal();
    document.body.style.overflow = "hidden";

    const inertElements: { element: HTMLElement; inert: boolean }[] = [];
    if (!native) {
      let branch: HTMLElement = element;
      while (branch.parentElement) {
        for (const sibling of branch.parentElement.children) {
          if (sibling instanceof HTMLElement && sibling !== branch && !sibling.hasAttribute("data-dialog-backdrop")) {
            inertElements.push({ element: sibling, inert: sibling.inert });
            sibling.setAttribute("inert", "");
          }
        }
        if (branch.parentElement === document.body) break;
        branch = branch.parentElement;
      }
    }
    function controls() {
      return [...element!.querySelectorAll<HTMLElement>(focusableSelector)].filter((item) =>
        item.tabIndex >= 0 && !item.matches(":disabled") && !item.closest("[inert]") && item.getClientRects().length > 0);
    }
    function focusFirst() {
      (controls()[0] ?? element)!.focus();
    }
    focusFirst();
    function keydown(event: KeyboardEvent) {
      if (dialogs.at(-1) !== element) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
      } else if (event.key === "Tab") {
        const items = controls();
        const first = items[0];
        const last = items.at(-1);
        if (!first) { event.preventDefault(); element!.focus(); }
        else if (event.shiftKey && (document.activeElement === first || document.activeElement === element)) {
          event.preventDefault(); last!.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
    }
    function focusin(event: FocusEvent) {
      if (dialogs.at(-1) === element && event.target instanceof Node && !element!.contains(event.target)) focusFirst();
    }
    document.addEventListener("keydown", keydown, true);
    document.addEventListener("focusin", focusin);
    return () => {
      document.removeEventListener("keydown", keydown, true);
      document.removeEventListener("focusin", focusin);
      dialogs.splice(dialogs.indexOf(element), 1);
      if (native && element instanceof HTMLDialogElement) element.close();
      for (const item of inertElements) {
        if (item.inert) item.element.setAttribute("inert", "");
        else item.element.removeAttribute("inert");
      }
      document.body.style.overflow = overflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [ref, native]);
}
