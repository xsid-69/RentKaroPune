"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { whatsappUrl } from "@/lib/whatsapp";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function SwipeToWhatsApp({ message, label = "Swipe to WhatsApp", compact = false, className = "" }) {
  const href = whatsappUrl(message);
  const trackRef = useRef(null);
  const thumbRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startOffset: 0, currentOffset: 0 });
  const openingRef = useRef(false);
  const redirectTimerRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("");

  const measure = useCallback(() => {
    const trackWidth = trackRef.current?.clientWidth || 0;
    const thumbWidth = thumbRef.current?.offsetWidth || 0;
    const nextLimit = Math.max(0, trackWidth - thumbWidth - 8);
    setLimit(nextLimit);
    if (!dragRef.current.active && !openingRef.current) {
      dragRef.current.currentOffset = 0;
      setOffset(0);
    }
  }, []);

  useEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (trackRef.current) observer.observe(trackRef.current);
    return () => {
      observer.disconnect();
      if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
    };
  }, [measure]);

  const openWhatsApp = useCallback(() => {
    if (openingRef.current) return;
    openingRef.current = true;
    dragRef.current.active = false;
    dragRef.current.currentOffset = limit;
    setDragging(false);
    setStatus("opening");
    setOffset(limit);
    redirectTimerRef.current = window.setTimeout(() => { window.location.assign(href); }, 160);
  }, [href, limit]);

  const reset = useCallback(() => {
    dragRef.current.active = false;
    dragRef.current.currentOffset = 0;
    setDragging(false);
    setOffset(0);
  }, []);

  const pointerDown = (event) => {
    if (openingRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { active: true, startX: event.clientX, startOffset: dragRef.current.currentOffset, currentOffset: dragRef.current.currentOffset };
    setDragging(true);
  };

  const pointerMove = (event) => {
    if (!dragRef.current.active || openingRef.current) return;
    const next = clamp(dragRef.current.startOffset + event.clientX - dragRef.current.startX, 0, limit);
    dragRef.current.currentOffset = next;
    setOffset(next);
  };

  const pointerEnd = () => {
    if (!dragRef.current.active) return;
    const finalOffset = dragRef.current.currentOffset;
    dragRef.current.active = false;
    if (limit > 0 && finalOffset >= limit * 0.72) openWhatsApp();
    else reset();
  };

  const keyDown = (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const next = clamp(dragRef.current.currentOffset + direction * Math.max(24, limit / 4), 0, limit);
      dragRef.current.currentOffset = next;
      setOffset(next);
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openWhatsApp();
    }
  };

  const progress = limit ? Math.round((offset / limit) * 100) : 0;
  return <div className={`min-w-0 ${className}`}>
    <div
      ref={trackRef}
      className={`relative isolate w-full overflow-hidden rounded-2xl border border-[#187a42] bg-[#106b38] p-1 shadow-[inset_0_1px_0_rgb(255_255_255/18%)] ${compact ? "h-14" : "h-16"}`}
      style={{ touchAction: "pan-y" }}
      aria-label={`${label}. Drag the handle from left to right.`}
    >
      <span className="absolute inset-y-1 left-1 rounded-[12px] bg-[#25b866] transition-[width] duration-100 motion-reduce:transition-none" style={{ width: `calc(${progress}% + ${compact ? 48 : 56}px)` }} aria-hidden="true"/>
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center pl-12 text-sm font-extrabold text-white" aria-hidden="true">{status === "opening" ? "Opening WhatsApp…" : label}<span className="ml-2 tracking-[0.2em] text-white/65">››</span></span>
      <button
        ref={thumbRef}
        type="button"
        role="slider"
        aria-label="WhatsApp swipe handle"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={progress}
        aria-valuetext={`${progress}% swiped. Use Right Arrow or press Enter to open WhatsApp.`}
        style={{ transform: `translate3d(${offset}px,0,0)` }}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerEnd}
        onPointerCancel={reset}
        onKeyDown={keyDown}
        className={`absolute left-1 top-1 grid shrink-0 touch-none place-items-center rounded-xl bg-white text-[#106b38] shadow-[0_5px_18px_rgb(0_0_0/24%)] outline-none focus-visible:ring-4 focus-visible:ring-white/70 ${compact ? "size-12" : "size-14"} ${dragging ? "cursor-grabbing [transition:none]" : "cursor-grab transition-transform duration-200 ease-out motion-reduce:transition-none"}`}
      ><Icon name={status === "opening" ? "check" : "arrow"} size={compact ? 19 : 21}/></button>
    </div>
    <div className="mt-2 flex items-center justify-between gap-3 text-xs"><span className="text-[var(--muted)]">Drag the handle fully right</span><a className="min-h-11 shrink-0 content-center font-bold text-[#126c3a] underline decoration-[#126c3a]/35 underline-offset-4" href={href} target="_blank" rel="noreferrer">Open directly</a></div>
    <span className="sr-only" role="status" aria-live="polite">{status === "opening" ? "Opening WhatsApp" : ""}</span>
  </div>;
}