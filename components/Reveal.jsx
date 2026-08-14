"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-reveal wrapper. Fades and lifts its children into view once, using an
 * IntersectionObserver (no scroll listeners) and honouring reduced-motion via CSS.
 */
export default function Reveal({ as: Tag = "div", className = "", delay = 0, children, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return undefined; }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <Tag ref={ref} className={`reveal ${visible ? "is-visible" : ""} ${className}`} style={{ "--reveal-delay": `${delay}ms` }} {...rest}>{children}</Tag>;
}
