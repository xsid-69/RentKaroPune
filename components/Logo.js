export default function Logo({ withWordmark = true, size = 46, className = "" }) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <span
        className="block shrink-0 overflow-hidden rounded-[22%]"
        style={{ width: size, height: size }}
      >
        <img
          src="/rentkaropune-logo.png"
          alt="RentKaro"
          className="h-full w-full scale-[1.32] object-cover"
          decoding="async"
        />
      </span>
    </span>
  );
}
