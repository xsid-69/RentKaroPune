"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { initialState } from "./seed";

const MarketplaceContext = createContext(null);
const STORAGE_KEY = "rentkaropune-listings-v1";
const makeId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isValidProperty = (property) => isRecord(property)
  && typeof property.id === "string"
  && typeof property.title === "string"
  && typeof property.status === "string"
  && typeof property.approved === "boolean"
  && Number.isFinite(property.rent)
  && Number.isFinite(property.area)
  && Array.isArray(property.images)
  && property.images.every((image) => typeof image === "string");
const restoreState = (value) => isRecord(value) && Array.isArray(value.properties) && value.properties.every(isValidProperty) ? { properties: value.properties } : null;
const removeStoredState = () => { try { window.localStorage.removeItem(STORAGE_KEY); } catch {} };

export function MarketplaceProvider({ children }) {
  const [state, setState] = useState(initialState);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const restored = restoreState(JSON.parse(saved));
        if (restored) setState(restored);
        else removeStoredState();
      }
    } catch { removeStoredState(); }
    finally { setReady(true); }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [ready, state]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 4200);
  };

  const addProperty = (details) => {
    const property = {
      ...details,
      id: makeId("rk"),
      approved: false,
      status: "Pending verification",
      deposit: Number(details.rent) * 3,
      area: Number(details.area),
      rent: Number(details.rent),
      amenities: details.amenities?.length ? details.amenities : ["Lift", "Security"],
      owner: "You (Owner)",
      available: "After verification",
      images: ["https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=85"],
    };
    setState((current) => ({ ...current, properties: [property, ...current.properties] }));
    notify("Property sent for admin verification.");
    return property.id;
  };

  const approveProperty = (id) => {
    setState((current) => ({
      ...current,
      properties: current.properties.map((property) => property.id === id && !property.approved
        ? { ...property, approved: true, status: "Available", available: "Ready after approval" }
        : property),
    }));
    notify("Owner documents verified. Listing is now live in discovery.");
  };

  const syncLiveProperties = useCallback((properties) => {
    if (!Array.isArray(properties)) return;
    setState((current) => ({
      ...current,
      properties: [...current.properties.filter((property) => !property.approved), ...properties],
    }));
  }, []);

  const resetDemo = () => {
    setState(initialState);
    removeStoredState();
    notify("Listing demo data restored.");
  };

  const value = useMemo(() => ({
    state, ready, toast, addProperty, approveProperty, resetDemo, syncLiveProperties,
  }), [state, ready, toast, syncLiveProperties]);

  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>;
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (!context) throw new Error("useMarketplace must be used inside MarketplaceProvider");
  return context;
}