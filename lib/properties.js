"use client";

import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80";

function requireDb() {
  if (!db) throw new Error("Firebase is not configured. Add the NEXT_PUBLIC_FIREBASE_* variables.");
  return db;
}

const compactBhk = (value) => {
  const normalized = String(value || "").toUpperCase().replace(/\s+/g, "");
  if (normalized.startsWith("4")) return "4BHK+";
  return ["1BHK", "2BHK", "3BHK"].includes(normalized) ? normalized : String(value || "Not specified");
};

export function normalizeFirestoreProperty(data = {}, id = "") {
  const images = Array.isArray(data.images) ? data.images.filter(Boolean) : [];
  const amenities = Array.isArray(data.amenities) ? data.amenities.filter(Boolean) : [data.parking].filter(Boolean);
  
  const createdAtStr = data.createdAt?.toDate?.()?.toISOString?.() || (typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString());
  const createdAtMs = new Date(createdAtStr).getTime();
  const freeDaysMs = 7 * 24 * 60 * 60 * 1000;
  const freeExpiresMs = data.freeAdExpiresAt ? new Date(data.freeAdExpiresAt).getTime() : createdAtMs + freeDaysMs;
  const nowMs = Date.now();
  const isAdActive = data.adPlan === "extended" || data.adPlan === "monthly" || nowMs <= freeExpiresMs;
  const daysRemaining = Math.max(0, Math.ceil((freeExpiresMs - nowMs) / (24 * 60 * 60 * 1000)));

  const listedBy = data.listedBy || (data.contact?.owner ? "owner" : (data.brokerId || data.contact?.agent ? "broker" : "owner"));
  const isOwner = listedBy === "owner";
  const verifiedBadge = Boolean(data.verifiedBadge ?? (data.status === "approved"));

  return {
    ...data,
    id: data.id || id,
    bhk: compactBhk(data.bhk),
    rent: Number(data.rent) || 0,
    deposit: Number(data.deposit) || 0,
    images: images.length ? images : [FALLBACK_IMAGE],
    amenities,
    listedBy,
    isOwner,
    brokerage: isOwner ? "0% (Zero Brokerage)" : (data.brokerage || "Standard 1 Month Brokerage"),
    verifiedBadge,
    freeAdExpiresAt: new Date(freeExpiresMs).toISOString(),
    isAdActive,
    daysRemaining,
    unlockFee: isOwner ? 49 : 99,
    contactPhone: data.contact?.phone || data.contactPhone || "7045308514",
    contactName: data.contact?.owner || data.contact?.agent || data.contactName || data.owner || (isOwner ? "Direct Owner" : "Registered Broker"),
    createdAt: createdAtStr,
  };
}

export function toMarketplaceProperty(property) {
  const bhk = compactBhk(property.bhk).replace("BHK+", " BHK").replace("BHK", " BHK");
  const locality = property.locality || property.location || "Pune";
  const listedBy = property.listedBy || (property.contact?.owner ? "owner" : (property.contact?.agent ? "broker" : "owner"));
  const isOwner = listedBy === "owner";
  const verifiedBadge = Boolean(property.verifiedBadge ?? (property.approved || property.status === "approved"));
  
  const createdAtStr = property.createdAt || new Date().toISOString();
  const createdAtMs = new Date(createdAtStr).getTime();
  const freeExpiresMs = property.freeAdExpiresAt ? new Date(property.freeAdExpiresAt).getTime() : createdAtMs + 7 * 24 * 60 * 60 * 1000;
  const nowMs = Date.now();
  const isAdActive = property.adPlan === "extended" || property.adPlan === "monthly" || nowMs <= freeExpiresMs;
  const daysRemaining = Math.max(0, Math.ceil((freeExpiresMs - nowMs) / (24 * 60 * 60 * 1000)));

  return {
    ...property,
    locality,
    type: property.type || property.propertyType || "Flat",
    bhk,
    area: Number(property.area) || 0,
    approved: property.status === "approved" || property.approved === true,
    status: property.status === "approved" ? "Available" : property.status,
    furnishing: property.furnishing || "Not specified",
    available: property.available || "Ready now",
    owner: property.owner || property.contact?.owner || property.contact?.agent || (isOwner ? "Direct Owner" : "Registered Broker"),
    listedBy,
    isOwner,
    brokerage: isOwner ? "0% (Zero Brokerage)" : (property.brokerage || "Standard 1 Month Brokerage"),
    verifiedBadge,
    freeAdExpiresAt: new Date(freeExpiresMs).toISOString(),
    isAdActive,
    daysRemaining,
    unlockFee: isOwner ? 49 : 99,
    contactPhone: property.contact?.phone || property.contactPhone || "7045308514",
    contactName: property.contact?.owner || property.contact?.agent || property.contactName || property.owner || (isOwner ? "Direct Owner" : "Registered Broker"),
    description: property.description || `${bhk} ${property.propertyType || "home"} available for rent in ${locality}. Contact the RentKaro Pune team on WhatsApp or request a callback for details.`,
  };
}

function propertyFromSnapshot(snapshot) {
  return normalizeFirestoreProperty(snapshot.data(), snapshot.id);
}

function subscribeByStatus(status, onData, onError) {
  const propertiesQuery = query(collection(requireDb(), "properties"), where("status", "==", status));
  return onSnapshot(propertiesQuery, (snapshot) => {
    const properties = snapshot.docs.map(propertyFromSnapshot)
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    onData(properties);
  }, onError);
}

export function subscribeApprovedProperties(onData, onError) {
  return subscribeByStatus("approved", onData, onError);
}

export function subscribePendingProperties(onData, onError) {
  return subscribeByStatus("pending", onData, onError);
}

export function subscribeProperty(id, onData, onError) {
  if (!id || typeof id !== "string") throw new Error("A property id is required.");
  return onSnapshot(doc(requireDb(), "properties", id), (snapshot) => {
    onData(snapshot.exists() ? propertyFromSnapshot(snapshot) : null);
  }, onError);
}
