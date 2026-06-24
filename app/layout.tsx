import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { cookies } from "next/headers";
import { logoutAction } from "./actions/auth";
import { Shield } from "lucide-react";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: "UWU-NEXUS",
  description: "Centralized Digital Ecosystem for Student Life Management",
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
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>
        <nav className="navbar">
          <div className="container flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <Link href="/" className="flex items-center gap-3 font-bold text-xl gradient-text">
              <img src="/logo.png" alt="UWU-NEXUS Logo" style={{ height: '36px', width: 'auto' }} />
              <span>UWU-NEXUS</span>
            </Link>

            <div className="nav-links flex items-center gap-6" style={{ overflowX: 'auto' }}>
              <Link href="/events" className="nav-link">Events</Link>
              <Link href="/tickets" className="nav-link">Tickets</Link>
              <Link href="/marketplace" className="nav-link">Marketplace</Link>
              <Link href="/lost-and-found" className="nav-link" style={{ whiteSpace: 'nowrap' }}>Lost & Found</Link>
              <Link href="/gpa-calculator" className="nav-link" style={{ whiteSpace: 'nowrap' }}>GPA Calc</Link>
              <Link href="/info-hub" className="nav-link" style={{ whiteSpace: 'nowrap' }}>Info Hub</Link>
            </div>

            <div className="flex gap-3 items-center">
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <Link href="/admin" className="btn flex items-center gap-2" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: 'var(--primary)', border: '1px solid var(--primary)' }}>
                      <Shield size={16} />
                      Admin Panel
                    </Link>
                  )}
                  <form action={logoutAction}>
                    <button type="submit" className="btn btn-secondary">Logout</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn btn-secondary">Login</Link>
                  <Link href="/signup" className="btn btn-primary">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        </nav>
        <main style={{ minHeight: 'calc(100vh - 200px)' }}>
          {children}
        </main>
        <footer className="footer">
          <div className="container text-center">
            <div className="flex items-center justify-center gap-3 font-bold text-xl mb-4">
              <img src="/logo.png" alt="UWU-NEXUS Logo" style={{ height: '32px', width: 'auto', filter: 'grayscale(100%) opacity(0.7)' }} />
              <span className="text-muted">UWU-NEXUS</span>
            </div>
            <p className="text-muted text-sm">
              © 2026 Uva Wellassa University of Sri Lanka. All rights reserved.<br />
              Developed by BSc (Hons) in Industrial Information Technology (IIT 01)
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
