"use client";

import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
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
  return {
    ...data,
    id: data.id || id,
    bhk: compactBhk(data.bhk),
    rent: Number(data.rent) || 0,
    deposit: Number(data.deposit) || 0,
    images: images.length ? images : [FALLBACK_IMAGE],
    amenities,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || (typeof data.createdAt === "string" ? data.createdAt : null),
  };
}

export function toMarketplaceProperty(property) {
  const bhk = compactBhk(property.bhk).replace("BHK+", " BHK").replace("BHK", " BHK");
  const locality = property.locality || property.location || "Pune";
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
    owner: property.owner || property.contact?.agent || "Verified owner",
    description: property.description || `${bhk} ${property.propertyType || "home"} available for rent in ${locality}. Contact details are shared after verification and unlock.`,
  };
}

function propertyFromSnapshot(snapshot) {
  return normalizeFirestoreProperty(snapshot.data(), snapshot.id);
}

export async function createPropertyRecord(form, imageUrls, brokerId) {
  const firestore = requireDb();
  const propertyRef = doc(collection(firestore, "properties"));
  const property = {
    id: propertyRef.id,
    title: form.title.trim(),
    bhk: form.bhk,
    propertyType: form.propertyType,
    location: form.location.trim(),
    address: form.address.trim(),
    rent: Number(form.rent),
    deposit: Number(form.deposit),
    images: imageUrls,
    amenities: form.amenities,
    brokerId,
    status: "pending",
    createdAt: serverTimestamp(),
  };
  await setDoc(propertyRef, property);
  return propertyRef.id;
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
