import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | UWU-NEXUS",
  description: "How we protect and handle student information on UWU-NEXUS.",
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "85vh", padding: "3rem 0 5rem 0", backgroundColor: "#ffffff" }}>
      <div className="container" style={{ maxWidth: "860px", margin: "0 auto", padding: "0 1.5rem" }}>
        {/* Back Link */}
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--primary)",
            fontFamily: "var(--font-inter), sans-serif",
            fontWeight: 700,
            fontSize: "0.9rem",
            textDecoration: "none",
            marginBottom: "2rem",
            padding: "0.4rem 0.85rem",
            borderRadius: "8px",
            backgroundColor: "#f1f5f9",
            transition: "all 0.15s ease",
          }}
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Title */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 3.5vw, 2.75rem)",
              color: "var(--primary)",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              marginBottom: "0.5rem",
            }}
          >
            Privacy & Data Transparency
          </h1>
          <p style={{ fontFamily: "var(--font-roboto), sans-serif", color: "#64748b", fontSize: "1rem" }}>
            We believe student data belongs to students. Here is exactly what we store, why we store it, and how it is protected.
          </p>
        </div>

        {/* Content Box */}
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1.5px solid #e2e8f0",
            borderRadius: "20px",
            padding: "2.2rem",
            lineHeight: 1.75,
            fontFamily: "var(--font-roboto), sans-serif",
            color: "#334155",
            fontSize: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.75rem",
          }}
        >
          <section>
            <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--primary)", marginBottom: "0.5rem" }}>
              1. What We Store
            </h2>
            <p style={{ margin: 0 }}>
              We only store the basic academic details necessary to run your student profile: your name, university email, enrollment ID (e.g. <code>IIT23022</code>), degree program, and password hash (encrypted via standard bcrypt). We never ask for or store national ID numbers or personal banking details.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--primary)", marginBottom: "0.5rem" }}>
              2. Your Grades & GPA Are Private
            </h2>
            <p style={{ margin: 0 }}>
              The courses and letter grades you enter into the GPA Calculator are strictly tied to your account. They are not visible to other students or administrators and are used solely to compute your personal Semester and Cumulative GPA.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--primary)", marginBottom: "0.5rem" }}>
              3. Secure Image Uploads
            </h2>
            <p style={{ margin: 0 }}>
              When you attach photos to marketplace items or lost & found reports, the images are compressed directly in your browser and hosted securely via Cloudinary's encrypted CDN. We do not store heavy uncompressed files on local university servers.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--primary)", marginBottom: "0.5rem" }}>
              4. Payment Safety
            </h2>
            <p style={{ margin: 0 }}>
              Ticket purchases are handled directly through Stripe's certified payment gateway. UWU-NEXUS never sees, collects, or stores your credit/debit card numbers.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--primary)", marginBottom: "0.5rem" }}>
              5. Zero Commercial Tracking
            </h2>
            <p style={{ margin: 0 }}>
              UWU-NEXUS does not sell student data, show external advertisements, or use third-party tracking scripts.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
