"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Mail, Lock, User, X, Eye, EyeOff, Loader } from "lucide-react";
import { loginAction } from "../actions/auth";

export default function AuthModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const authType = searchParams.get("auth"); // "login" or "signup"
  const isOpen = authType === "login" || authType === "signup";

  // Form State
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendSuccess, setResendSuccess] = useState("");

  // Sync modal view state with URL query parameter
  useEffect(() => {
    if (authType === "signup") {
      setIsLoginView(false);
    } else if (authType === "login") {
      setIsLoginView(true);
    }
    setError("");
    setResendSuccess("");
  }, [authType]);

  if (!isOpen) return null;

  const closeModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("auth");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleToggleView = () => {
    setError("");
    setResendSuccess("");
    const newType = isLoginView ? "signup" : "login";
    const params = new URLSearchParams(searchParams.toString());
    params.set("auth", newType);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isAdminEmail = email === "admin@admin.com";
    if (!isAdminEmail && !email.endsWith("@uwu.ac.lk") && !email.endsWith("@std.uwu.ac.lk")) {
      setError("Please use a valid university email address (@uwu.ac.lk or @std.uwu.ac.lk).");
      return;
    }

    setError("");
    setResendSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api/backend"}/login.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to log in");

      // Set cookie session in Next.js Server Action
      await loginAction(data.user.role, String(data.user.id));
      
      // Close modal and refresh session details on current page
      closeModal();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResendSuccess("");
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api/backend"}/resend_verification.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to resend email");
      setResendSuccess(data.message || "Verification email resent successfully. Please check your inbox.");
    } catch (err: any) {
      setError(err.message || "An error occurred while resending the email.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!email.endsWith("@uwu.ac.lk") && !email.endsWith("@std.uwu.ac.lk")) {
      setError("Please use a valid university email address (@uwu.ac.lk or @std.uwu.ac.lk).");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api/backend"}/signup.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to sign up");

      // Show success message
      setResendSuccess(data.message || "Account created! Please check your email to verify.");
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "An error occurred during sign up.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.4)",
      backdropFilter: "blur(8px)",
      zIndex: 99999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem"
    }}>
      {/* Background overlay click-to-close */}
      <div 
        onClick={closeModal}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          cursor: "pointer"
        }} 
      />

      {/* Auth Panel Card */}
      <div style={{
        position: "relative",
        backgroundColor: "#ffffff",
        borderRadius: "2rem",
        width: "100%",
        maxWidth: "960px",
        height: "680px",
        display: "flex",
        overflow: "hidden",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        zIndex: 100
      }}>
        {/* Close Button (Global to modal, sits top-right over graphic on desktop, shifts to top-right of form on mobile) */}
        <button
          onClick={closeModal}
          className="auth-close-button"
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.25rem",
            border: "none",
            backgroundColor: "rgba(15, 23, 42, 0.4)",
            cursor: "pointer",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            transition: "all 0.2s",
            zIndex: 110
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.6)"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.4)"}
        >
          <X size={20} />
        </button>

        {/* Left Side: Form Container */}
        <div style={{
          width: "100%",
          maxWidth: "400px",
          height: "100%",
          padding: "2.5rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: "#ffffff"
        }}>
          {/* Header */}
          <div style={{ marginBottom: "1.75rem" }}>
            <h2 style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontSize: "2.25rem",
              fontWeight: 700,
              color: "#000c66",
              margin: 0,
              letterSpacing: "-0.01em"
            }}>
              {isLoginView ? "Login" : "Sign Up"}
            </h2>
            <p style={{
              fontFamily: "var(--font-inclusive-sans), sans-serif",
              fontSize: "0.95rem",
              color: "#64748b",
              margin: "0.25rem 0 0 0"
            }}>
              {isLoginView ? "Enter your account details" : "Create your student account"}
            </p>
          </div>

          {/* Validation Alert */}
          {error && (
            <div style={{
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "var(--danger)",
              borderRadius: "0.75rem",
              padding: "0.75rem 1rem",
              fontSize: "0.85rem",
              marginBottom: "1.25rem",
              fontWeight: 600,
              lineHeight: "1.4"
            }}>
              {error}
              {error === "Please verify your email address before logging in." && (
                <div style={{ marginTop: "0.5rem" }}>
                  <button 
                    onClick={handleResendEmail} 
                    disabled={loading}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--primary)",
                      fontWeight: "bold",
                      textDecoration: "underline",
                      cursor: loading ? "not-allowed" : "pointer",
                      padding: 0,
                      fontSize: "0.85rem"
                    }}
                  >
                    {loading ? "Sending..." : "Resend Verification Email"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Success Alert for Resend */}
          {resendSuccess && (
            <div style={{
              backgroundColor: "rgba(34, 197, 94, 0.08)",
              border: "1px solid rgba(34, 197, 94, 0.2)",
              color: "#166534",
              borderRadius: "0.75rem",
              padding: "0.75rem 1rem",
              fontSize: "0.85rem",
              marginBottom: "1.25rem",
              fontWeight: 600,
              lineHeight: "1.4"
            }}>
              {resendSuccess}
            </div>
          )}

          {/* Form */}
          <form onSubmit={isLoginView ? handleLoginSubmit : handleSignupSubmit} style={{ display: "flex", flexDirection: "column", gap: isLoginView ? "1rem" : "0.75rem" }}>
            
            {/* Full Name field (Signup only) */}
            {!isLoginView && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label style={{ fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.85rem", fontWeight: 400, color: "#000000" }}>Full Name</label>
                <div style={{ position: "relative" }}>
                  <User size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="text"
                    required
                    placeholder="Your full name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.8rem 1rem 0.8rem 2.75rem",
                      borderRadius: "0.75rem",
                      border: "none",
                      backgroundColor: "#e6e9ec",
                      outline: "none",
                      fontFamily: "var(--font-roboto), sans-serif",
                      fontWeight: 400,
                      fontSize: "0.95rem",
                      color: "#000000"
                    }}
                  />
                </div>
              </div>
            )}

            {/* University Email field */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.85rem", fontWeight: 400, color: "#000000" }}>University Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  type="email"
                  required
                  placeholder="index@std.uwu.ac.lk"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.8rem 1rem 0.8rem 2.75rem",
                    borderRadius: "0.75rem",
                    border: "none",
                    backgroundColor: "#e6e9ec",
                    outline: "none",
                    fontFamily: "var(--font-roboto), sans-serif",
                    fontWeight: 400,
                    fontSize: "0.95rem",
                    color: "#000000"
                  }}
                />
              </div>
            </div>

            {/* Password field */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.85rem", fontWeight: 400, color: "#000000" }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.8rem 2.75rem 0.8rem 2.75rem",
                    borderRadius: "0.75rem",
                    border: "none",
                    backgroundColor: "#e6e9ec",
                    outline: "none",
                    fontFamily: "var(--font-roboto), sans-serif",
                    fontWeight: 400,
                    fontSize: "0.95rem",
                    color: "#000000"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password field (Signup only) */}
            {!isLoginView && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label style={{ fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.85rem", fontWeight: 400, color: "#000000" }}>Confirm Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.8rem 2.75rem 0.8rem 2.75rem",
                      borderRadius: "0.75rem",
                      border: "none",
                      backgroundColor: "#e6e9ec",
                      outline: "none",
                      fontFamily: "var(--font-roboto), sans-serif",
                      fontWeight: 400,
                      fontSize: "0.95rem",
                      color: "#000000"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "1rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      border: "none",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                      color: "#94a3b8",
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot password link (Login only) */}
            {isLoginView && (
              <a
                href="/forgot-password"
                style={{
                  alignSelf: "flex-end",
                  fontSize: "0.8rem",
                  color: "#000000",
                  textDecoration: "underline",
                  fontFamily: "var(--font-inclusive-sans), sans-serif",
                  fontWeight: 600
                }}
              >
                Forgot password?
              </a>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                height: "50px",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: "#000c66",
                color: "#ffffff",
                fontFamily: "var(--font-syne), sans-serif",
                fontSize: "1.1rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                marginTop: "0.5rem",
                transition: "opacity 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.95"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              {loading ? (
                <Loader size={20} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                isLoginView ? "Login" : "Sign Up"
              )}
            </button>
          </form>

          {/* Style rule for button loader spin */}
          <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>

          {/* Footer view toggle */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "2.5rem",
            fontSize: "0.85rem",
            borderTop: "1px solid rgba(0, 0, 0, 0.05)",
            paddingTop: "1.25rem"
          }}>
            <span style={{ fontFamily: "var(--font-roboto), sans-serif", color: "#64748b", fontWeight: 400 }}>
              {isLoginView ? "Don't have an account?" : "Already have an account?"}
            </span>
            <button
              onClick={handleToggleView}
              style={{
                border: "1.5px solid #000000",
                backgroundColor: "#ffffff",
                color: "#000000",
                borderRadius: "0.75rem",
                padding: "0.45rem 1.25rem",
                fontFamily: "var(--font-roboto), sans-serif",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "#000000";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "#ffffff";
                e.currentTarget.style.color = "#000000";
              }}
            >
              {isLoginView ? "Sign up" : "Login"}
            </button>
          </div>
        </div>

        {/* Right Side: Graphic Panel */}
        <div 
          className="auth-graphic-pane"
          style={{
            flex: 1,
            backgroundImage: "url('/login&signup.png')",
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundColor: "#000c66"
          }} 
        />

        {/* Inline CSS to handle responsive display of the graphic pane and close button */}
        <style>{`
          @media (max-width: 860px) {
            .auth-graphic-pane {
              display: none !important;
            }
            .auth-close-button {
              color: #64748b !important;
              background-color: transparent !important;
            }
            .auth-close-button:hover {
              background-color: rgba(0, 0, 0, 0.05) !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
