"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Mail, Lock } from "lucide-react";
import { loginAction } from "../actions/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isAdminEmail = email === "admin@admin.com";
    if (!isAdminEmail && !email.endsWith("@uwu.ac.lk") && !email.endsWith("@std.uwu.ac.lk")) {
      setError("Please use your valid university email (@uwu.ac.lk or @std.uwu.ac.lk).");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to log in");
      }

      // Automatically log the user in locally via Next.js server actions
      await loginAction(data.user.role, String(data.user.id));
    } catch (err: any) {
      setError(err.message || "An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-16 flex justify-center items-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
      <div className="card w-full max-w-md" style={{ padding: '2.5rem' }}>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
              <GraduationCap size={40} className="text-accent" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted text-sm">Login to your UWU-NEXUS account</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded text-sm text-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-4">
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

          <div className="form-group mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="form-label text-sm mb-0">Password</label>
              <Link href="/forgot-password" className="text-xs text-muted hover:text-primary">Forgot password?</Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                className="form-input" 
                style={{ paddingLeft: '2.5rem' }} 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full text-lg justify-center mb-6" style={{ padding: '0.75rem', backgroundColor: 'var(--accent)', opacity: loading ? 0.7 : 1 }}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="text-center text-sm text-muted">
          Don't have an account? <Link href="/signup" className="font-semibold" style={{ color: 'var(--accent)' }}>Sign up here</Link>
        </div>
      </div>
    </div>
  );
}
