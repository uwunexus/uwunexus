"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, CheckCircle } from "lucide-react";

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setStatus("error");
      setMessage("No reset token provided.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reset_password.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      
      if (data.success) {
        setStatus("success");
        setMessage(data.message);
      } else {
        setStatus("error");
        setMessage(data.message || "Failed to reset password.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("An error occurred. Please try again.");
    }
  };

  if (!token) {
    return (
      <div style={{
        minHeight: "calc(100vh - 120px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        backgroundColor: "transparent"
      }}>
        <div style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "#ffffff",
          borderRadius: "2rem",
          padding: "3rem 2.5rem",
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.12)",
          border: "1.5px solid rgba(0, 12, 102, 0.08)",
          textAlign: "center"
        }}>
          <h1 style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: "2.25rem",
            fontWeight: 700,
            color: "var(--danger)",
            margin: "0 0 0.5rem 0",
            letterSpacing: "-0.01em"
          }}>
            Invalid Link
          </h1>
          <p style={{
            fontFamily: "var(--font-roboto), sans-serif",
            fontSize: "0.95rem",
            color: "#64748b",
            margin: "0 0 2rem 0"
          }}>
            No password reset token was provided in the URL or the link has expired.
          </p>
          <Link 
            href="/forgot-password" 
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
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
              textDecoration: "none"
            }}
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "calc(100vh - 120px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1rem",
      backgroundColor: "transparent"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "480px",
        backgroundColor: "#ffffff",
        borderRadius: "2rem",
        padding: "3rem 2.5rem",
        boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.12)",
        border: "1.5px solid rgba(0, 12, 102, 0.08)",
        display: "flex",
        flexDirection: "column"
      }}>
        {/* Top Header emblem */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          <div style={{
            padding: "1.25rem",
            borderRadius: "50%",
            backgroundColor: status === "success" ? "rgba(16, 185, 129, 0.1)" : "#edf4fe",
            color: status === "success" ? "#10b981" : "#000c66",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {status === "success" ? <CheckCircle size={36} /> : <Lock size={36} />}
          </div>
        </div>

        {/* Title and details */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: "2.25rem",
            fontWeight: 700,
            color: "#000c66",
            margin: "0 0 0.5rem 0",
            letterSpacing: "-0.01em"
          }}>
            Reset Password
          </h1>
          <p style={{
            fontFamily: "var(--font-roboto), sans-serif",
            fontSize: "0.95rem",
            color: "#64748b",
            margin: 0
          }}>
            Enter your new password below to update your account access.
          </p>
        </div>

        {/* Status messages */}
        {status === "error" && (
          <div style={{
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "var(--danger)",
            borderRadius: "0.75rem",
            padding: "0.75rem 1rem",
            fontSize: "0.85rem",
            marginBottom: "1.5rem",
            fontWeight: 600,
            textAlign: "center",
            lineHeight: "1.4"
          }}>
            {message}
          </div>
        )}

        {status === "success" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              color: "#10b981",
              borderRadius: "0.75rem",
              padding: "1rem",
              fontSize: "0.9rem",
              marginBottom: "1.5rem",
              fontWeight: 600,
              lineHeight: "1.5"
            }}>
              {message}
            </div>
            <Link 
              href="/login" 
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
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
                textDecoration: "none",
                marginTop: "0.5rem"
              }}
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* New Password input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.85rem", fontWeight: 500, color: "#000000" }}>New Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input 
                  type="password" 
                  style={{
                    width: "100%",
                    padding: "0.85rem 1rem 0.85rem 2.75rem",
                    borderRadius: "0.75rem",
                    border: "none",
                    backgroundColor: "#e6e9ec",
                    outline: "none",
                    fontFamily: "var(--font-roboto), sans-serif",
                    fontSize: "0.95rem",
                    color: "#000000"
                  }}
                  placeholder="Enter new password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  minLength={6}
                />
              </div>
            </div>

            {/* Confirm Password input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.85rem", fontWeight: 500, color: "#000000" }}>Confirm Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input 
                  type="password" 
                  style={{
                    width: "100%",
                    padding: "0.85rem 1rem 0.85rem 2.75rem",
                    borderRadius: "0.75rem",
                    border: "none",
                    backgroundColor: "#e6e9ec",
                    outline: "none",
                    fontFamily: "var(--font-roboto), sans-serif",
                    fontSize: "0.95rem",
                    color: "#000000"
                  }}
                  placeholder="Confirm new password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                  minLength={6}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={status === "loading"} 
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
                cursor: status === "loading" ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                marginTop: "0.5rem",
                opacity: status === "loading" ? 0.8 : 1,
                transition: "opacity 0.2s"
              }}
            >
              {status === "loading" ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
