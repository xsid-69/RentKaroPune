"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import { useAuth } from "@/lib/auth-context";

function Avatar({ user, size = 32 }) {
  const initial = (user.name || user.email || user.phone || "?").charAt(0).toUpperCase();
  if (user.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="grid place-items-center rounded-full bg-[#FF5B00] text-sm font-bold text-white"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

export default function AccountControl({ variant = "desktop", tabIndex, onNavigate }) {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false);
    };
    const handleKey = (event) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    onNavigate?.();
  };

  const label = (u) => u.name || u.email || u.phone || "Signed in";
  const sublabel = (u) => u.email || (u.phone ? `+91 ${u.phone}` : "");

  // ----- Mobile variant: full-width block inside the menu. -----
  if (variant === "mobile") {
    if (loading) return null;
    if (!user) {
      return (
        <Link
          href="/login"
          onClick={onNavigate}
          tabIndex={tabIndex}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FF5B00] px-4 py-3 text-[15px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Sign in / Register
        </Link>
      );
    }
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-3">
          <Avatar user={user} size={40} />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold text-white">{label(user)}</span>
            <span className="block truncate text-[13px] text-white/60">{sublabel(user)}</span>
          </span>
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          tabIndex={tabIndex}
          className="shrink-0 rounded-lg border border-white/20 px-3 py-2 text-[13px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5B00]"
        >
          Sign out
        </button>
      </div>
    );
  }

  // ----- Desktop variant: control in the header. -----
  if (loading) {
    return <span className="size-8 animate-pulse rounded-full bg-[#E5E5E5]" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        tabIndex={tabIndex}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#0A0A0A] px-4 text-sm font-semibold text-white hover:bg-[#161616] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5B00]"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        tabIndex={tabIndex}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="inline-flex items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5B00]"
      >
        <Avatar user={user} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[var(--z-nav)] w-64 rounded-xl border border-[#E5E5E5] bg-white p-2 shadow-[0_12px_32px_rgba(10,10,10,0.14)]"
        >
          <div className="flex items-center gap-3 border-b border-[#F0F0F0] px-2 py-2.5">
            <Avatar user={user} size={36} />
            <div className="min-w-0">
              <p className="m-0 truncate text-sm font-semibold text-[#0A0A0A]">{label(user)}</p>
              <p className="m-0 truncate text-xs text-[#666666]">{sublabel(user)}</p>
            </div>
          </div>
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-[#0A0A0A] hover:bg-[#F5F5F5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5B00]"
          >
            <Icon name="user" size={16} className="text-[#666666]" />
            Profile
          </Link>
          {(user.admin === 1 || user.role === "consultant") && (
            <Link
              href="/dashboard"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-[#0A0A0A] hover:bg-[#F5F5F5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5B00]"
            >
              <Icon name="grid" size={16} className="text-[#666666]" />
              Dashboard
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-[#0A0A0A] hover:bg-[#F5F5F5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5B00]"
          >
            <Icon name="arrow" size={16} className="rotate-180 text-[#FF5B00]" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
