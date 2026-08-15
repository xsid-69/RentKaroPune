"use client";

import { useEffect, useId, useRef, useState } from "react";
import Icon from "./Icon";

/**
 * Accessible, premium custom select (listbox pattern). Keyboard operable, closes
 * on outside click / Escape, and matches the site's brand styling. `options` is
 * an array of { value, label }.
 */
export default function SelectField({
  label,
  ariaLabel,
  value,
  onChange,
  options,
  className = "",
  labelClassName = "mb-1 block text-xs font-extrabold text-[#282622]",
  buttonClassName = "",
  align = "left",
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const buttonRef = useRef(null);
  const rawId = useId();
  const listId = `sel-${rawId.replace(/:/g, "")}`;

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = options[selectedIndex] || options[0];

  useEffect(() => {
    const onPointerDown = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => { if (open) setActiveIndex(selectedIndex < 0 ? 0 : selectedIndex); }, [open, selectedIndex]);
  useEffect(() => { if (open && activeIndex >= 0) listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" }); }, [open, activeIndex]);

  const choose = (option) => { onChange(option.value); setOpen(false); window.setTimeout(() => buttonRef.current?.focus(), 0); };

  const onKeyDown = (event) => {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") { event.preventDefault(); setOpen(true); }
      return;
    }
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); buttonRef.current?.focus(); }
    else if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => (index + 1) % options.length); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => (index <= 0 ? options.length - 1 : index - 1)); }
    else if (event.key === "Home") { event.preventDefault(); setActiveIndex(0); }
    else if (event.key === "End") { event.preventDefault(); setActiveIndex(options.length - 1); }
    else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (activeIndex >= 0) choose(options[activeIndex]); }
    else if (event.key === "Tab") setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      {label && <span className={labelClassName}>{label}</span>}
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel || label}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center justify-between gap-2 text-left outline-none ${buttonClassName}`}
      >
        <span className="min-w-0 truncate">{selected?.label}</span>
        <Icon name="chevron" size={16} className={`shrink-0 text-[#67625b] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel || label}
          className={`absolute top-[calc(100%+8px)] max-h-[min(16rem,42dvh)] w-full min-w-[12rem] overflow-y-auto overscroll-contain rounded-xl border border-[#ded9d1] bg-white py-1.5 shadow-[0_18px_50px_rgb(40_38_34/16%)] motion-safe:animate-modal ${align === "right" ? "right-0" : "left-0"}`}
          style={{ zIndex: "var(--z-dropdown)" }}
        >
          {options.map((option, index) => {
            const active = index === activeIndex;
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onPointerMove={() => setActiveIndex(index)}
                onPointerDown={(event) => { event.preventDefault(); choose(option); }}
                className={`flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 text-sm transition-colors ${active ? "bg-[#ff5a1f] text-white" : "text-[#282622] hover:bg-[#fff0e8]"}`}
              >
                <span className={`min-w-0 truncate ${isSelected ? "font-extrabold" : "font-semibold"}`}>{option.label}</span>
                {isSelected && <Icon name="check" size={16} className={active ? "text-white" : "text-[#d9470e]"} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
