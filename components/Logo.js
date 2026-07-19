export default function Logo({ withWordmark = true, size = 46, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        className="shrink-0 overflow-visible text-[#050505] transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)]"
        width={size}
        height={size}
        viewBox="0 0 64 64"
        role="img"
        aria-label="RentKaro key logo"
        focusable="false"
      >
        <circle cx="21.5" cy="19" r="13.25" fill="none" stroke="currentColor" strokeWidth="8.5" />
        <path d="M18.1 31.2v20" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
        <path d="M31 28.7 51.7 49.8" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
        <path d="m39.2 37.5 7.3 7.3-8.4 8.4-7.3-7.3Z" fill="currentColor" />
      </svg>
      {withWordmark && <span data-logo-word className="inline-flex items-baseline text-[25px] font-black leading-none tracking-[-.055em] max-[720px]:text-[19px]"><span className="text-[#050505]">Rent</span><span className="text-[#ff5a1f]">Karo</span></span>}
      {!withWordmark && <span className="absolute -m-px size-px overflow-hidden border-0 p-0 [clip:rect(0_0_0_0)]">RentKaro</span>}
    </span>
  );
}
