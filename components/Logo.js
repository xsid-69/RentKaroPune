export default function Logo({ withWordmark = true, size = 46, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* RK monogram tile — brand orange with a white monogram, consistent everywhere. */}
      <span
        data-logo-mark
        className="grid shrink-0 place-items-center overflow-hidden rounded-[26%] bg-[#F15A29] font-black uppercase leading-none text-white shadow-[inset_0_1px_0_rgb(255_255_255/18%)]"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.46), letterSpacing: "-0.05em" }}
        aria-hidden="true"
      >
        RK
      </span>
      {withWordmark && (
        <span data-logo-word className="inline-flex items-baseline gap-[0.26em] text-[25px] font-black leading-none tracking-[-.045em] max-[720px]:text-[19px]">
          <span className="text-[#0A0A0A]">Rent</span>
          <span className="text-[#ff5a1f]">Karo</span>
        </span>
      )}
      {!withWordmark && <span className="absolute -m-px size-px overflow-hidden border-0 p-0 [clip:rect(0_0_0_0)]">RentKaro</span>}
    </span>
  );
}
