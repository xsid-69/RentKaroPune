/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

// Content Security Policy. Kept explicit so third-party origins are auditable.
// 'unsafe-inline' is required for Next.js hydration/runtime and Tailwind's
// injected styles; everything else is locked to known first/third parties.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.googleusercontent.com https://lh3.googleusercontent.com https:",
  "font-src 'self' https://fonts.gstatic.com data:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://*.googleapis.com",
  "connect-src 'self' https://*.googleapis.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://api.cloudinary.com https://res.cloudinary.com",
  "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com",
  "media-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  // Allow Google/Firebase auth popups while isolating the browsing context.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Origin-Agent-Cluster", value: "?1" },
];

// HSTS only makes sense over HTTPS in production.
if (isProd) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  });
}

// Sensitive, authenticated JSON must never be cached by browsers or CDNs.
const noStoreHeaders = [
  { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
  { key: "Pragma", value: "no-cache" },
  { key: "Expires", value: "0" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Keep firebase-admin (and its ESM-only deps like jose) out of the bundler so
  // Node resolves them natively at runtime. Bundling breaks with ERR_REQUIRE_ESM
  // on Vercel because jose's ESM build gets require()'d.
  serverExternalPackages: ["firebase-admin"],
  async headers() {
    // Security headers apply to every route; the API additionally gets no-store
    // so authenticated/personal JSON is never cached by browsers or CDNs.
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/api/:path*", headers: noStoreHeaders },
    ];
  },
};

export default nextConfig;
