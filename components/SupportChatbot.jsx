"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import CallRequestModal from "./CallRequestModal";
import Icon from "./Icon";
import { whatsappUrl } from "@/lib/whatsapp";

const FAQS = [
  { id: "find", label: "Find a home", answer: "Use Discover to search by Pune locality, monthly rent, BHK, furnishing, and property type. Only approved homes appear publicly." },
  { id: "verified", label: "Are homes verified?", answer: "Yes. A property stays private until an admin reviews and approves the listing." },
  { id: "login", label: "Do I need to sign in?", answer: "No. Browsing, WhatsApp enquiries, and callback requests are public. Accounts are optional for renters." },
  { id: "callback", label: "Request a callback", answer: "You can request a callback in English, Hindi, or Marathi and choose a preferred time." },
];

const SUPPORT_WHATSAPP_URL = whatsappUrl("Hi RentKaro Pune, I need help with a rental enquiry.");

function answerFor(input) {
  const value = input.toLowerCase();
  if (/find|search|home|flat|villa|bungalow|bhk|rent/.test(value)) return FAQS[0].answer;
  if (/verified|approved|genuine|safe/.test(value)) return FAQS[1].answer;
  if (/login|sign in|account/.test(value)) return FAQS[2].answer;
  if (/call|language|english|hindi|marathi/.test(value)) return FAQS[3].answer;
  if (/list|owner|property|upload/.test(value)) return "Approved owners, consultants, and admins can submit a property from the List property workspace.";
  if (/consultant|admin|dashboard/.test(value)) return "Consultant access starts with an application from your profile. Once an admin approves it, you can submit verified properties from your profile. The admin dashboard itself is limited to admins.";
  if (/whatsapp|contact|phone|help/.test(value)) return "Use the WhatsApp button below to contact our Pune team directly, or request a callback in your preferred language.";
  return "I’m the RentKaro automated support guide. I can help with property search, verification, accounts, listing a home, callbacks, and contacting the Pune team.";
}

