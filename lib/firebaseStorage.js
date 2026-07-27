"use client";

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { storage } from "./firebase";

export const MAX_PROPERTY_IMAGES = 8;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function safeFileName(name) {
  const extension = name.includes(".") ? `.${name.split(".").pop().toLowerCase()}` : "";
  const base = name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "");
  return `${base || "property-photo"}${extension}`;
}

export function validatePropertyImages(files) {
  if (!Array.isArray(files) || files.length === 0) return "Add at least one property photo.";
  if (files.length > MAX_PROPERTY_IMAGES) return `Upload up to ${MAX_PROPERTY_IMAGES} photos.`;
  const invalidType = files.find((file) => !file.type?.startsWith("image/"));
  if (invalidType) return `${invalidType.name} is not an image.`;
  const oversized = files.find((file) => file.size > MAX_IMAGE_BYTES);
  if (oversized) return `${oversized.name} is larger than 8 MB.`;
  return "";
}

function uploadOne(file, index, ownerId, progressByFile, onProgress) {
  const timestamp = Date.now() + index;
  const storageRef = ref(storage, `properties/${timestamp}_${safeFileName(file.name)}`);
  const task = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    cacheControl: "public,max-age=31536000,immutable",
    customMetadata: { ownerId },
  });

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      callback(value);
    };
    const timeoutId = window.setTimeout(() => {
      finish(reject, new Error("Photo upload timed out. Check your connection and retry."));
      task.cancel();
    }, 60_000);

    task.on("state_changed", (snapshot) => {
      progressByFile[index] = snapshot.totalBytes ? snapshot.bytesTransferred / snapshot.totalBytes : 0;
      const overall = progressByFile.reduce((sum, value) => sum + value, 0) / progressByFile.length;
      onProgress?.(Math.round(overall * 100));
    }, (error) => finish(reject, error), () => {
      getDownloadURL(task.snapshot.ref)
        .then((url) => finish(resolve, { url, storageRef: task.snapshot.ref }))
        .catch((error) => finish(reject, error));
    });
  });
}

export async function assertFirebaseStorageReady() {
  try {
    const response = await fetch("/api/storage/health", {
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ready) throw new Error(data.error || "Firebase Storage is unavailable.");
  } catch (error) {
    if (error?.name === "TimeoutError") throw new Error("Storage readiness check timed out. Check your connection and retry.");
    throw error;
  }
}

export async function uploadPropertyImages(files, onProgress, ownerId) {
  if (!storage) throw new Error("Firebase Storage is not configured.");
  if (!ownerId) throw new Error("Sign in before uploading property photos.");
  const validationError = validatePropertyImages(files);
  if (validationError) throw new Error(validationError);

  onProgress?.(0);
  const progressByFile = files.map(() => 0);
  const results = await Promise.allSettled(
    files.map((file, index) => uploadOne(file, index, ownerId, progressByFile, onProgress))
  );
  const completed = results.filter((result) => result.status === "fulfilled").map((result) => result.value);
  const failed = results.find((result) => result.status === "rejected");

  if (failed) {
    await Promise.allSettled(completed.map((item) => deleteObject(item.storageRef)));
    const code = failed.reason?.code;
    const reason = code === "storage/unauthorized"
      ? "Your account is not authorized to upload property photos. Deploy storage.rules and sign in again."
      : code === "storage/bucket-not-found"
        ? "Firebase Storage has no bucket. Enable Storage in Firebase Console and retry."
        : failed.reason?.message?.includes("timed out")
          ? failed.reason.message
          : "One or more photos could not be uploaded. Please retry.";
    throw new Error(reason);
  }

  onProgress?.(100);
  return completed.map((item) => item.url);
}

export async function deletePropertyImages(urls) {
  if (!storage || !Array.isArray(urls)) return;
  await Promise.allSettled(urls.map((url) => deleteObject(ref(storage, url))));
}
