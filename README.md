# UWU Nexus

A comprehensive student platform built for **Uva Wellassa University of Sri Lanka**, providing a centralized hub for university services, events, marketplace, and information.

🌐 **Live Site:** [uwunexus.vercel.app](https://uwunexus.vercel.app)

---

## Features

- 🏠 **Home** — University overview, announcements, and quick access to all services
- 📅 **Events** — Browse and register for university events with a built-in calendar view
- 🎫 **Tickets** — Purchase tickets for university events via Stripe payment integration
- 🛒 **Marketplace** — Buy and sell items among university students
- 🔍 **Lost & Found** — Report and search for lost or found items on campus
- 📚 **Information Hub** — University procedures, emergency hotlines, and key contacts
- 🎓 **GPA Calculator** — Calculate and track academic GPA by semester and module
- 👤 **User Authentication** — Sign up, login, email verification, and password reset

---

## Tech Stack

### Frontend
- [Next.js 16](https://nextjs.org/) — React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) — Type-safe development
- Custom CSS — Global design system (`globals.css`)
- [Lucide React](https://lucide.dev/) — Icon library

### Backend
- PHP — REST API endpoints
- MySQL — Database via PDO
- [Stripe](https://stripe.com/) — Payment processing
- [Cloudinary](https://cloudinary.com/) — Image hosting
- [Resend](https://resend.com/) — Transactional email

### Deployment
- **Frontend:** [Vercel](https://vercel.com/)
- **Backend:** VPS (PHP + MySQL)

---

## Getting Started

### Prerequisites
- Node.js 18+
- PHP 8.1+
- MySQL

### Frontend Setup

```bash
# Clone the repository
git clone https://github.com/uwunexus/uwunexus.git
cd uwunexus

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your values

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Backend Setup

1. Copy all files from `/backend` to your web server
2. Create a MySQL database named `uwunexus`
3. Configure `backend/db.php` with your database credentials
4. Set up your `.env` file in the backend with `RESEND_API_KEY`

### Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

---

## Project Structure

```
uwunexus/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard
│   ├── events/            # Events page
│   ├── gpa-calculator/    # GPA calculator
│   ├── info-hub/          # Information hub
│   ├── lost-and-found/    # Lost & found
│   ├── marketplace/       # Student marketplace
│   ├── tickets/           # Ticket booking
│   └── components/        # Shared components
├── backend/               # PHP API files
├── public/                # Static assets
└── guide/                 # Learning resources
```

---

## Team

**Group:** IIT 01 — IIT 271-2  
**University:** Uva Wellassa University of Sri Lanka

---

## License

This project is developed for academic purposes at Uva Wellassa University.
