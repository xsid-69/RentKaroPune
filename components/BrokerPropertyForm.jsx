"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import ImageUploader from "./ImageUploader";
import { PUNE_LOCATIONS } from "@/lib/pune-locations";
import {
  cleanupPropertyImages,
  submitProperty,
  uploadPropertyImages,
  validatePropertyImages,
} from "@/lib/cloudinaryStorage";

const STEPS = ["Basics", "Rent & amenities", "Photos"];
const AMENITIES = ["Parking", "Lift", "Gym", "Power Backup", "Security", "CCTV", "Balcony", "Water Supply"];
const EMPTY_FORM = {
  title: "", bhk: "2BHK", propertyType: "Flat", location: "Viman Nagar, Pune",
  address: "", rent: "", deposit: "", amenities: [],
};
const field = "grid gap-2";
const label = "text-sm font-bold text-[#161616]";
const input = "min-h-12 w-full rounded-xl border border-[#D9D9D9] bg-white px-4 text-base text-[#0A0A0A] outline-none transition-[border-color,box-shadow] focus:border-[#FF5B00] focus:ring-4 focus:ring-[#FF5B00]/10 disabled:bg-[#F4F4F4]";

export default function BrokerPropertyForm({ user }) {
  const router = useRouter();
  const errorRef = useRef(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [files, setFiles] = useState([]);
  const [pendingUpload, setPendingUpload] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [progress, setProgress] = useState(0);
  const [submitStage, setSubmitStage] = useState("Preparing secure upload");
  const [submitting, setSubmitting] = useState(false);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const changeFiles = (nextFiles) => {
    if (pendingUpload) cleanupPropertyImages(pendingUpload.batchId, pendingUpload.assets);
    setPendingUpload(null);
    setFiles(nextFiles);
    setError("");
  };

  const toggleAmenity = (amenity) => {
    setForm((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity],
    }));
    setError("");
  };
  const validateStep = (currentStep) => {
    if (currentStep === 0) {
      if (form.title.trim().length < 8) return "Use a clear title with at least 8 characters.";
      if (!form.location || form.address.trim().length < 10) return "Select a locality and add the full street address.";
    }
    if (currentStep === 1) {
      if (!Number.isFinite(Number(form.rent)) || Number(form.rent) < 1000) return "Enter a valid monthly rent of at least ₹1,000.";
      if (!Number.isFinite(Number(form.deposit)) || Number(form.deposit) < 0) return "Enter a valid refundable deposit.";
      if (!form.amenities.length) return "Select at least one amenity.";
    }
    if (currentStep === 2) return validatePropertyImages(files);
    return "";
  };

  const showError = (message) => {
    setError(message);
    window.setTimeout(() => errorRef.current?.focus(), 0);
  };

  const continueForm = () => {
    const message = validateStep(step);
    if (message) return showError(message);
    setError("");
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (event) => {
    event.preventDefault();
    const message = validateStep(2);
    if (message) return showError(message);
    setSubmitting(true);
    setError("");
    setProgress(0);
    let upload = pendingUpload;
    try {
      if (!upload) {
        setSubmitStage("Uploading photos securely");
        upload = await uploadPropertyImages(files, setProgress);
        setPendingUpload(upload);
      } else {
        setProgress(100);
      }
      setSubmitStage("Saving property details");
      await submitProperty(form, upload);
      setPendingUpload(null);
      setToast("Property uploaded and sent for admin review.");
      setForm(EMPTY_FORM);
      setFiles([]);
      setProgress(100);
      window.setTimeout(() => router.push("/properties"), 1200);
    } catch (uploadError) {
      if (upload && !String(uploadError?.message || "").includes("timed out") && !String(uploadError?.message || "").includes("network error")) {
        await cleanupPropertyImages(upload.batchId, upload.assets);
        setPendingUpload(null);
      }
      showError(uploadError?.message || "The property could not be submitted. Please retry.");
      setProgress(0);
    } finally {
      setSubmitting(false);
    }
  };

  return <>
    <section className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-[0_18px_60px_rgb(10_10_10/8%)]">
      <div className="border-b border-[#EAEAEA] px-4 py-5 sm:px-7">
        <div className="flex items-center justify-between gap-4"><p className="m-0 text-sm font-bold text-[#FF5B00]">Step {step + 1} of {STEPS.length}</p><p className="m-0 text-sm font-semibold text-[#666]">{STEPS[step]}</p></div>
        <div className="mt-3 grid grid-cols-3 gap-2" aria-label="Property form progress">{STEPS.map((item, index) => <span key={item} className={`h-1.5 rounded-full transition-colors duration-200 ${index <= step ? "bg-[#FF5B00]" : "bg-[#E5E5E5]"}`}><span className="sr-only">{item}{index < step ? " completed" : index === step ? " current" : " upcoming"}</span></span>)}</div>
      </div>
      <form className="p-4 sm:p-7" onSubmit={submit} noValidate>
        {error && <p ref={errorRef} tabIndex="-1" role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-5 text-red-800"><Icon name="info" size={18} className="mt-0.5 shrink-0"/>{error}</p>}

        {step === 0 && <fieldset className="grid gap-5 border-0 p-0"><legend className="mb-1 text-xl font-extrabold tracking-[-0.025em] text-[#0A0A0A]">Basic info & location</legend>
          <label className={field}><span className={label}>Listing title <span className="text-[#FF5B00]">*</span></span><input className={input} name="title" value={form.title} onChange={update} placeholder="Luxury 2BHK Flat in Viman Nagar" autoComplete="off" required/></label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className={field}><span className={label}>Configuration</span><select className={input} name="bhk" value={form.bhk} onChange={update}>{["1BHK", "2BHK", "3BHK", "4BHK+"].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className={field}><span className={label}>Property type</span><select className={input} name="propertyType" value={form.propertyType} onChange={update}>{["Flat", "Villa", "Bungalow"].map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          <label className={field}><span className={label}>Pune locality <span className="text-[#FF5B00]">*</span></span><select className={input} name="location" value={form.location} onChange={update}>{PUNE_LOCATIONS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label className={field}><span className={label}>Full street address <span className="text-[#FF5B00]">*</span></span><textarea className={`${input} min-h-24 resize-y py-3`} name="address" value={form.address} onChange={update} placeholder="Building, street, landmark and PIN code" rows="3" required/><small className="text-sm leading-5 text-[#666]">The exact address is stored for verification and should only be shared with qualified renters.</small></label>
        </fieldset>}

        {step === 1 && <fieldset className="grid gap-6 border-0 p-0"><legend className="mb-1 text-xl font-extrabold tracking-[-0.025em] text-[#0A0A0A]">Rent & amenities</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className={field}><span className={label}>Monthly rent <span className="text-[#FF5B00]">*</span></span><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#666]">₹</span><input className={`${input} pl-9 tabular-nums`} name="rent" value={form.rent} onChange={update} type="number" min="1000" step="500" inputMode="numeric" placeholder="30000" required/></div></label>
            <label className={field}><span className={label}>Refundable deposit <span className="text-[#FF5B00]">*</span></span><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#666]">₹</span><input className={`${input} pl-9 tabular-nums`} name="deposit" value={form.deposit} onChange={update} type="number" min="0" step="1000" inputMode="numeric" placeholder="90000" required/></div></label>
          </div>
          <fieldset className="border-0 p-0"><legend className={`${label} mb-3`}>Available amenities <span className="text-[#FF5B00]">*</span></legend><div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">{AMENITIES.map((amenity) => {
            const selected = form.amenities.includes(amenity);
            return <button key={amenity} type="button" aria-pressed={selected} onClick={() => toggleAmenity(amenity)} className={`min-h-12 rounded-xl border px-3 text-left text-sm font-bold transition-[border-color,background-color,color,transform] duration-200 active:scale-95 motion-reduce:transform-none ${selected ? "border-[#FF5B00] bg-[#FFF0E7] text-[#B63F00]" : "border-[#D9D9D9] bg-white text-[#444] hover:border-[#FF5B00]"}`}><span className="mr-2 inline-flex w-4 justify-center" aria-hidden="true">{selected ? <Icon name="check" size={15}/> : "+"}</span>{amenity}</button>;
          })}</div></fieldset>
        </fieldset>}

        {step === 2 && <div className="grid gap-6"><ImageUploader files={files} onChange={changeFiles} progress={progress} uploading={submitting} statusLabel={submitStage} onError={setError}/><aside className="rounded-xl bg-[#F6F6F6] p-4"><h2 className="m-0 text-base font-bold text-[#161616]">Before you submit</h2><ul className="mb-0 mt-2 grid gap-1.5 pl-5 text-sm leading-5 text-[#555]"><li>Use recent, well-lit photos of the actual property.</li><li>The listing stays pending until an admin verifies it.</li><li>Rent and deposit must match the broker agreement.</li></ul></aside></div>}

        <div className="mt-7 flex flex-col-reverse gap-3 min-[430px]:flex-row min-[430px]:justify-between">
          {step > 0 ? <button type="button" disabled={submitting} onClick={() => { setStep((current) => current - 1); setError(""); }} className="min-h-12 rounded-xl border border-[#CFCFCF] bg-white px-6 text-sm font-bold text-[#161616] transition-[border-color,transform] hover:border-[#161616] active:scale-95 disabled:opacity-45 motion-reduce:transform-none">Back</button> : <span/>}
          {step < 2 ? <button type="button" onClick={continueForm} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#FF5B00] px-6 text-sm font-extrabold text-white transition-[background-color,transform] hover:bg-[#D94D00] active:scale-95 motion-reduce:transform-none">Continue <Icon name="arrow" size={17}/></button> : <button type="submit" disabled={submitting} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#FF5B00] px-6 text-sm font-extrabold text-white transition-[background-color,transform] hover:bg-[#D94D00] active:scale-95 disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transform-none">{submitting ? submitStage : "Submit for review"}<Icon name={submitting ? "lock" : "arrow"} size={17}/></button>}
        </div>
      </form>
    </section>

    <div className={`pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-4 right-4 z-[var(--z-toast)] ml-auto max-w-sm rounded-xl border border-[#161616] bg-[#0A0A0A] px-4 py-3 text-sm font-semibold text-white shadow-2xl transition-[opacity,transform] duration-200 ${toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`} role="status" aria-live="polite"><span className="inline-flex items-center gap-2"><Icon name="check" className="text-[#FF5B00]"/>{toast}</span></div>
  </>;
}
