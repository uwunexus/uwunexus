"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Shield, LogOut, ArrowRight } from "lucide-react";

interface NavLinksProps {
  isAuthenticated?: boolean;
  isAdmin?: boolean;
  logoutAction?: () => Promise<void>;
}

export default function NavLinks({ isAuthenticated, isAdmin, logoutAction }: NavLinksProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const links = [
    { name: "Home", href: "/" },
    { name: "Events", href: "/events" },
    { name: "Tickets", href: "/tickets" },
    { name: "Marketplace", href: "/marketplace" },
    { name: "Lost & Found", href: "/lost-and-found" },
    { name: "GPA Calculator", href: "/gpa-calculator" },
    { name: "Info Hub", href: "/info-hub" }
  ];

  return (
    <>
      {/* Desktop Navigation Pill Bar */}
      <div className="nav-pill-container desktop-nav-only">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${isActive ? "active" : ""}`}
              style={{ whiteSpace: 'nowrap' }}
            >
              {link.name}
            </Link>
          );
        })}
      </div>

      {/* Mobile Hamburger Toggle Button */}
      <button
        type="button"
        className="mobile-hamburger-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
      >
        {isOpen ? <X size={24} color="var(--primary)" /> : <Menu size={24} color="var(--primary)" />}
      </button>

      {/* Mobile Menu Backdrop & Drawer */}
      {isOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsOpen(false)}>
          <div className="mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <span className="mobile-menu-title">Navigation</span>
              <button
                type="button"
                className="mobile-close-btn"
                onClick={() => setIsOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="mobile-menu-links">
              {links.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`mobile-nav-link ${isActive ? "active" : ""}`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Auth Actions & Logout Section */}
            <div className="mobile-menu-footer">
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="mobile-auth-btn mobile-admin-btn"
                    >
                      <Shield size={18} />
                      <span>Admin Panel</span>
                    </Link>
                  )}
                  {logoutAction && (
                    <form action={logoutAction} style={{ width: '100%' }}>
                      <button
                        type="submit"
                        className="mobile-auth-btn mobile-logout-btn"
                      >
                        <LogOut size={18} />
                        <span>Logout</span>
                      </button>
                    </form>
                  )}
                </>
              ) : (
                <div className="mobile-unauth-buttons">
                  <Link href="?auth=login" scroll={false} className="mobile-auth-btn mobile-login-btn">
                    Login
                  </Link>
                  <Link href="?auth=signup" scroll={false} className="mobile-auth-btn mobile-signup-btn">
                    <span>Sign Up</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
