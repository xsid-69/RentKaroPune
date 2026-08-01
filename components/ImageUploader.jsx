"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import {
  MAX_PROPERTY_IMAGES,
  validatePropertyImages,
} from "@/lib/cloudinaryStorage";

export default function ImageUploader({ files, onChange, progress = 0, uploading = false, statusLabel = "Uploading photos securely", onError }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const next = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPreviews(next);
    return () => next.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [files]);

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    const next = [...files, ...incoming].slice(0, MAX_PROPERTY_IMAGES);
    const error = validatePropertyImages(next);
    if (error) return onError?.(error);
    if (files.length + incoming.length > MAX_PROPERTY_IMAGES) {
      onError?.(`Only the first ${MAX_PROPERTY_IMAGES} photos were added.`);
    } else {
      onError?.("");
    }
    onChange(next);
  };

  const removeFile = (index) => {
    if (uploading) return;
    onError?.("");
    onChange(files.filter((_, fileIndex) => fileIndex !== index));
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    if (!uploading) addFiles(event.dataTransfer.files);
  };
  return <section aria-labelledby="photo-upload-title">
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 id="photo-upload-title" className="m-0 text-lg font-bold text-[#0A0A0A]">Property photos</h2>
        <p className="mb-0 mt-1 text-sm leading-5 text-[#666]">JPG, PNG or WebP · up to 8 MB each</p>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-[#666]">{files.length}/{MAX_PROPERTY_IMAGES}</span>
    </div>

    <div
      className={`grid min-h-44 place-items-center rounded-2xl border-2 px-5 py-7 text-center transition-[border-color,background-color,transform] duration-200 motion-reduce:transition-none ${dragging ? "scale-[1.01] border-solid border-[#FF5B00] bg-[#FFF4ED]" : "border-dashed border-[#FF5B00]/40 bg-white hover:border-[#FF5B00]"} ${uploading ? "pointer-events-none opacity-60" : ""}`}
      onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
      onDrop={onDrop}
    >
      <div className="grid justify-items-center">
        <span className="grid size-12 place-items-center rounded-full bg-[#FFF0E7] text-[#FF5B00]" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M5 13v6h14v-6"/></svg>
        </span>
        <p className="mb-0 mt-3 font-bold text-[#161616]">Drop your photos here</p>
        <p className="mb-3 mt-1 text-sm text-[#666]">or choose them from your device</p>
        <button type="button" disabled={uploading || files.length >= MAX_PROPERTY_IMAGES} onClick={() => inputRef.current?.click()} className="min-h-11 rounded-xl bg-[#161616] px-5 text-sm font-bold text-white transition-[background-color,transform] duration-200 hover:bg-[#FF5B00] active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transform-none">Choose photos</button>
        <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading} onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} aria-label="Choose property photos" />
      </div>
    </div>
    {previews.length > 0 && <div className="mt-4 grid grid-cols-3 gap-2.5 min-[430px]:grid-cols-4 sm:gap-3" aria-label="Selected photo previews">
      {previews.map((preview, index) => <figure className="relative m-0 aspect-square overflow-hidden rounded-xl border border-[#E5E5E5] bg-[#F4F4F4]" key={`${preview.file.name}-${preview.file.lastModified}-${index}`}>
        <img src={preview.url} alt={`Selected property photo ${index + 1}`} className="h-full w-full object-cover" />
        <button type="button" disabled={uploading} onClick={() => removeFile(index)} className="absolute right-1.5 top-1.5 grid size-9 place-items-center rounded-full border border-white/30 bg-[#0A0A0A]/90 text-white shadow-lg transition-[background-color,transform] hover:bg-[#FF5B00] active:scale-95 disabled:opacity-50 motion-reduce:transform-none" aria-label={`Remove ${preview.file.name}`}><Icon name="close" size={17}/></button>
      </figure>)}
    </div>}

    {uploading && <div className="mt-5" role="status" aria-live="polite">
      <div className="mb-2 flex items-center justify-between gap-4 text-sm font-semibold text-[#161616]"><span>{statusLabel}</span><span className="tabular-nums">{progress}%</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-[#EAEAEA]" aria-hidden="true"><span className="block h-full rounded-full bg-[#FF5B00] transition-[transform] duration-200 ease-out motion-reduce:transition-none" style={{ transform: `translateX(${progress - 100}%)` }}/></div>
    </div>}
  </section>;
}
