import type { Metadata } from "next";
import { Inter, Outfit, Syne, Nobile, Zain, Audiowide, DM_Sans, Inclusive_Sans, Roboto } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { cookies } from "next/headers";
import { logoutAction } from "./actions/auth";
import { Shield, ArrowRight } from "lucide-react";
import NavLinks from "./components/NavLinks";
import NavBar from "./components/NavBar";
import AuthModal from "./components/AuthModal";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });
const syne = Syne({ subsets: ["latin"], variable: '--font-syne' });
const nobile = Nobile({ subsets: ["latin"], weight: ["400", "700"], variable: '--font-nobile' });
const zain = Zain({ subsets: ["latin"], weight: ["400", "700"], variable: '--font-zain' });
const audiowide = Audiowide({ subsets: ["latin"], weight: "400", variable: '--font-audiowide' });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500"], variable: '--font-dm-sans' });
const inclusiveSans = Inclusive_Sans({ subsets: ["latin"], weight: "400", variable: '--font-inclusive-sans' });
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], variable: '--font-roboto' });

export const metadata: Metadata = {
  title: "UWU-NEXUS",
  description: "Centralized Digital Ecosystem for Student Life Management",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("uwu_auth")?.value === "true";
  const role = cookieStore.get("uwu_role")?.value ?? "";
  const isAdmin = ["superadmin", "clubadmin"].includes(role);

  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" />
      </head>
      <body className={`${inter.variable} ${outfit.variable} ${syne.variable} ${nobile.variable} ${zain.variable} ${audiowide.variable} ${dmSans.variable} ${inclusiveSans.variable} ${roboto.variable} font-sans`}>
        <NavBar isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
        <main style={{ minHeight: 'calc(100vh - 200px)' }}>
          {children}
        </main>
        {!isAuthenticated && <AuthModal />}
        <footer className="footer">
          <div className="container">
            <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '2rem', paddingBottom: '1.5rem' }}>
              <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
                <Link href="/about" className="text-muted font-semibold hover:text-primary">About us</Link>
                <Link href="/services" className="text-muted font-semibold hover:text-primary">Services</Link>
                <Link href="/explore" className="text-muted font-semibold hover:text-primary">Explore</Link>
              </div>
              <div className="flex gap-4 items-center">
                {/* Facebook custom SVG */}
                <a href="#" className="text-muted hover:text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
                {/* Twitter custom SVG */}
                <a href="#" className="text-muted hover:text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                  </svg>
                </a>
                {/* Vimeo SVG Icon */}
                <a href="#" className="text-muted hover:text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}>
                    <path d="M22.396 7.21c-.083 1.905-1.416 4.507-3.998 7.804-2.67 3.42-4.935 5.13-6.793 5.13-1.156 0-2.133-1.066-2.932-3.197-.534-1.954-1.07-3.908-1.603-5.862-.578-2.072-1.2-3.107-1.868-3.107-.15 0-.668.312-1.554.934L2.4 7.648c1.235-1.085 2.587-2.17 4.058-3.255 2.07-1.803 3.623-2.738 4.66-2.805 2.438-.158 3.93 1.543 4.475 5.105.6 3.91 1.05 6.34 1.35 7.29.69 2.215 1.455 3.322 2.296 3.322.668 0 1.62-.977 2.855-2.932 1.22-1.938 1.868-3.4 1.944-4.385.12-1.554-.925-2.337-3.14-2.337.892-2.922 2.597-4.382 5.115-4.382 1.86 0 2.72 1.253 2.583 3.757z" />
                  </svg>
                </a>
                {/* Youtube custom SVG */}
                <a href="#" className="text-muted hover:text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25a29 29 0 0 0-.46-5.33z" />
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                  </svg>
                </a>
              </div>
            </div>

            <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '1.5rem 0' }} />

            <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem' }}>
              <p className="text-muted">© 2026 UWU - Nexus. All rights reserved.</p>

              <div className="flex items-center justify-center">
                <img src="/logo.png" alt="UWU-NEXUS Icon" style={{ height: '32px', width: 'auto' }} />
              </div>

              <div className="flex gap-6">
                <Link href="/terms" className="text-muted hover:text-primary">Terms of Service</Link>
                <Link href="/privacy" className="text-muted hover:text-primary">Privacy Policy</Link>
              </div>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}

