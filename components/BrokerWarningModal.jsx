"use client";

import { useEffect, useRef } from "react";
import Icon from "./Icon";

export default function BrokerWarningModal({ open, onClose, onProceed, property }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="broker-warning-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg rounded-2xl border border-amber-300 bg-white p-6 shadow-2xl transition-all sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200"
          aria-label="Close dialog"
        >
          <Icon name="close" size={16} />
        </button>

        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-full bg-amber-100 text-amber-700">
            <Icon name="info" size={24} />
          </span>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-700">Brokerage Advisory</span>
            <h2 id="broker-warning-title" className="text-xl font-black text-stone-900">
              Notice: Listed by Real Estate Broker
            </h2>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm leading-6 text-amber-950">
          <p className="font-semibold text-amber-900">
            This property ({property?.title || "selected property"}) is handled by an independent broker / consultant.
          </p>
          <ul className="mt-2.5 list-disc space-y-1.5 pl-4 text-xs font-medium text-amber-800">
            <li>
              <strong>Brokerage Applicable:</strong> Standard broker commission (typically 15 to 30 days rent) will be charged by the agent upon signing the lease agreement.
            </li>
            <li>
              <strong>RentKaro Pune Policy:</strong> RentKaro Pune does not charge you brokerage, but the broker represents their agency.
            </li>
            <li>
              <strong>Direct Owner Alternative:</strong> To avoid brokerage entirely, browse properties with the green <em>Direct Owner (0% Brokerage)</em> badge.
            </li>
          </ul>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 rounded-xl border border-stone-300 bg-white px-5 text-sm font-bold text-stone-700 hover:border-stone-900 active:scale-95"
          >
            Cancel & View Owner Homes
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onProceed) onProceed();
            }}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-600 px-6 text-sm font-extrabold text-white hover:bg-amber-700 active:scale-95"
          >
            I Understand, Proceed <Icon name="arrow" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
