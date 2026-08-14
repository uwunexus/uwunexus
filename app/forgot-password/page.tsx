"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, KeyRound, Loader } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/forgot_password.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (data.success) {
        setStatus("success");
        setMessage(data.message);
      } else {
        setStatus("error");
        setMessage(data.message || "Failed to process request.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("An error occurred. Please try again.");
    }
  };

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
            backgroundColor: "#edf4fe",
            color: "#000c66",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <KeyRound size={36} />
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
            Forgot Password
          </h1>
          <p style={{
            fontFamily: "var(--font-roboto), sans-serif",
            fontSize: "0.95rem",
            color: "#64748b",
            margin: 0
          }}>
            Enter your email to receive a secure password reset link.
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

        {status === "success" && (
          <div style={{
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            color: "#10b981",
            borderRadius: "0.75rem",
            padding: "1rem",
            fontSize: "0.9rem",
            marginBottom: "1.5rem",
            fontWeight: 600,
            textAlign: "center",
            lineHeight: "1.5"
          }}>
            {message}
          </div>
        )}

        {status !== "success" && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.85rem", fontWeight: 500, color: "#000000" }}>University Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input 
                  type="email" 
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
                  placeholder="index@std.uwu.ac.lk" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
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
              {status === "loading" ? "Sending link..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <div style={{
          textAlign: "center",
          marginTop: "2rem",
          fontSize: "0.9rem",
          fontFamily: "var(--font-roboto), sans-serif",
          color: "#64748b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.4rem"
        }}>
          <span>Remember your password?</span>
          <Link href="/login" style={{ color: "#000c66", fontWeight: 700, textDecoration: "underline" }}>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
