import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";

export const CLOUDINARY_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const CLOUDINARY_FORMATS = ["jpg", "jpeg", "png", "webp"];
export const MAX_PROPERTY_IMAGES = 8;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ROOT_FOLDER = "rentkaropune/properties";

function config() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary server credentials are not configured.");
  return { cloudName, apiKey, apiSecret };
}

export function isTrustedMutationRequest(request) {
  const site = request.headers.get("sec-fetch-site");
  if (site === "cross-site") return false;
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export function canManageListings(user) {
  return Boolean(user && (user.admin === 1 || ["consultant", "broker", "owner"].includes(user.role)));
}

export function validateImageDescriptors(files) {
  if (!Array.isArray(files) || files.length < 1 || files.length > MAX_PROPERTY_IMAGES) return `Choose between 1 and ${MAX_PROPERTY_IMAGES} photos.`;
  for (const file of files) {
    if (!file || typeof file.name !== "string" || file.name.length < 1 || file.name.length > 180) return "Every photo must have a valid filename.";
    if (!CLOUDINARY_IMAGE_TYPES.includes(file.type)) return `${file.name} must be a JPG, PNG, or WebP image.`;
    if (!Number.isInteger(file.size) || file.size < 1 || file.size > MAX_IMAGE_BYTES) return `${file.name} must be smaller than 8 MB.`;
  }
  return "";
}

export function signUploadBatch(userId, count) {
  const { cloudName, apiKey, apiSecret } = config();
  const timestamp = Math.floor(Date.now() / 1000);
  const batchId = randomUUID();
  const folder = `${ROOT_FOLDER}/${userId}/${batchId}`;
  const uploads = Array.from({ length: count }, () => {
    const publicId = randomBytes(16).toString("hex");
    const signature = createHash("sha1").update(`folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest("hex");
    return { folder, publicId, timestamp, signature };
  });
  return { cloudName, apiKey, batchId, uploads };
}

const validBatchId = (value) => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value);
const prefixFor = (userId, batchId) => `${ROOT_FOLDER}/${userId}/${batchId}/`;

export function validateOwnedAssets(userId, batchId, assets) {
  if (!validBatchId(batchId)) return { error: "Invalid photo upload batch." };
  if (!Array.isArray(assets) || assets.length < 1 || assets.length > MAX_PROPERTY_IMAGES) return { error: `Submit between 1 and ${MAX_PROPERTY_IMAGES} uploaded photos.` };
  const { cloudName } = config();
  const prefix = prefixFor(userId, batchId);
  const seen = new Set();
  const normalized = [];
  for (const asset of assets) {
    if (!asset || typeof asset.publicId !== "string" || !asset.publicId.startsWith(prefix) || seen.has(asset.publicId)) return { error: "One or more uploaded photos are invalid." };
    let url;
    try { url = new URL(asset.secureUrl); } catch { return { error: "One or more photo URLs are invalid." }; }
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com" || !url.pathname.startsWith(`/${cloudName}/image/upload/`)) return { error: "Only photos from the configured Cloudinary account are accepted." };
    if (!CLOUDINARY_FORMATS.includes(String(asset.format).toLowerCase()) || !Number.isInteger(asset.bytes) || asset.bytes < 1 || asset.bytes > MAX_IMAGE_BYTES) return { error: "One or more uploaded photos have an invalid format or size." };
    seen.add(asset.publicId);
    normalized.push({ secureUrl: url.toString(), publicId: asset.publicId, assetId: String(asset.assetId || "").slice(0, 100), bytes: asset.bytes, format: String(asset.format).toLowerCase(), width: Number(asset.width) || 0, height: Number(asset.height) || 0 });
  }
  return { assets: normalized };
}

export async function verifyCloudinaryAssets(assets) {
  const { cloudName, apiKey, apiSecret } = config();
  const authorization = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
  const verified = await Promise.all(assets.map(async (asset) => {
    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload/${encodeURIComponent(asset.publicId)}`;
    const response = await fetch(endpoint, { headers: { Authorization: authorization }, cache: "no-store", signal: AbortSignal.timeout(12_000) });
    if (!response.ok) throw new Error("Uploaded Cloudinary asset could not be verified.");
    const data = await response.json();
    if (data.public_id !== asset.publicId || data.resource_type !== "image" || data.secure_url !== asset.secureUrl || data.bytes !== asset.bytes) throw new Error("Uploaded Cloudinary asset metadata did not match.");
    return asset;
  }));
  return verified;
}

export async function destroyOwnedAssets(userId, batchId, publicIds) {
  if (!validBatchId(batchId) || !Array.isArray(publicIds)) throw new Error("Invalid cleanup request.");
  const prefix = prefixFor(userId, batchId);
  const ids = [...new Set(publicIds)].filter((id) => typeof id === "string" && id.startsWith(prefix)).slice(0, MAX_PROPERTY_IMAGES);
  const { cloudName, apiKey, apiSecret } = config();
  const results = await Promise.allSettled(ids.map(async (publicId) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash("sha1").update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest("hex");
    const body = new URLSearchParams({ public_id: publicId, timestamp: String(timestamp), api_key: apiKey, signature });
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, { method: "POST", body, signal: AbortSignal.timeout(12_000) });
    if (!response.ok) throw new Error(`Cloudinary cleanup failed for ${publicId}.`);
    return response.json();
  }));
  const failed = results.filter((result) => result.status === "rejected").length;
  if (failed) console.error(`Cloudinary cleanup left ${failed} asset(s) for retry.`);
  return { deleted: ids.length - failed, failed };
}