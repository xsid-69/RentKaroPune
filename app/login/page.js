"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import Icon from "@/components/Icon";
import { useAuth } from "@/lib/auth-context";

function GoogleGlyph({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}

const perks = [
  { icon: "shield", title: "Verified listings only", copy: "Every home is checked before it goes live." },
  { icon: "wallet", title: "Transparent fees", copy: "Flat unlocks, visits and loyalty brokerage." },
  { icon: "user", title: "A broker on your side", copy: "Assigned support from unlock to move-in." },
];

const redirectTarget = () => {
  if (typeof window === "undefined") return "/dashboard";
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") ? next : "/dashboard";
};

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signInWithGoogle, loginWithPassword, registerWithPassword } = useAuth();

  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const redirected = useRef(false);

  // Once a session exists, leave the login page.
  useEffect(() => {
    if (!loading && user && !redirected.current) {
      redirected.current = true;
      router.replace(redirectTarget());
    }
  }, [user, loading, router]);

  const isRegister = mode === "register";

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setNotice("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setNotice("");
    setSubmitting(true);
    const action = isRegister ? registerWithPassword : loginWithPassword;
    const result = await action({ identifier, password, name });
    setSubmitting(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    // Registration succeeds without a session: send the user to sign in.
    if (result?.registered) {
      setMode("login");
      setPassword("");
      setName("");
      setNotice("Account created. Please sign in to continue.");
      return;
    }
    router.replace(redirectTarget());
  };

  const handleGoogle = async () => {
    if (googleBusy) return;
    setError("");
    setGoogleBusy(true);
    const result = await signInWithGoogle();
    setGoogleBusy(false);
    if (result?.cancelled) return;
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.replace(redirectTarget());
  };

  const inputBase =
    "w-full rounded-xl border border-[#E5E5E5] bg-white px-4 py-3 text-[15px] text-[#0A0A0A] placeholder:text-[#9A9A9A] transition-colors focus:border-[#FF5B00] focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20";

  return (
    <main className="relative isolate min-h-[calc(100vh-3.5rem)] overflow-hidden bg-[#F7F6F4]">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{ backgroundImage: "radial-gradient(60rem 40rem at 15% -10%, rgba(255,91,0,0.10), transparent 60%), radial-gradient(50rem 40rem at 110% 20%, rgba(10,10,10,0.06), transparent 55%)" }}
        aria-hidden="true"
      />
      <div className="mx-auto grid min-h-[calc(100vh-3.5rem)] w-full max-w-[1240px] items-stretch gap-0 px-4 py-8 lg:grid-cols-2 lg:gap-10 lg:py-12">
        {/* Brand / marketing panel */}
        <section className="relative hidden overflow-hidden rounded-[28px] bg-[#0A0A0A] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{ backgroundImage: "radial-gradient(38rem 30rem at 85% 0%, rgba(255,91,0,0.35), transparent 55%), radial-gradient(30rem 24rem at 0% 100%, rgba(255,91,0,0.14), transparent 60%)" }}
            aria-hidden="true"
          />
          <div className="relative">
            <Link href="/" aria-label="RentKaro home" className="inline-flex">
              <Logo size={34} className="gap-2 [&_svg]:!text-white [&_[data-logo-word]>span:first-child]:!text-white [&_[data-logo-word]>span:last-child]:!text-[#FF7A33] [&_[data-logo-word]]:text-[22px]" />
            </Link>
            <h1 className="mt-12 max-w-[16ch] text-[clamp(2rem,3.4vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">
              Rent smarter. Pay less brokerage.
            </h1>
            <p className="mt-4 max-w-[36ch] text-[15px] leading-relaxed text-white/65">
              Sign in to unlock verified Pune homes, book visits and track everything from one dashboard.
            </p>
          </div>
          <ul className="relative mt-10 grid gap-4">
            {perks.map((perk) => (
              <li key={perk.title} className="flex items-start gap-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-[#FF7A33] ring-1 ring-white/10">
                  <Icon name={perk.icon} size={20} />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold text-white">{perk.title}</span>
                  <span className="block text-[13px] leading-snug text-white/55">{perk.copy}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Auth card */}
        <section className="flex items-center justify-center">
          <div className="w-full max-w-[440px] rounded-[28px] border border-[#EAE8E4] bg-white p-6 shadow-[0_28px_80px_rgba(10,10,10,0.10)] sm:p-9">
            <div className="mb-6 lg:hidden">
              <Link href="/" aria-label="RentKaro home" className="inline-flex">
                <Logo size={30} className="gap-2 [&_svg]:!text-[#0A0A0A] [&_[data-logo-word]>span:first-child]:!text-[#0A0A0A] [&_[data-logo-word]>span:last-child]:!text-[#FF5B00] [&_[data-logo-word]]:text-[19px]" />
              </Link>
            </div>

            <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-[#0A0A0A]">
              {isRegister ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-1.5 text-[14px] text-[#666666]">
              {isRegister ? "Join RentKaro in a few seconds." : "Sign in to continue to your dashboard."}
            </p>

            {/* Segmented toggle */}
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-[#F3F1EE] p-1" role="tablist" aria-label="Choose sign in or register">
              <button
                type="button"
                role="tab"
                aria-selected={!isRegister}
                onClick={() => switchMode("login")}
                className={`min-h-10 rounded-lg text-sm font-semibold transition-colors ${!isRegister ? "bg-white text-[#0A0A0A] shadow-[0_2px_8px_rgba(10,10,10,0.08)]" : "text-[#666666] hover:text-[#0A0A0A]"}`}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isRegister}
                onClick={() => switchMode("register")}
                className={`min-h-10 rounded-lg text-sm font-semibold transition-colors ${isRegister ? "bg-white text-[#0A0A0A] shadow-[0_2px_8px_rgba(10,10,10,0.08)]" : "text-[#666666] hover:text-[#0A0A0A]"}`}
              >
                Register
              </button>
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleBusy}
              className="mt-6 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#E5E5E5] bg-white text-[15px] font-semibold text-[#0A0A0A] transition-colors hover:border-[#0A0A0A] disabled:opacity-60"
            >
              <GoogleGlyph />
              {googleBusy ? "Opening Google…" : "Continue with Google"}
            </button>

            <div className="my-5 flex items-center gap-3 text-[12px] font-medium uppercase tracking-wider text-[#9A9A9A]">
              <span className="h-px flex-1 bg-[#EAE8E4]" />
              or
              <span className="h-px flex-1 bg-[#EAE8E4]" />
            </div>

            {notice && !error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#BFE3C6] bg-[#EEF9F0] px-3.5 py-2.5 text-[13px] font-medium text-[#1A7A3C]" role="status">
                <Icon name="check" size={16} className="mt-0.5 shrink-0" />
                <span>{notice}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#F3C7B8] bg-[#FDF1EC] px-3.5 py-2.5 text-[13px] font-medium text-[#B23A10]" role="alert">
                <Icon name="info" size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-3.5" noValidate>
              {isRegister && (
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-[#0A0A0A]">Full name</span>
                  <input
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Aarav Sharma"
                    className={inputBase}
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-[#0A0A0A]">Email or phone</span>
                <input
                  type="text"
                  inputMode="email"
                  autoComplete="username"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="you@email.com or 98765 43210"
                  className={inputBase}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-[#0A0A0A]">Password</span>
                <span className="relative block">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={isRegister ? "At least 8 characters" : "Your password"}
                    className={`${inputBase} pr-12`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-[#666666] hover:text-[#0A0A0A] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#FF5B00]"
                  >
                    <Icon name={showPassword ? "info" : "lock"} size={18} />
                  </button>
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 min-h-12 rounded-xl bg-[#FF5B00] text-[15px] font-bold text-white transition-colors hover:bg-[#E24E00] disabled:opacity-60"
              >
                {submitting ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
              </button>
            </form>

            <p className="mt-5 text-center text-[13px] text-[#666666]">
              {isRegister ? "Already have an account? " : "New to RentKaro? "}
              <button
                type="button"
                onClick={() => switchMode(isRegister ? "login" : "register")}
                className="font-semibold text-[#FF5B00] hover:underline"
              >
                {isRegister ? "Sign in" : "Create one"}
              </button>
            </p>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-[#9A9A9A]">
              By continuing you agree to RentKaro&apos;s Terms and acknowledge the Privacy Policy.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
