import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms & Guidelines | UWU-NEXUS",
  description: "Community guidelines and usage terms for Uva Wellassa University students and staff.",
};

export default function TermsPage() {
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
            Community Guidelines & Terms
          </h1>
          <p style={{ fontFamily: "var(--font-roboto), sans-serif", color: "#64748b", fontSize: "1rem" }}>
            A few common-sense rules to keep our university community respectful, safe, and helpful for everyone.
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
              1. University Email Required
            </h2>
            <p style={{ margin: 0 }}>
              UWU-NEXUS is exclusively for students and staff of Uva Wellassa University. You must use your active university email (<code>@std.uwu.ac.lk</code> or <code>@uwu.ac.lk</code>) to create an account and access portal features.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--primary)", marginBottom: "0.5rem" }}>
              2. Marketplace Honor Code
            </h2>
            <p style={{ margin: 0 }}>
              Only post genuine items you actually own and want to sell, lend, or give away (e.g. course textbooks, scientific calculators, lab coats, hostel items). For personal safety, we recommend meeting during daytime in common campus locations such as the Library lobby, main canteen, or faculty complexes.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--primary)", marginBottom: "0.5rem" }}>
              3. Lost & Found Etiquette
            </h2>
            <p style={{ margin: 0 }}>
              When you find valuable items like student IDs, wallets, keys, or phones, please report them promptly so fellow batchmates can recover their property. If you recover your reported item, please mark the listing as claimed so others know it has been resolved.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--primary)", marginBottom: "0.5rem" }}>
              4. Event & Ticket Guidelines
            </h2>
            <p style={{ margin: 0 }}>
              Club administrators are responsible for the accuracy of their society events and ticketed workshops. Online payments are processed securely through Stripe, and any ticket cancellation policies are determined by the organizing student society.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--primary)", marginBottom: "0.5rem" }}>
              5. Respectful Conduct
            </h2>
            <p style={{ margin: 0 }}>
              Spam, abusive behavior, deceptive listings, or unauthorized access attempts will lead to account suspension and may be reported to university administrative authorities.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
