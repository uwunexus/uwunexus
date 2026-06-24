"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
      <div className="container py-16 flex justify-center items-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="card w-full max-w-md text-center" style={{ padding: '2.5rem' }}>
          <h1 className="text-2xl font-bold mb-4 text-danger">Invalid Link</h1>
          <p className="text-muted mb-6">No password reset token was provided in the URL.</p>
          <Link href="/forgot-password" className="btn btn-primary">Request New Link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-16 flex justify-center items-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
      <div className="card w-full max-w-md" style={{ padding: '2.5rem' }}>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
              {status === "success" ? <CheckCircle size={40} className="text-success" /> : <Lock size={40} className="text-accent" />}
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
          <p className="text-muted text-sm">Enter your new password below.</p>
        </div>

        {status === "error" && (
          <div className="mb-6 p-3 rounded text-sm text-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {message}
          </div>
        )}

        {status === "success" ? (
          <div className="text-center">
            <div className="mb-6 p-4 rounded text-sm" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success, #10b981)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              {message}
            </div>
            <Link href="/login" className="btn btn-primary w-full justify-center" style={{ padding: '0.75rem', backgroundColor: 'var(--accent)' }}>
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-4">
              <label className="form-label text-sm">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  style={{ paddingLeft: '2.5rem' }} 
                  placeholder="Enter new password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  minLength={6}
                />
              </div>
            </div>

            <div className="form-group mb-6">
              <label className="form-label text-sm">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  style={{ paddingLeft: '2.5rem' }} 
                  placeholder="Confirm new password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                  minLength={6}
                />
              </div>
            </div>

            <button type="submit" disabled={status === "loading"} className="btn btn-primary w-full text-lg justify-center mb-6" style={{ padding: '0.75rem', backgroundColor: 'var(--accent)', opacity: status === "loading" ? 0.7 : 1 }}>
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
