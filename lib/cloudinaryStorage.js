"use client";

export const MAX_PROPERTY_IMAGES = 8;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validatePropertyImages(files) {
  if (!Array.isArray(files) || !files.length) return "Add at least one property photo.";
  if (files.length > MAX_PROPERTY_IMAGES) return `Upload up to ${MAX_PROPERTY_IMAGES} photos.`;
  const invalid = files.find((file) => !IMAGE_TYPES.includes(file.type));
  if (invalid) return `${invalid.name} must be a JPG, PNG, or WebP image.`;
  const empty = files.find((file) => !Number.isInteger(file.size) || file.size < 1);
  if (empty) return `${empty.name} is empty or unreadable.`;
  const oversized = files.find((file) => file.size > MAX_IMAGE_BYTES);
  if (oversized) return `${oversized.name} is larger than 8 MB.`;
  return "";
}

async function readError(response, fallback) {
  const data = await response.json().catch(() => ({}));
  return data.error || fallback;
}

async function requestSignatures(files) {
  const response = await fetch("/api/uploads/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files: files.map(({ name, type, size }) => ({ name, type, size })) }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(await readError(response, "Photo upload could not be authorized."));
  return response.json();
}

function uploadOne(file, authorization, cloudName, apiKey, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const timeout = window.setTimeout(() => { request.abort(); reject(new Error("Photo upload timed out. Check your connection and retry.")); }, 90_000);
    request.open("POST", `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`);
    request.upload.onprogress = (event) => event.lengthComputable && onProgress(event.loaded / event.total);
    request.onerror = () => reject(new Error("A network error interrupted the photo upload."));
    request.onabort = () => reject(new Error("Photo upload was cancelled."));
    request.onload = () => {
      window.clearTimeout(timeout);
      const data = JSON.parse(request.responseText || "{}");
      if (request.status < 200 || request.status >= 300) return reject(new Error(data.error?.message || "Cloudinary rejected a photo."));
      resolve({ secureUrl: data.secure_url, publicId: data.public_id, assetId: data.asset_id, bytes: data.bytes, format: data.format, width: data.width, height: data.height });
    };
    const body = new FormData();
    body.append("file", file); body.append("api_key", apiKey); body.append("timestamp", String(authorization.timestamp));
    body.append("folder", authorization.folder); body.append("public_id", authorization.publicId); body.append("signature", authorization.signature);
    request.send(body);
  });
}

export async function cleanupPropertyImages(batchId, assets) {
  if (!batchId || !assets?.length) return;
  await fetch("/api/uploads/cloudinary/cleanup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ batchId, publicIds: assets.map((asset) => asset.publicId) }),
    signal: AbortSignal.timeout(20_000),
  }).catch(() => {});
}

export async function uploadPropertyImages(files, onProgress) {
  const validationError = validatePropertyImages(files);
  if (validationError) throw new Error(validationError);
  let authorization;
  try { authorization = await requestSignatures(files); }
  catch (error) { if (error?.name === "TimeoutError") throw new Error("Upload authorization timed out. Check your connection and retry."); throw error; }
  const progressByFile = files.map(() => 0);
  const updateProgress = (index, value) => {
    progressByFile[index] = value;
    onProgress?.(Math.round(progressByFile.reduce((sum, item) => sum + item, 0) / files.length * 100));
  };
  onProgress?.(0);
  const results = await Promise.allSettled(files.map((file, index) => uploadOne(file, authorization.uploads[index], authorization.cloudName, authorization.apiKey, (value) => updateProgress(index, value))));
  const assets = results.filter((result) => result.status === "fulfilled").map((result) => result.value);
  const failed = results.find((result) => result.status === "rejected");
  if (failed) {
    await cleanupPropertyImages(authorization.batchId, assets);
    throw new Error(failed.reason?.message || "One or more photos could not be uploaded. Please retry.");
  }
  onProgress?.(100);
  return { assets, batchId: authorization.batchId };
}

export async function submitProperty(form, upload) {
  let response;
  try {
    response = await fetch("/api/properties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ form, ...upload }), signal: AbortSignal.timeout(30_000) });
  } catch (error) {
    if (error?.name === "TimeoutError") throw new Error("Property submission timed out. Your photos are safe; please retry.");
    throw new Error("A network error interrupted property submission. Please retry.");
  }
  if (!response.ok) throw new Error(await readError(response, "The property could not be submitted."));
  return response.json();
}

export async function appendPropertyImages(propertyId, upload) {
  let response;
  try {
    response = await fetch(`/api/properties/${encodeURIComponent(propertyId)}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(upload),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    if (error?.name === "TimeoutError") throw new Error("Photo update timed out. Refresh before retrying.");
    throw new Error("A network error interrupted the photo update.");
  }
  if (!response.ok) throw new Error(await readError(response, "Property photos could not be updated."));
  return response.json();
}