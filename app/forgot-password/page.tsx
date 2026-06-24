"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, KeyRound } from "lucide-react";

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
    <div className="container py-16 flex justify-center items-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
      <div className="card w-full max-w-md" style={{ padding: '2.5rem' }}>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
              <KeyRound size={40} className="text-accent" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Forgot Password</h1>
          <p className="text-muted text-sm">Enter your email to receive a reset link.</p>
        </div>

        {status === "error" && (
          <div className="mb-6 p-3 rounded text-sm text-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {message}
          </div>
        )}

        {status === "success" && (
          <div className="mb-6 p-4 rounded text-sm text-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success, #10b981)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            {message}
          </div>
        )}

        {status !== "success" && (
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-6">
              <label className="form-label text-sm">University Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  style={{ paddingLeft: '2.5rem' }} 
                  placeholder="index@uwu.ac.lk" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <button type="submit" disabled={status === "loading"} className="btn btn-primary w-full text-lg justify-center mb-6" style={{ padding: '0.75rem', backgroundColor: 'var(--accent)', opacity: status === "loading" ? 0.7 : 1 }}>
              {status === "loading" ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <div className="text-center text-sm text-muted">
          Remember your password? <Link href="/login" className="font-semibold" style={{ color: 'var(--accent)' }}>Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