export default function SupportChatbot({ propertyPage = false, suspended = false }) {
  const [open, setOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([{ id: "welcome", from: "bot", text: "Hi. I’m the RentKaro support guide. What can I help you with?" }]);
  const launcherRef = useRef(null);
  const inputRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => { if (suspended) setOpen(false); }, [suspended]);
  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);
  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, open]);

  const closePanel = () => {
    setOpen(false);
    window.setTimeout(() => launcherRef.current?.focus(), 0);
  };
  const ask = (question, answer) => {
    const value = question.trim();
    if (!value) return;
    const stamp = Date.now();
    setMessages((current) => [...current, { id: `user-${stamp}`, from: "user", text: value }, { id: `bot-${stamp}`, from: "bot", text: answer || answerFor(value) }]);
    setInput("");
  };
  const submit = (event) => {
    event.preventDefault();
    ask(input);
  };
  const requestCallback = () => {
    setOpen(false);
    window.setTimeout(() => setCallbackOpen(true), 100);
  };

  if (suspended && !callbackOpen) return null;

  return <>
    <div className={`fixed right-[calc(env(safe-area-inset-right)+1rem)] z-[55] ${propertyPage ? "bottom-[calc(env(safe-area-inset-bottom)+6.75rem)]" : "bottom-[calc(env(safe-area-inset-bottom)+1rem)]"}`}>
      {!open && <button ref={launcherRef} type="button" className="group relative grid size-16 place-items-center rounded-full bg-[#ff5a1f] text-white shadow-[0_18px_45px_rgb(217_71_14/35%)] transition-[transform,background-color] duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-1 hover:bg-[#df4610] active:scale-[.96] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#282622] motion-reduce:transform-none" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded="false" aria-label="Open RentKaro chat support"><span className="absolute -right-0.5 -top-0.5 size-4 rounded-full border-[3px] border-white bg-[#27a45c]" aria-hidden="true"/><Icon name="chat" size={28}/><span className="pointer-events-none absolute right-[calc(100%+0.75rem)] hidden whitespace-nowrap rounded-full bg-[#282622] px-3 py-2 text-xs font-extrabold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 sm:block">Chat with us</span></button>}
      {open && <section className="fixed inset-x-0 bottom-0 flex max-h-[min(84dvh,700px)] flex-col overflow-hidden rounded-t-[28px] bg-[#fbfaf7] pb-[env(safe-area-inset-bottom)] shadow-[0_-24px_80px_rgb(0_0_0/25%)] ring-1 ring-black/8 sm:inset-auto sm:bottom-[calc(env(safe-area-inset-bottom)+1rem)] sm:right-[calc(env(safe-area-inset-right)+1rem)] sm:h-[min(700px,calc(100dvh-2rem))] sm:w-[400px] sm:rounded-[28px]" role="dialog" aria-modal="false" aria-labelledby="support-title">
        <header className="relative overflow-hidden bg-[#282622] px-4 pb-4 pt-5 text-white"><div className="pointer-events-none absolute -right-8 -top-12 size-36 rounded-full bg-[#ff5a1f]/15 ring-[28px] ring-white/[0.025]"/><div className="relative flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="relative grid size-12 place-items-center rounded-2xl bg-[#ff5a1f] text-white shadow-[inset_0_1px_0_rgb(255_255_255/25%)]"><Icon name="chat" size={23}/><span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-[3px] border-[#282622] bg-[#36bd72]"/></span><div><h2 id="support-title" className="m-0 text-lg font-extrabold text-white">RentKaro Assistant</h2><p className="m-0 mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-white/60"><span className="size-1.5 rounded-full bg-[#36bd72]"/> Online · replies instantly</p></div></div><button type="button" className="grid size-11 place-items-center rounded-full bg-white/8 text-white ring-1 ring-white/15 transition-colors hover:bg-white/15" onClick={closePanel} aria-label="Close support chat"><Icon name="close"/></button></div></header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5">
          <p className="m-0 mb-4 text-center text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9a938a]">Today</p>
          <div className="grid gap-3" role="log" aria-live="polite" aria-relevant="additions text">{messages.map((message) => <div key={message.id} className={`flex items-end gap-2 ${message.from === "user" ? "justify-end" : "justify-start"}`}>{message.from === "bot" && <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#282622] text-white"><Icon name="chat" size={14}/></span>}<p className={`m-0 max-w-[82%] rounded-[18px] px-3.5 py-2.5 text-sm leading-6 shadow-[0_6px_18px_rgb(40_38_34/7%)] ${message.from === "user" ? "rounded-br-[5px] bg-[#ff5a1f] text-white" : "rounded-bl-[5px] bg-white text-[#282622] ring-1 ring-[#e8e2d9]"}`}>{message.text}</p></div>)}<div ref={endRef}/></div>
          <div className="mt-5"><p className="m-0 mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8a837b]">Quick replies</p><div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Common support questions">{FAQS.map((faq) => <button key={faq.id} type="button" className="min-h-10 shrink-0 rounded-full bg-white px-3 text-xs font-extrabold text-[#4f4a43] ring-1 ring-[#d8d3cb] transition-[background-color,color,transform] hover:bg-[#fff0e8] hover:text-[#c9410d] active:scale-[.98]" onClick={() => ask(faq.label, faq.answer)}>{faq.label}</button>)}</div></div>
          <div className="mt-5 grid grid-cols-2 gap-2"><a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#168a45] px-3 text-center text-xs font-extrabold text-white transition-[background-color,transform] hover:bg-[#10763a] active:scale-[.98]"><Icon name="phone" size={16}/> WhatsApp</a><button type="button" onClick={requestCallback} className="min-h-12 rounded-xl bg-[#fff0e8] px-3 text-xs font-extrabold text-[#c9410d] transition-[background-color,transform] hover:bg-[#ffe3d5] active:scale-[.98]">Request a call</button></div>
          <Link href="/properties" onClick={closePanel} className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#eeeae4] px-3 text-center text-xs font-extrabold text-[#282622] transition-colors hover:bg-[#e4ddd4]">Browse verified homes <Icon name="arrow" size={15}/></Link>
        </div>
        <form className="flex gap-2 border-t border-[#e7e1d8] bg-white p-3.5" onSubmit={submit}><label className="sr-only" htmlFor="support-question">Message RentKaro support</label><div className="flex min-w-0 flex-1 items-center rounded-full bg-[#f4f1ec] px-4 ring-1 ring-[#ded8cf] focus-within:ring-2 focus-within:ring-[#ff5a1f]/35"><input ref={inputRef} id="support-question" className="min-h-12 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none" value={input} onChange={(event) => setInput(event.target.value)} maxLength={180} placeholder="Type your message…"/></div><button type="submit" className="grid size-12 shrink-0 place-items-center rounded-full bg-[#ff5a1f] text-white transition-[background-color,transform] duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:bg-[#d9470e] active:scale-[.95]" aria-label="Send message"><Icon name="arrow" size={18}/></button></form>
      </section>}
    </div>
    <CallRequestModal open={callbackOpen} onClose={() => setCallbackOpen(false)}/>
  </>;
}