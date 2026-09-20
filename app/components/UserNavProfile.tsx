"use client";

import { useState, useRef, useEffect } from "react";

interface UserNavProfileProps {
  role?: string;
  enrollmentNumber?: string;
  logoutAction: () => Promise<void>;
}

export default function UserNavProfile({
  role = "student",
  enrollmentNumber = "",
  logoutAction,
}: UserNavProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayEnrollment, setDisplayEnrollment] = useState(enrollmentNumber);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch enrollment number from API / cookie if not passed directly in props
  useEffect(() => {
    if (!displayEnrollment && role === "student") {
      const parseCookie = (name: string) =>
        document.cookie
          .split("; ")
          .find((r) => r.startsWith(name + "="))
          ?.split("=")[1];

      const cookieEnrollment = parseCookie("uwu_enrollment");
      if (cookieEnrollment) {
        setDisplayEnrollment(decodeURIComponent(cookieEnrollment));
        return;
      }

      const userId = parseCookie("uwu_user_id");
      if (userId) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api/backend"}/get_gpa.php?user_id=${userId}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.success && data.user?.enrollment_number) {
              let en = data.user.enrollment_number;
              // Format "UWU/IIT/23/022" -> "IIT23022"
              const match = en.match(/UWU\/([A-Z]+)\/(\d+)\/(\d+)/i);
              if (match) {
                en = `${match[1]}${match[2]}${match[3]}`.toUpperCase();
              }
              setDisplayEnrollment(en);
              document.cookie = `uwu_enrollment=${encodeURIComponent(en)}; path=/; max-age=604800`;
            }
          })
          .catch(console.error);
      }
    }
  }, [displayEnrollment, role]);

  // Compute the label to display in the capsule
  let displayName = "STUDENT";
  if (role === "superadmin") {
    displayName = "ADMIN";
  } else if (role === "clubadmin") {
    displayName = "C-ADMIN";
  } else if (displayEnrollment && displayEnrollment.trim()) {
    let clean = displayEnrollment.trim().toUpperCase();
    const match = clean.match(/UWU\/([A-Z]+)\/(\d+)\/(\d+)/i);
    if (match) {
      clean = `${match[1]}${match[2]}${match[3]}`;
    }
    displayName = clean;
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "175px",
        height: "44px",
        userSelect: "none",
      }}
    >
      {/* ─── CLOSED PILL (Compact 175px Width) ─── */}
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-expanded={false}
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#d8dcde",
            border: "none",
            borderRadius: "9999px",
            padding: "3px 12px 3px 3px",
            cursor: "pointer",
            outline: "none",
            transition: "background-color 0.15s ease",
            boxSizing: "border-box",
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#cfd4d6")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#d8dcde")}
        >
          {/* Navy Circular Avatar */}
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              backgroundColor: "#000c66",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="7.5" r="4.2" fill="#ffffff" />
              <path
                d="M5.2 19.8C5.2 16.2 8.2 14 12 14C15.8 14 18.8 16.2 18.8 19.8C18.8 20.4 18.3 21 17.6 21H6.4C5.7 21 5.2 20.4 5.2 19.8Z"
                fill="#ffffff"
              />
            </svg>
          </div>

          {/* User Display ID (e.g. IIT23022) */}
          <span
            style={{
              fontFamily: "var(--font-outfit), var(--font-inter), sans-serif",
              fontWeight: 800,
              fontSize: "1.15rem",
              color: "#001254",
              letterSpacing: "0.01em",
              lineHeight: 1,
            }}
          >
            {displayName}
          </span>

          {/* Downward Solid Navy Arrow */}
          <svg width="11" height="8" viewBox="0 0 14 10" fill="#001254">
            <polygon points="0,0 14,0 7,9" />
          </svg>
        </button>
      ) : (
        /* ─── OPEN STATE: MODERN SAAS CARD (Option 1) ─── */
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "175px",
            backgroundColor: "#d8dcde",
            borderRadius: "20px",
            padding: "3px 3px 6px 3px",
            boxShadow: "0 14px 30px -5px rgba(0, 12, 102, 0.18)",
            zIndex: 1000,
            boxSizing: "border-box",
          }}
        >
          {/* Top Row Header (Matches Closed Pill Exactly) */}
          <div
            onClick={() => setIsOpen(false)}
            role="button"
            tabIndex={0}
            style={{
              width: "100%",
              height: "38px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              paddingRight: "9px",
              boxSizing: "border-box",
            }}
          >
            {/* Navy Circular Avatar */}
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                backgroundColor: "#000c66",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="7.5" r="4.2" fill="#ffffff" />
                <path
                  d="M5.2 19.8C5.2 16.2 8.2 14 12 14C15.8 14 18.8 16.2 18.8 19.8C18.8 20.4 18.3 21 17.6 21H6.4C5.7 21 5.2 20.4 5.2 19.8Z"
                  fill="#ffffff"
                />
              </svg>
            </div>

            {/* User Display ID */}
            <span
              style={{
                fontFamily: "var(--font-outfit), var(--font-inter), sans-serif",
                fontWeight: 800,
                fontSize: "1.15rem",
                color: "#001254",
                letterSpacing: "0.01em",
                lineHeight: 1,
              }}
            >
              {displayName}
            </span>

            {/* Upward Solid Navy Arrow */}
            <svg width="11" height="8" viewBox="0 0 14 10" fill="#001254">
              <polygon points="7,0 14,9 0,9" />
            </svg>
          </div>

          {/* Subtle Divider */}
          <div
            style={{
              height: "1px",
              backgroundColor: "rgba(0, 12, 102, 0.12)",
              margin: "6px 4px 6px 4px",
            }}
          />

          {/* Bottom Row (High-Contrast Bold Logout Action) */}
          <form action={logoutAction} style={{ margin: "0 2px 2px 2px", width: "calc(100% - 4px)" }}>
            <button
              type="submit"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "rgba(255, 255, 255, 0.45)",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                borderRadius: "12px",
                padding: "8px 12px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                outline: "none",
                boxSizing: "border-box",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.85)";
                e.currentTarget.style.borderColor = "rgba(153, 27, 27, 0.25)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.45)";
                e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.08)";
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "#991b1b",
                  letterSpacing: "-0.01em",
                }}
              >
                Log Out
              </span>

              {/* Crisp Exit Icon in High-Contrast Crimson */}
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#991b1b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
