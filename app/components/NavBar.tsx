"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Shield, ArrowRight, Menu, X } from "lucide-react";
import { logoutAction } from "../actions/auth";

const LINKS = [
  { name: "Home",           href: "/" },
  { name: "Events",         href: "/events" },
  { name: "Tickets",        href: "/tickets" },
  { name: "Marketplace",    href: "/marketplace" },
  { name: "Lost & Found",   href: "/lost-and-found" },
  { name: "GPA Calculator", href: "/gpa-calculator" },
  { name: "Info Hub",       href: "/info-hub" },
];

interface NavBarProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export default function NavBar({ isAuthenticated, isAdmin }: NavBarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close menu on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <nav className="navbar">
        <div className="container flex justify-between items-center" style={{ gap: "0.75rem" }}>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 font-bold text-xl gradient-text" style={{ flexShrink: 0 }}>
            <img src="/logo.png" alt="UWU-NEXUS Logo" style={{ height: "46px", width: "auto" }} />
          </Link>

          {/* ── DESKTOP nav pills ── */}
          <div className="nav-pill-container desktop-only" style={{ overflowX: "auto" }}>
            {LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${isActive(link.href) ? "active" : ""}`}
                style={{ whiteSpace: "nowrap" }}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* ── DESKTOP auth buttons ── */}
          <div className="flex gap-3 items-center desktop-only">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link href="/admin" className="btn flex items-center gap-2" style={{ backgroundColor: "rgba(0,12,102,0.1)", color: "var(--primary)", border: "1px solid var(--primary)", whiteSpace: "nowrap", fontFamily: "var(--font-inter), sans-serif", fontWeight: 900 }}>
                    <Shield size={16} /> Admin
                  </Link>
                )}
                <form action={logoutAction}>
                  <button type="submit" className="btn-logout" style={{ fontFamily: "var(--font-inter), sans-serif", fontWeight: 900 }}>
                    <span>Logout</span>
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="?auth=login" scroll={false} className="btn btn-secondary">Login</Link>
                <Link href="?auth=signup" scroll={false} className="btn btn-primary">
                  <span>Sign Up</span><ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>

          {/* ── MOBILE hamburger ── */}
          <button
            className="mobile-only mobile-hamburger"
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </nav>

      {/* ── MOBILE overlay menu ── */}
      {open && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setOpen(false)}
        >
          <div className="mobile-menu-panel" onClick={e => e.stopPropagation()}>

            {/* Nav links */}
            <div className="mobile-menu-links">
              {LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`mobile-nav-link ${isActive(link.href) ? "active" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: "1px", background: "#e2e8f0", margin: "0.5rem 0" }} />

            {/* Auth section */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <Link href="/admin" className="mobile-nav-link" onClick={() => setOpen(false)}
                      style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Shield size={16} /> Admin Panel
                    </Link>
                  )}
                  <form action={logoutAction} style={{ width: "100%" }}>
                    <button type="submit" style={{ width: "100%", padding: "0.875rem 1.25rem", borderRadius: "1rem", background: "#ffebeb", color: "#ff5252", border: "1.5px solid #ff5252", fontWeight: 700, fontSize: "1rem", cursor: "pointer", textAlign: "left" }}>
                      Logout
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="?auth=login" scroll={false} className="mobile-nav-link" onClick={() => setOpen(false)}>Login</Link>
                  <Link href="?auth=signup" scroll={false} onClick={() => setOpen(false)}
                    style={{ display: "block", padding: "0.875rem 1.25rem", borderRadius: "1rem", background: "var(--primary)", color: "#ffffff", fontWeight: 700, fontSize: "1rem", textAlign: "left" }}>
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
