import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Counter from "./components/Counter";

export const IconlyLocation = ({ size = 24, color = "#000000" }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.7605 10.7106C9.7605 12.0906 10.8795 13.2096 12.2595 13.2096C13.6415 13.2096 14.7605 12.0906 14.7605 10.7106C14.7605 9.32859 13.6415 8.20959 12.2595 8.20959" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
      <path d="M19.326 13.482C18.122 17.636 14.618 21 12.25 21C9.352 21 4.75 15.959 4.75 10.599C4.75 6.403 8.107 3 12.25 3C16.392 3 19.75 6.403 19.75 10.599" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    </svg>
  )
}

export default function Home() {
  const features = [
    {
      title: "Event Calendar",
      description: "Discover and follow upcoming university activities and events in a centralized schedule.",
      icon: "/event_calendar_bg.jpg",
      link: "/events",
      color: "var(--primary)"
    },
    {
      title: "Ticket Booking",
      description: "Securely purchase tickets online for premium campus events without the hassle of cash.",
      icon: "/ticket_booking_bg.png",
      link: "/tickets",
      color: "var(--accent)"
    },
    {
      title: "Sarasawi Alewisala",
      description: "A trusted student-to-student e-commerce platform for buying and selling goods.",
      icon: "/sarasawi_alewisala_bg.png",
      link: "/marketplace",
      color: "var(--success)"
    },
    {
      title: "Lost & Found",
      description: "Report misplaced belongings and locate items discovered on campus easily.",
      icon: "/lost_found_bg.png",
      link: "/lost-and-found",
      color: "var(--warning)"
    },
    {
      title: "GPA Calculator",
      description: "Automatically compute your GPA with your pre-loaded degree curriculum.",
      icon: "/gpa_calculator_bg.png",
      link: "/gpa-calculator",
      color: "var(--danger)"
    },
    {
      title: "Information Hub",
      description: "Verified directory of university procedures, lecturer contacts, and hotlines.",
      icon: "/info_hub_bg.png",
      link: "/info-hub",
      color: "#ec4899"
    }
  ];

  return (
    <div>
      {/* Hero Section Wrapper with Full-Width Gradient */}
      <div style={{ background: 'linear-gradient(to bottom, #faf5ff 0%, #ffffff 100%)', paddingTop: '2rem', paddingBottom: '1.5rem' }}>
        <section className="container grid md-grid-cols-2 gap-8 items-center">
          <div>
            <div className="hero-tag">
              <IconlyLocation size={30} color="var(--primary)" /> Uva Wellassa University Sri Lanka
            </div>
            <h1 className="text-5xl mb-6 hero-title" style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, textAlign: 'left', lineHeight: '1.1' }}>
              Centralized Digital<br />
              Platform<br />
              <span style={{ color: 'var(--primary)' }}>for Student Life</span>
            </h1>
            <p className="text-lg text-muted mb-8" style={{ fontFamily: 'var(--font-nobile), sans-serif', fontWeight: 400, textAlign: 'left', maxWidth: '520px', fontSize: '1.05rem', lineHeight: '1.6' }}>
              UWU-NEXUS is a comprehensive, university-exclusive platform designed to
              digitize the core aspects of your student life at Uva Wellassa University.
            </p>
            <div style={{ textAlign: 'left' }}>
              <Link href="/events" className="btn btn-primary text-lg" style={{ fontFamily: 'var(--font-nobile), sans-serif', fontWeight: 700, padding: '0.75rem 2.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
                <span>Explore Platform</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: '0.25rem' }}>
                  <ArrowRight size={16} />
                </span>
              </Link>
            </div>
          </div>

          <div>
            {/* Note: Source can be replaced with custom hero-image.png, logo.png acts as fallback placeholder */}
            <div className="hero-image-container" style={{ width: '100%', minHeight: '280px', height: '100%', maxHeight: '450px' }}>
              <img
                src="/hero-image-container.gif"
                alt="Students studying at Uva Wellassa University"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Stats Section Banner */}
      <div className="stats-bar">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-number">
              <Counter target={3000} suffix="+" duration={2000} />
            </div>
            <div className="stat-label">Active Students</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              <Counter target={50} suffix="+" duration={2000} />
            </div>
            <div className="stat-label">Events Annually</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              <Counter target={6} duration={2000} />
            </div>
            <div className="stat-label">Different services</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              <Counter target={24} suffix="/7" duration={2000} />
            </div>
            <div className="stat-label">Platform Access</div>
          </div>
        </div>
      </div>

      {/* Features Grid Section */}
      <section className="container py-16">
        <div className="text-center mb-12" style={{ marginBottom: '2rem' }}>
          <div className="uppercase mb-2" style={{ fontFamily: 'var(--font-zain), sans-serif', fontWeight: 400, color: '#000000', letterSpacing: '0.1em', fontSize: '1.2rem' }}>
            Platform Services
          </div>
          <h2 className="text-4xl mb-4" style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '2.5rem' }}>
            Everything You Need <br /> In One Place
          </h2>
          <p className="text-muted max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, textAlign: 'center', margin: '0 auto', maxWidth: '600px', fontSize: '1.05rem', color: '#000000' }}>
            Six integrated modules addressing every aspect of <br /> student life at UWU.
          </p>
        </div>

        <div className="grid md-grid-cols-2 lg-grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Link href={feature.link} key={index} className="service-card group">
              <img
                src={feature.icon}
                alt={feature.title}
                className="service-card-image"
                style={{ objectFit: 'cover' }}
              />
              <div className="service-card-overlay"></div>
              <h3 className="service-card-title">{feature.title}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Curved Divider & Lightest Purple Subscription Section Wrapper */}
      <div style={{ backgroundColor: '#faf5ff', marginTop: '0.1rem', paddingBottom: '2rem' }}>
        <div style={{ width: '100%', overflow: 'hidden', lineHeight: 0 }}>
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%', height: 'auto', backgroundColor: '#ffffff' }}>
            <path d="M0 80 Q 720 0 1440 80 L 1440 80 L 0 80 Z" fill="#faf5ff" />
          </svg>
        </div>

        {/* Subscription Banner Section */}
        <section className="container py-8">
          <div className="subscribe-banner">
            <div className="subscribe-title">Subscribe UWU-Nexus</div>
            <div className="subscribe-form-container">
              <input type="email" placeholder="Enter your email" className="subscribe-input" />
              <button className="subscribe-button">Subscribe Now</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
