import Link from "next/link";

export default function Home() {
  const features = [
    {
      title: "Event Calendar",
      description: "Discover and follow upcoming university activities and events in a centralized schedule.",
      icon: "/icons/calender.png",
      link: "/events",
      color: "var(--primary)"
    },
    {
      title: "Ticket Booking",
      description: "Securely purchase tickets online for premium campus events without the hassle of cash.",
      icon: "/icons/ticket.png",
      link: "/tickets",
      color: "var(--accent)"
    },
    {
      title: "Sarasawi Alewisala",
      description: "A trusted student-to-student e-commerce platform for buying and selling goods.",
      icon: "/icons/marketplace.png",
      link: "/marketplace",
      color: "var(--success)"
    },
    {
      title: "Lost & Found",
      description: "Report misplaced belongings and locate items discovered on campus easily.",
      icon: "/icons/lost and found.png",
      link: "/lost-and-found",
      color: "var(--warning)"
    },
    {
      title: "GPA Calculator",
      description: "Automatically compute your GPA with your pre-loaded degree curriculum.",
      icon: "/icons/smart gpa calculator.png",
      link: "/gpa-calculator",
      color: "var(--danger)"
    },
    {
      title: "Information Hub",
      description: "Verified directory of university procedures, lecturer contacts, and hotlines.",
      icon: "/icons/information hub.png",
      link: "/info-hub",
      color: "#ec4899"
    }
  ];

  return (
    <div className="container">
      {/* Hero Section */}
      <section className="py-16 text-center mt-8">
        <div className="badge badge-primary mb-6">Welcome to the Future of UWU</div>
        <h1 className="text-5xl font-bold mb-6">
          Centralized Digital <span className="gradient-text">Ecosystem</span><br />
          for Student Life
        </h1>
        <p className="text-xl text-muted mb-8 max-w-2xl mx-auto" style={{ maxWidth: '800px', margin: '0 auto 2rem auto' }}>
          UWU-NEXUS is a comprehensive, university-exclusive platform designed to
          digitize the core aspects of your student life at Uva Wellassa University.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/events" className="btn btn-primary text-lg" style={{ padding: '0.75rem 2rem' }}>
            Explore Events
          </Link>
          <Link href="/info-hub" className="btn btn-secondary text-lg" style={{ padding: '0.75rem 2rem' }}>
            Student Info Hub
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Core Modules</h2>
          <p className="text-muted">Six powerful tools integrated into a single cohesive platform.</p>
        </div>
        
        <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3 gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {features.map((feature, index) => (
            <Link href={feature.link} key={index} className="group" style={{ display: 'block' }}>
              <div className="card h-full flex flex-col items-center text-center relative overflow-hidden group-hover:border-[var(--primary)] transition-colors" style={{ height: '100%' }}>
                {/* Subtle background glow based on feature color */}
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 transition-opacity group-hover:opacity-40" style={{ backgroundColor: feature.color, zIndex: 0 }}></div>
                
                <div className="p-4 rounded-full mb-4 relative z-10" style={{ backgroundColor: `color-mix(in srgb, ${feature.color} 15%, transparent)` }}>
                  <img src={feature.icon} alt={feature.title} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                </div>
                
                <h3 className="text-xl font-bold mb-2 relative z-10">{feature.title}</h3>
                <p className="text-muted text-sm mb-6 relative z-10">{feature.description}</p>
                
                <div className="mt-auto pt-4 font-semibold text-sm w-full relative z-10 flex items-center justify-center gap-2 group-hover:gap-3 transition-all" style={{ color: feature.color, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span>Open Module</span> <span aria-hidden="true">&rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
