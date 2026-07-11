"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLinks() {
  const pathname = usePathname();

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
    <div className="nav-pill-container" style={{ overflowX: 'auto' }}>
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
  );
}
