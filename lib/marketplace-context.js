"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BROKER, initialState } from "./seed";

const MarketplaceContext = createContext(null);
const STORAGE_KEY = "rentkaropune-marketplace-v3";
const STATE_ARRAY_KEYS = ["properties", "unlocks", "leads", "ledger"];
const makeId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const tierFor = (bookingNumber) => bookingNumber <= 1 ? 10 : bookingNumber === 2 ? 20 : 30;

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

const restoreState = (value) => {
  if (!isRecord(value) || !STATE_ARRAY_KEYS.every((key) => Array.isArray(value[key]))) return null;
  if (!value.properties.every(isValidProperty)) return null;
  if (!Number.isInteger(value.closedDeals) || value.closedDeals < 0) return null;
  if (!Number.isInteger(value.totalVisits) || value.totalVisits < 0) return null;
  return { ...initialState, ...value };
};

const removeStoredState = () => {
  try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
};

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
    } catch {
      removeStoredState();
    } finally {
      setReady(true);
    }
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
      images: ["https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=85"]
    };
    setState((current) => ({
      ...current,
      properties: [property, ...current.properties],
      ledger: [{ id: makeId("tx"), type: "Listing fee", amount: 100, platformShare: 100, reference: property.id.toUpperCase(), date: "Today" }, ...current.ledger]
    }));
    notify("Listing payment confirmed. Property sent for verification.");
    return property.id;
  };

  const approveProperty = (id) => {
    setState((current) => ({
      ...current,
      properties: current.properties.map((property) => property.id === id && !property.approved
        ? { ...property, approved: true, status: "Available", available: "Ready after approval" }
        : property)
    }));
    notify("Owner documents verified. Listing is now live in discovery.");
  };

  const unlockProperty = (id) => {
    setState((current) => {
      const property = current.properties.find((item) => item.id === id);
      if (!property?.approved || property.status !== "Available" || current.unlocks.some((item) => item.propertyId === id)) return current;
      return {
        ...current,
        unlocks: [...current.unlocks, { propertyId: id, paidAt: "Today" }],
        leads: [...current.leads, { id: makeId("lead"), propertyId: id, broker: BROKER, status: "Unlocked", visitDate: "Not booked", visitCount: 0, visitFee: null, tokenPaid: 0 }],
        ledger: [{ id: makeId("tx"), type: "Unlock fee", amount: 100, platformShare: 100, reference: id.toUpperCase(), date: "Today" }, ...current.ledger]
      };
    });
    notify("Contact unlocked. Aarav Shinde has been assigned to your request.");
  };

  const bookVisit = (id, date) => {
    setState((current) => {
      const lead = current.leads.find((item) => item.propertyId === id);
      if (!lead || !["Unlocked", "Visited"].includes(lead.status)) return current;
      const visitFee = current.totalVisits === 0 ? 0 : 50;
      const reference = id.toUpperCase();
      return {
        ...current,
        totalVisits: current.totalVisits + 1,
        leads: current.leads.map((item) => item.id === lead.id
          ? { ...item, status: "Scheduled", visitDate: date, visitFee, visitCount: Number(item.visitCount || 0) + 1 }
          : item),
        ledger: visitFee
          ? [{ id: makeId("tx"), type: "Visit fee", amount: visitFee, platformShare: visitFee, reference, date: "Today" }, ...current.ledger]
          : current.ledger,
      };
    });
    notify("Visit confirmed. The consultant and owner have been notified.");
  };

  const markVisited = (id) => {
    setState((current) => ({
      ...current,
      leads: current.leads.map((lead) => lead.propertyId === id && lead.status === "Scheduled"
        ? { ...lead, status: "Visited" }
        : lead)
    }));
    notify("Visit marked complete. Token hold is now available to the client.");
  };

  const payToken = (id) => {
    setState((current) => {
      const property = current.properties.find((item) => item.id === id);
      const lead = current.leads.find((item) => item.propertyId === id);
      if (!property || lead?.status !== "Visited") return current;
      const amount = Math.round(property.rent * 0.15);
      return {
        ...current,
        properties: current.properties.map((item) => item.id === id ? { ...item, status: "Under Hold" } : item),
        leads: current.leads.map((item) => item.propertyId === id ? { ...item, status: "Token paid", tokenPaid: amount } : item),
        ledger: [{ id: makeId("tx"), type: "Token hold", amount, platformShare: 0, reference: id.toUpperCase(), date: "Today" }, ...current.ledger]
      };
    });
    notify("Token hold confirmed. The property is now reserved for you.");
  };

  const cancelToken = (id) => {
    setState((current) => {
      const lead = current.leads.find((item) => item.propertyId === id);
      if (lead?.status !== "Token paid" || !lead.tokenPaid) return current;
      const refund = Math.round(lead.tokenPaid * 0.75);
      const platformCharge = lead.tokenPaid - refund;
      return {
        ...current,
        properties: current.properties.map((item) => item.id === id ? { ...item, status: "Available" } : item),
        leads: current.leads.map((item) => item.propertyId === id ? { ...item, status: "Cancelled", tokenRefund: refund, cancellationCharge: platformCharge, tokenPaid: 0 } : item),
        ledger: [
          { id: makeId("tx"), type: "Cancellation charge", amount: platformCharge, platformShare: platformCharge, reference: id.toUpperCase(), date: "Today" },
          { id: makeId("tx"), type: "Token refund", amount: -refund, platformShare: 0, reference: id.toUpperCase(), date: "Today" },
          ...current.ledger,
        ]
      };
    });
    notify("Cancellation recorded. A 75% token refund has been added to the ledger.");
  };

  const closeDeal = (id) => {
    setState((current) => {
      const property = current.properties.find((item) => item.id === id);
      const lead = current.leads.find((item) => item.propertyId === id);
      if (!property || lead?.status !== "Token paid") return current;
      const bookingNumber = current.closedDeals + 1;
      const discount = tierFor(bookingNumber);
      const brokerage = Math.round(property.rent * (1 - discount / 100));
      const brokerShare = Math.round(brokerage * 0.6);
      const platformShare = brokerage - brokerShare;
      return {
        ...current,
        closedDeals: bookingNumber,
        properties: current.properties.map((item) => item.id === id ? { ...item, status: "Rented" } : item),
        leads: current.leads.map((item) => item.propertyId === id ? { ...item, status: "Closed", brokerage, discount, brokerShare, platformShare } : item),
        ledger: [{ id: makeId("tx"), type: "Brokerage", amount: brokerage, brokerShare, platformShare, reference: id.toUpperCase(), date: "Today" }, ...current.ledger]
      };
    });
    notify("Deal closed. Loyalty pricing and the 60/40 split are in the ledger.");
  };

  const resetDemo = () => {
    setState(initialState);
    removeStoredState();
    notify("Demo data restored to its starting state.");
  };

  const value = useMemo(() => ({
    state, ready, toast, broker: BROKER, addProperty, approveProperty, unlockProperty,
    bookVisit, markVisited, payToken, cancelToken, closeDeal, resetDemo, tierFor
  }), [state, ready, toast]);

  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>;
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (!context) throw new Error("useMarketplace must be used inside MarketplaceProvider");
  return context;
}
