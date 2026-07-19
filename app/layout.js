import "lenis/dist/lenis.css";
import "./globals.css";
import { MarketplaceProvider } from "@/lib/marketplace-context";
import AppShell from "@/components/AppShell";

export const metadata = {
  title: "RentKaro — Rent smarter, pay less brokerage",
  description: "Verified Pune rentals with transparent unlocks, visits, token holds, and loyalty brokerage.",
};

export const viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('has-js');" }} />
        <noscript><style>{`.reveal{opacity:1!important;transform:none!important;filter:none!important;}`}</style></noscript>
      </head>
      <body>
        <MarketplaceProvider>
          <AppShell>{children}</AppShell>
        </MarketplaceProvider>
      </body>
    </html>
  );
}
