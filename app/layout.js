import "lenis/dist/lenis.css";
import "./globals.css";
import { MarketplaceProvider } from "@/lib/marketplace-context";
import { AuthProvider } from "@/lib/auth-context";
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
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="m-0 font-[Poppins,_Segoe_UI,_sans-serif] text-base leading-6 text-[#0A0A0A] selection:bg-[#FF5B00] selection:text-white">
        <AuthProvider>
          <MarketplaceProvider>
            <AppShell>{children}</AppShell>
          </MarketplaceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
