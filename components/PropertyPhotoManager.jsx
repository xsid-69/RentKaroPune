"use client";

import { useState } from "react";
import Icon from "./Icon";
import ImageUploader from "./ImageUploader";
import { appendPropertyImages, cleanupPropertyImages, MAX_PROPERTY_IMAGES, uploadPropertyImages, validatePropertyImages } from "@/lib/cloudinaryStorage";

export default function PropertyPhotoManager({ propertyId, currentCount = 0, onUpdated }) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const remaining = Math.max(0, MAX_PROPERTY_IMAGES - currentCount);

  const changeFiles = (next) => {
    if (next.length > remaining) return setError(`You can add ${remaining} more ${remaining === 1 ? "photo" : "photos"}.`);
    setFiles(next); setError(""); setSuccess("");
  };

  const submit = async () => {
    const validation = validatePropertyImages(files);
    if (validation) return setError(validation);
    if (files.length > remaining) return setError(`You can add ${remaining} more photos.`);
    setBusy(true); setError(""); setSuccess("");
    let upload;
    try {
      upload = await uploadPropertyImages(files, setProgress);
      const result = await appendPropertyImages(propertyId, upload);
      setFiles([]); setProgress(100); setSuccess("Photos added to this property.");
      onUpdated?.(result.images);
    } catch (uploadError) {
      if (upload && !String(uploadError?.message || "").includes("timed out") && !String(uploadError?.message || "").includes("network error")) await cleanupPropertyImages(upload.batchId, upload.assets);
      setError(uploadError?.message || "Photos could not be added."); setProgress(0);
    } finally { setBusy(false); }
  };

  return <div className="relative">
    <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#222] bg-white px-4 text-sm font-bold text-[#222] shadow-sm transition hover:bg-[#f7f7f7] active:scale-[.98]"><Icon name="camera" size={17}/> Manage photos</button>
    {open && <section className="absolute right-0 top-[calc(100%+10px)] z-[var(--z-dropdown)] w-[min(92vw,460px)] rounded-2xl border border-[#dedede] bg-white p-4 shadow-[0_20px_60px_rgb(0_0_0/18%)]" aria-label="Manage property photos">
      <div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="m-0 text-lg font-extrabold">Add property photos</h2><p className="mb-0 mt-1 text-sm text-[#666]">{remaining} of {MAX_PROPERTY_IMAGES} photo slots available</p></div><button type="button" onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-full hover:bg-[#f2f2f2]" aria-label="Close photo manager"><Icon name="close"/></button></div>
      {remaining > 0 ? <><ImageUploader files={files} onChange={changeFiles} progress={progress} uploading={busy} statusLabel="Uploading to this property" onError={setError}/>{error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800" role="alert">{error}</p>}{success && <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-800" role="status">{success}</p>}<button type="button" disabled={busy || !files.length} onClick={submit} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ff5a1f] px-5 text-sm font-extrabold text-white hover:bg-[#d9470e] disabled:cursor-not-allowed disabled:opacity-45">{busy ? "Uploading…" : "Add to property"}</button></> : <p className="rounded-xl bg-[#f7f7f7] p-4 text-sm text-[#555]">This property already has the maximum number of photos.</p>}
    </section>}
  </div>;
}