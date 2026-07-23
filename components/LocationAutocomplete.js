"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Icon from "./Icon";

const MAX_SUGGESTIONS = 12;
const normalize = (value) => value.toLocaleLowerCase("en-IN").trim();

function HighlightedText({ text, query }) {
  const needle = query.trim();
  if (!needle) return text;
  const index = normalize(text).indexOf(normalize(needle));
  if (index < 0) return text;
  return <>{text.slice(0, index)}<strong className="font-black text-[#282622]">{text.slice(index, index + needle.length)}</strong>{text.slice(index + needle.length)}</>;
}

export default function LocationAutocomplete({ value, onValueChange, options, label = "Pune location", placeholder = "Search locality or landmark" }) {
  const generatedId = useId();
  const inputId = `location-${generatedId.replaceAll(":", "")}`;
  const listboxId = `${inputId}-listbox`;
  const rootRef = useRef(null);
  const optionRefs = useRef([]);
  const sessionToken = useRef(globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`);
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleMode, setGoogleMode] = useState(false);

  const localMatches = useMemo(() => {
    const needle = normalize(query);
    if (!needle) return [];
    return options.filter((option) => normalize(option).includes(needle)).slice(0, MAX_SUGGESTIONS).map((label) => ({ id: label, label }));
  }, [options, query]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/places", { signal: controller.signal })
      .then((response) => response.ok ? response.json() : { enabled: false })
      .then((data) => setGoogleMode(Boolean(data.enabled)))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]); setIsLoading(false); setHighlightedIndex(-1);
      return;
    }

    setSuggestions(localMatches);
    if (!googleMode) return;

    const controller = new AbortController();
    setIsLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ input: query, sessiontoken: sessionToken.current });
        const response = await fetch(`/api/places?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Places request failed");
        const data = await response.json();
        setSuggestions(data.suggestions?.length ? data.suggestions.slice(0, MAX_SUGGESTIONS) : localMatches);
      } catch (error) {
        if (error.name !== "AbortError") setSuggestions(localMatches);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 300);

    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [googleMode, localMatches, query]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setIsDropdownOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    if (highlightedIndex < 0) return;
    optionRefs.current[highlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  const selectSuggestion = (suggestion) => {
    setQuery(suggestion.label);
    onValueChange(suggestion.label);
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
    sessionToken.current = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setIsDropdownOpen(false); setHighlightedIndex(-1);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isDropdownOpen) setIsDropdownOpen(true);
      if (!suggestions.length) return;
      setHighlightedIndex((current) => event.key === "ArrowDown"
        ? (current + 1) % suggestions.length
        : (current <= 0 ? suggestions.length - 1 : current - 1));
      return;
    }
    if (event.key === "Enter" && isDropdownOpen && highlightedIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[highlightedIndex]);
    }
  };

  const handleChange = (event) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    onValueChange(nextQuery);
    setHighlightedIndex(-1);
    setIsDropdownOpen(Boolean(nextQuery.trim()));
  };

  const clearSearch = () => {
    setQuery("");
    onValueChange("");
    setSuggestions([]);
    setHighlightedIndex(-1);
    setIsDropdownOpen(false);
  };

  const showDropdown = isDropdownOpen && Boolean(query.trim());
  const activeId = highlightedIndex >= 0 ? `${inputId}-option-${highlightedIndex}` : undefined;

  return <div ref={rootRef} className="relative min-w-0">
    <label htmlFor={inputId} className="mb-1.5 block text-xs font-bold text-[#67625b]">{label}</label>
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#747068]" name="map" size={17} />
      <input id={inputId} role="combobox" aria-autocomplete="list" aria-expanded={showDropdown} aria-controls={listboxId} aria-activedescendant={activeId}
        className="min-h-12 w-full rounded-xl border border-[#d9d4cc] bg-white pl-10 pr-12 text-base font-bold text-[#282622] outline-none transition-[border-color,box-shadow] duration-200 placeholder:font-medium placeholder:text-[#67625b] focus:border-[#ff5a1f] focus:ring-2 focus:ring-[#ff5a1f]/20 sm:text-sm"
        value={query} onChange={handleChange} onFocus={() => query.trim() && setIsDropdownOpen(true)} onKeyDown={handleKeyDown} placeholder={placeholder} autoComplete="off" spellCheck="false" />
      {query && <button type="button" onClick={clearSearch} aria-label="Clear location search" className="absolute right-0.5 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-lg text-[#67625b] transition-colors duration-200 hover:bg-[#fff0e8] hover:text-[#d9470e] active:bg-[#ffe0d0] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#ff5a1f]"><Icon name="close" size={18} /></button>}
    </div>

    {showDropdown && <div className="absolute left-0 right-0 top-[calc(100%+8px)] overflow-hidden rounded-xl border border-[#ded9d1] bg-white shadow-[0_18px_50px_rgb(40_38_34/16%)]" style={{ zIndex: "var(--z-dropdown)" }}>
      <div className="flex items-center justify-between border-b border-[#eeeae4] px-3.5 py-2 text-[11px] font-bold text-[#67625b]">
        <span>{googleMode ? "Places in Pune" : "Pune locations"}</span>
        {isLoading && <span role="status" className="text-[#d9470e]">Searching…</span>}
      </div>
      {suggestions.length > 0 ? <ul id={listboxId} role="listbox" aria-label="Pune location suggestions" className="max-h-[min(18rem,40dvh)] scroll-py-1.5 overflow-y-auto overscroll-contain py-1.5">
        {suggestions.map((suggestion, index) => {
          const [primary, ...secondaryParts] = suggestion.label.split(",");
          const secondary = secondaryParts.join(",").trim();
          const active = highlightedIndex === index;
          return <li key={suggestion.id || suggestion.label} id={`${inputId}-option-${index}`} role="option" aria-selected={active}
            ref={(node) => { optionRefs.current[index] = node; }}
            onPointerMove={() => setHighlightedIndex(index)} onPointerDown={(event) => { event.preventDefault(); selectSuggestion(suggestion); }}
            className={`flex cursor-pointer items-start gap-3 px-3.5 py-2.5 text-sm transition-colors ${active ? "bg-[#ff5a1f] text-white" : "text-[#282622] hover:bg-[#fff0e8]"}`}>
            <Icon name="map" size={17} className={`mt-0.5 shrink-0 ${active ? "text-white" : "text-[#e84c12]"}`} />
            <span className="min-w-0"><span className={`block truncate font-semibold ${active ? "[&_strong]:text-white" : ""}`}><HighlightedText text={primary} query={query} /></span>
              {secondary && <span className={`mt-0.5 block truncate text-xs ${active ? "text-white/85 [&_strong]:text-white" : "text-[#67625b]"}`}><HighlightedText text={secondary} query={query} /></span>}
            </span>
          </li>;
        })}
      </ul> : !isLoading && <p className="m-0 px-4 py-5 text-center text-sm font-medium text-[#67625b]">No Pune locations found</p>}
    </div>}
    <span className="sr-only" role="status" aria-live="polite">{showDropdown && !isLoading ? `${suggestions.length} suggestions available` : ""}</span>
  </div>;
}
