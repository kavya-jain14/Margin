"use client";
import { useEffect, useId, useRef } from "react";

export default function Modal({title, children, onClose}: {title: string; children: React.ReactNode; onClose: () => void}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => { element?.close(); previous?.focus(); };
  }, []);
  return <dialog ref={dialog} className="modal" onCancel={event => {event.preventDefault(); onClose();}} onClick={event => {if (event.target !== event.currentTarget) return; const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();}} aria-labelledby={headingId}>
    <div className="modal-heading"><h2 id={headingId}>{title}</h2><button className="text-button" onClick={onClose}>Close</button></div>
    {children}
  </dialog>;
}
