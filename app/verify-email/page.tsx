"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email address...");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch("http://localhost:8000/verify_email.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        
        if (data.success) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("An error occurred during verification.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
      <div className="card w-full max-w-md text-center p-8">
        <div className="mb-6 flex justify-center">
          {status === "loading" && <Loader2 size={48} className="animate-spin text-primary" style={{ color: "var(--primary)" }} />}
          {status === "success" && <CheckCircle size={48} style={{ color: "var(--success, #10b981)" }} />}
          {status === "error" && <XCircle size={48} style={{ color: "var(--danger)" }} />}
        </div>
        
        <h2 className="text-2xl font-bold mb-2">Email Verification</h2>
        <p className="text-muted mb-8">{message}</p>
        
        {status !== "loading" && (
          <Link href="/login" className="btn btn-primary inline-block">
            Go to Login
          </Link>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
