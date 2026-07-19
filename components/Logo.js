export default function Logo({ withWordmark = true, size = 46, className = "" }) {
  return (
    <span className={`logo ${className}`}>
      <svg
        className="logo-mark"
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
      {withWordmark && <span className="logo-word"><span className="logo-rent">Rent</span><span className="logo-karo">Karo</span></span>}
      {!withWordmark && <span className="visually-hidden">RentKaro</span>}
    </span>
  );
}
