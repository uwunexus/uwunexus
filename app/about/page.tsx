import Link from "next/link";
import { ArrowLeft, MapPin, Sparkles, Heart } from "lucide-react";

export const metadata = {
  title: "About Us | UWU-NEXUS",
  description: "Learn why we built UWU-NEXUS for the students and staff of Uva Wellassa University.",
};

export default function AboutPage() {
  const storyPoints = [
    {
      title: "No More Buried WhatsApp Notices",
      desc: "University announcements and club workshops used to get lost in dozens of active batch group chats. UWU-NEXUS puts every verified campus notice and event in one clean calendar.",
    },
    {
      title: "Fair & Safe Student Marketplace",
      desc: "Buying lab coats, drawing boards, graphing calculators, and hostel essentials directly from seniors shouldn't feel risky. We verified university emails so you always know who you're dealing with.",
    },
    {
      title: "A Reliable Lost & Found Ledger",
      desc: "Student ID cards, room keys, and flash drives go missing across campus every week. Our digital register connects finders directly with owners before items get misplaced permanently.",
    },
    {
      title: "Transparent Academic GPA Tracking",
      desc: "Calculating your semester GPA with varying course credit weights used to require manual math or messy spreadsheets. Our GPA engine calculates your exact standing according to official UWU faculty regulations.",
    },
  ];

  const faculties = [
    "Faculty of Applied Sciences",
    "Faculty of Management",
    "Faculty of Technological Studies",
    "Faculty of Animal Science & Export Agriculture",
  ];

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

        {/* Header */}
        <div style={{ marginBottom: "3rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              backgroundColor: "rgba(0, 12, 102, 0.06)",
              color: "var(--primary)",
              padding: "0.35rem 0.9rem",
              borderRadius: "9999px",
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 700,
              fontSize: "0.85rem",
              marginBottom: "1rem",
            }}
          >
            <MapPin size={15} />
            <span>Passara Road, Badulla</span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2.2rem, 4vw, 3.2rem)",
              color: "var(--primary)",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              marginBottom: "1rem",
            }}
          >
            Built by Students, <br />
            <span className="gradient-text">for Uva Wellassa University.</span>
          </h1>

          <p
            style={{
              fontFamily: "var(--font-roboto), sans-serif",
              fontSize: "1.1rem",
              color: "#475569",
              lineHeight: 1.7,
            }}
          >
            UWU-NEXUS started with a simple goal: make everyday life at Uva Wellassa University easier, faster, and more connected for all undergraduates and campus societies.
          </p>
        </div>

        {/* Why We Built This Section */}
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1.5px solid #e2e8f0",
            borderRadius: "20px",
            padding: "2rem 2.2rem",
            marginBottom: "3rem",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 800,
              fontSize: "1.45rem",
              color: "var(--primary)",
              marginBottom: "1.2rem",
            }}
          >
            Why We Built UWU-NEXUS
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {storyPoints.map((point, index) => (
              <div key={index} style={{ borderLeft: "3px solid var(--primary)", paddingLeft: "1rem" }}>
                <h3
                  style={{
                    fontFamily: "var(--font-syne), sans-serif",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    color: "#0f172a",
                    marginBottom: "0.3rem",
                  }}
                >
                  {point.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-roboto), sans-serif",
                    fontSize: "0.98rem",
                    color: "#475569",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {point.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Faculties Banner */}
        <div
          style={{
            border: "1.5px solid #e2e8f0",
            borderRadius: "20px",
            padding: "2rem",
            backgroundColor: "#ffffff",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 800,
              fontSize: "1.25rem",
              color: "var(--primary)",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            Supporting All 4 UWU Faculties
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {faculties.map((name, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "0.85rem 1rem",
                  fontFamily: "var(--font-inter), sans-serif",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  color: "#1e293b",
                  textAlign: "center",
                }}
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
