import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { auth } from "../lib/auth";

const HERO_SLIDES = [
  {
    badge: "Executive Communications & Admissions",
    title: "Connect With Our Academic & Administrative Leadership",
    desc: "Whether you are a prospective parent, an enrolled student, or a faculty member, our dedicated administrative offices are ready to assist you with admissions, academic records, and campus support.",
    statValue: "< 2 Hrs",
    statLabel: "Average Response Time",
    accent: "#fbbf24",
    bgGradient: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 52%, #1d4ed8 100%)",
    ctaText: "Send an Official Inquiry",
    ctaTarget: "#contact-form-section",
  },
  {
    badge: "Admissions & Enrollment Office",
    title: "2025 / 2026 Academic Year Admissions & Campus Tours",
    desc: "Schedule a private campus tour, inquire about grade placement and scholarships, or speak directly with our Registrar regarding new student registration and EMIS documentation.",
    statValue: "98.7%",
    statLabel: "Parent Satisfaction Rate",
    accent: "#34d399",
    bgGradient: "linear-gradient(135deg, #064e3b 0%, #0f766e 50%, #1e3a8a 100%)",
    ctaText: "Contact Admissions Desk",
    ctaTarget: "#departments-slider",
  },
  {
    badge: "Examinations, Marks & Student Portal",
    title: "Dedicated Helpdesk for Digital Portal & Report Cards",
    desc: "Need assistance accessing student exam results, class rankings, attendance sheets, or fee statements? Our IT & Academic Records specialists provide instant portal support.",
    statValue: "24 / 7",
    statLabel: "Portal Support Availability",
    accent: "#a78bfa",
    bgGradient: "linear-gradient(135deg, #2e1065 0%, #4c1d95 48%, #1e3a8a 100%)",
    ctaText: "Explore Support Channels",
    ctaTarget: "#contact-channels",
  },
  {
    badge: "Finance & Tuition Services",
    title: "Transparent Tuition Guidance & Payment Assistance",
    desc: "Reach out to our Finance & Accounts Department for fee structures, installment plans, official payment receipts, and financial clearance certificates.",
    statValue: "100%",
    statLabel: "Verified Receipt Tracking",
    accent: "#fb923c",
    bgGradient: "linear-gradient(135deg, #431407 0%, #9a3412 48%, #1e3a8a 100%)",
    ctaText: "Inquire About Fees",
    ctaTarget: "#contact-form-section",
  },
];

const DEPARTMENTS = [
  {
    id: "admissions",
    name: "Admissions & Registrar Office",
    officer: "Dr. Khalid Al-Mansoor",
    role: "Director of Admissions & Records",
    email: "admissions@schoolsms.edu",
    phone: "+252 61 500 1001",
    room: "Administration Block · Ground Floor, Suite 102",
    sla: "Replies within 2 hours",
    color: "#1d4ed8",
    bg: "#eaf2ff",
    icon: "🎓",
    summary: "New student applications, EMIS registration, academic transcripts, and grade transfers.",
  },
  {
    id: "academic",
    name: "Academic & Examinations Board",
    officer: "Prof. Amina Warsame",
    role: "Dean of Academic Affairs",
    email: "academics@schoolsms.edu",
    phone: "+252 61 500 1002",
    room: "Main Academic Wing · 2nd Floor, Room 204",
    sla: "Replies within 3 hours",
    color: "#7c3aed",
    bg: "#ede9fe",
    icon: "📚",
    summary: "Curriculum inquiries, midterm & final examination schedules, rankings, and report cards.",
  },
  {
    id: "finance",
    name: "Finance & Tuition Accounts",
    officer: "Mr. HassanAbdullahi",
    role: "Chief Financial Comptroller",
    email: "finance@schoolsms.edu",
    phone: "+252 61 500 1003",
    room: "Administration Block · 1st Floor, Suite 108",
    sla: "Replies within 1 hour",
    color: "#059669",
    bg: "#d1fae5",
    icon: "💳",
    summary: "Tuition fee schedules, payment verification, scholarships, and official billing receipts.",
  },
  {
    id: "principal",
    name: "Office of the Principal",
    officer: "Dr. Abdirahman Yusuf",
    role: "Executive Principal",
    email: "principal@schoolsms.edu",
    phone: "+252 61 500 1000",
    room: "Executive Tower · 3rd Floor, Presidential Suite",
    sla: "Replies within 24 hours",
    color: "#d97706",
    bg: "#fef3c7",
    icon: "🏛️",
    summary: "Institutional partnerships, school governance, policy inquiries, and executive appointments.",
  },
  {
    id: "welfare",
    name: "Student Welfare & Counseling",
    officer: "Ms. Fartun Ali",
    role: "Head of Student Guidance",
    email: "welfare@schoolsms.edu",
    phone: "+252 61 500 1004",
    room: "Student Center · Ground Floor, Room 14",
    sla: "Immediate priority response",
    color: "#0e7490",
    bg: "#cffafe",
    icon: "🤝",
    summary: "Attendance counseling, student wellbeing, parent-teacher conferences, and extracurriculars.",
  },
  {
    id: "it",
    name: "IT & Digital Portal Helpdesk",
    officer: "Eng. Salman Farah",
    role: "Lead Systems Architect",
    email: "support@schoolsms.edu",
    phone: "+252 61 500 1005",
    room: "Digital Innovation Lab · Room 301",
    sla: "Replies within 30 mins",
    color: "#dc2626",
    bg: "#fee2e2",
    icon: "💻",
    summary: "Password resets, student & teacher portal login help, and technical troubleshooting.",
  },
];

const CAMPUS_WINGS = [
  {
    id: "main",
    name: "Main Academic Campus",
    subtitle: "Grades 1–12 Lecture Halls & Science Laboratories",
    address: "KM4 Academic Boulevard, Hodan District, Mogadishu",
    hours: "Saturday – Thursday: 7:00 AM – 4:30 PM",
    phone: "+252 61 500 1000",
    email: "campus@schoolsms.edu",
    coordinates: "2.0371° N, 45.3079° E",
    facilities: ["Smart Classrooms", "Science & Physics Labs", "Central Library", "Auditorium"],
    badge: "Primary Campus",
  },
  {
    id: "admin",
    name: "Executive Administration Wing",
    subtitle: "Admissions, Finance, Registrar & Leadership Offices",
    address: "Block B, Academic Boulevard, Hodan District",
    hours: "Saturday – Thursday: 8:00 AM – 5:00 PM",
    phone: "+252 61 500 1001",
    email: "admissions@schoolsms.edu",
    coordinates: "2.0375° N, 45.3084° E",
    facilities: ["Admissions Lounge", "Cashier & Tuition Desk", "Boardroom", "Parent Reception"],
    badge: "Visitor Check-In",
  },
  {
    id: "digital",
    name: "Student Services & Digital Center",
    subtitle: "IT Helpdesk, Counseling & Examination Records",
    address: "Block C, Innovation Court, Campus East",
    hours: "Saturday – Thursday: 7:30 AM – 6:00 PM",
    phone: "+252 61 500 1005",
    email: "support@schoolsms.edu",
    coordinates: "2.0368° N, 45.3090° E",
    facilities: ["24/7 Portal Server Hub", "Computer Labs", "Guidance Suites", "Exam Archives"],
    badge: "Support Center",
  },
];

const FAQS = [
  {
    q: "How can parents or students reset their School SMS portal password?",
    a: "You can submit a request to the 'IT & Digital Portal Helpdesk' using the contact form on this page, or visit the Administration Office with your EMIS Number. Password resets are processed within 30 minutes.",
  },
  {
    q: "What documents are required for new student registration?",
    a: "New applicants require a completed admission form, previous school report card or transfer certificate, birth certificate copy, two passport-size photographs, and guardian contact identification.",
  },
  {
    q: "When are Midterm and Final examination results published on the portal?",
    a: "Subject teachers enter marks as assessments conclude, and the Academic Board publishes verified rankings and report cards within 5 business days after the final examination date.",
  },
  {
    q: "How do I verify a tuition fee payment or request an official receipt?",
    a: "All payments recorded by the Finance Office appear automatically under the 'Fee Payments' section of the Student Portal. For stamped paper receipts, contact finance@schoolsms.edu.",
  },
];

const URGENCY_LEVELS = {
  1: { label: "Level 1 · General Inquiry", color: "#10b981", bg: "#d1fae5", sla: "24–48 Hours Response" },
  2: { label: "Level 2 · Standard Support", color: "#2563eb", bg: "#dbeafe", sla: "Within 12 Hours" },
  3: { label: "Level 3 · Important Academic Matter", color: "#7c3aed", bg: "#ede9fe", sla: "Within 4 Hours" },
  4: { label: "Level 4 · High Priority Request", color: "#d97706", bg: "#fef3c7", sla: "Within 2 Hours" },
  5: { label: "Level 5 · Urgent Administrative Action", color: "#dc2626", bg: "#fee2e2", sla: "Immediate Priority (< 30 Mins)" },
};

export default function ContactUs() {
  const location = useLocation();
  const user = auth.getUser();
  const isStandalone = location.pathname === "/contact-us";

  // Hero slider state
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);

  // Department carousel state (shows 3 cards on desktop, slides one by one)
  const [deptIndex, setDeptIndex] = useState(0);

  // Active campus wing tab
  const [activeWing, setActiveWing] = useState("main");

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState(0);

  // Interactive form state
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    visitorRole: user?.role || "Parent / Guardian",
    department: "Admissions & Registrar Office",
    subject: "",
    urgency: 2,
    satisfactionScore: 95,
    preferredContact: "Email & Phone",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [tickets, setTickets] = useState(() => {
    try {
      const saved = localStorage.getItem("sms_contact_tickets");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Auto-advance hero slider
  useEffect(() => {
    if (heroPaused) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5200);
    return () => clearInterval(timer);
  }, [heroPaused]);

  function nextHero() {
    setHeroIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  }
  function prevHero() {
    setHeroIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }

  function nextDept() {
    setDeptIndex((prev) => (prev + 1) % DEPARTMENTS.length);
  }
  function prevDept() {
    setDeptIndex((prev) => (prev - 1 + DEPARTMENTS.length) % DEPARTMENTS.length);
  }

  function selectDepartmentForForm(deptName) {
    setForm((prev) => ({
      ...prev,
      department: deptName,
      subject: `Inquiry for ${deptName}`,
    }));
    const el = document.getElementById("contact-form-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      const newTicket = {
        id: `SMS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        ...form,
        status: "Received · Assigned to Officer",
      };
      const updated = [newTicket, ...tickets].slice(0, 6);
      setTickets(updated);
      try {
        localStorage.setItem("sms_contact_tickets", JSON.stringify(updated));
      } catch {}
      setSubmittedTicket(newTicket);
      setForm((prev) => ({ ...prev, subject: "", message: "" }));
      setSubmitting(false);
    }, 450);
  }

  const currentHero = HERO_SLIDES[heroIndex];
  const currentUrgency = URGENCY_LEVELS[form.urgency] || URGENCY_LEVELS[2];
  const currentWing = CAMPUS_WINGS.find((w) => w.id === activeWing) || CAMPUS_WINGS[0];

  // Visible departments in the 3-card slider window
  const visibleDepts = [
    DEPARTMENTS[deptIndex % DEPARTMENTS.length],
    DEPARTMENTS[(deptIndex + 1) % DEPARTMENTS.length],
    DEPARTMENTS[(deptIndex + 2) % DEPARTMENTS.length],
  ];

  const backPath = !user ? "/login" : user.role === "Student" ? "/student/home" : "/dashboard";

  return (
    <div style={{ minHeight: isStandalone ? "100vh" : "auto", background: isStandalone ? "linear-gradient(155deg, #dbeafe 0%, #eff6ff 45%, #f8fafc 100%)" : "transparent" }}>
      {/* ── Standalone Executive Top Navigation Bar (when accessed via /contact-us) ── */}
      {isStandalone && (
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            background: "rgba(15, 23, 42, 0.94)",
            backdropFilter: "blur(14px)",
            borderBottom: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.25)",
            padding: "14px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "linear-gradient(135deg, #1d4ed8, #1e3a8a)",
                border: "1px solid rgba(251,191,36,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 6px 18px rgba(29,78,216,0.45)",
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 24, height: 24, color: "#fbbf24" }}>
                <path d="M12 2 2 7l10 5 10-5-10-5Zm0 8L5 6.5V12c0 3.4 2.9 6 7 6s7-2.6 7-6V6.5L12 10Z" />
              </svg>
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: "1.15rem", letterSpacing: "0.02em" }}>
                School SMS · Official Portal
              </div>
              <div style={{ color: "#fde68a", fontSize: "0.76rem", fontStyle: "italic" }}>
                Excellence in Academic Governance & Student Success
              </div>
            </div>
          </div>

          <nav style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <a href="#contact-channels" className="btn btn-sm" style={{ color: "#e2e8f0", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
              Direct Channels
            </a>
            <a href="#departments-slider" className="btn btn-sm" style={{ color: "#e2e8f0", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
              Departments
            </a>
            <a href="#contact-form-section" className="btn btn-sm" style={{ color: "#e2e8f0", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
              Inquiry Form
            </a>
            <Link to={backPath} className="btn btn-primary btn-sm" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none", color: "#fff" }}>
              {user ? "Return to Dashboard →" : "Sign In to Portal →"}
            </Link>
          </nav>
        </header>
      )}

      <div style={{ maxWidth: 1220, margin: "0 auto", padding: isStandalone ? "32px 24px 64px" : "0" }}>
        {/* ── 1. INTERACTIVE HERO CAROUSEL SLIDER ── */}
        <section
          className="pro-slider"
          style={{ background: currentHero.bgGradient, transition: "background 0.6s ease" }}
          onMouseEnter={() => setHeroPaused(true)}
          onMouseLeave={() => setHeroPaused(false)}
        >
          {/* Decorative animated orbs */}
          <div
            style={{
              position: "absolute",
              top: -70,
              right: -60,
              width: 280,
              height: 280,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${currentHero.accent}33 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />

          <div className="pro-slider-slide" key={heroIndex}>
            <div style={{ flex: 1 }}>
              <div className="pro-slider-badge">
                <span>✦</span>
                <span>{currentHero.badge}</span>
                <span style={{ opacity: 0.7 }}>· Slide {heroIndex + 1} of {HERO_SLIDES.length}</span>
              </div>
              <h1 className="pro-slider-title">{currentHero.title}</h1>
              <p className="pro-slider-desc">{currentHero.desc}</p>
              <div style={{ marginTop: 22, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a
                  href={currentHero.ctaTarget}
                  className="btn"
                  style={{
                    background: currentHero.accent,
                    color: "#0f172a",
                    fontWeight: 700,
                    boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
                  }}
                >
                  {currentHero.ctaText} →
                </a>
                <a
                  href="#campus-wings"
                  className="btn"
                  style={{
                    background: "rgba(255,255,255,0.14)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.3)",
                  }}
                >
                  View Campus Locations
                </a>
              </div>
            </div>

            {/* Right Glassmorphic Stat Spotlight Card */}
            <div
              style={{
                minWidth: 240,
                padding: "26px 28px",
                borderRadius: 18,
                background: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 20px 44px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255,255,255,0.3)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#fde68a", fontWeight: 700 }}>
                Service Guarantee
              </div>
              <div style={{ fontSize: "2.6rem", fontWeight: 700, color: "#ffffff", margin: "8px 0 4px", lineHeight: 1 }}>
                {currentHero.statValue}
              </div>
              <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.85)", fontStyle: "italic" }}>
                {currentHero.statLabel}
              </div>
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: "1px solid rgba(255,255,255,0.18)",
                  fontSize: "0.78rem",
                  color: "#bfdbfe",
                }}
              >
                📞 Hotline: +252 61 500 1000
              </div>
            </div>
          </div>

          {/* Slider Bottom Controls */}
          <div className="pro-slider-controls">
            <div className="pro-slider-dots">
              {HERO_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  aria-label={`Slide ${idx + 1}`}
                  className={`pro-slider-dot ${idx === heroIndex ? "active" : ""}`}
                  onClick={() => setHeroIndex(idx)}
                />
              ))}
            </div>
            <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.75)", fontStyle: "italic" }}>
              {heroPaused ? "Slider Paused" : "Auto-Cycling Highlights"}
            </div>
            <div className="pro-slider-arrows">
              <button className="pro-slider-arrow" onClick={prevHero} title="Previous Slide">
                ‹
              </button>
              <button className="pro-slider-arrow" onClick={nextHero} title="Next Slide">
                ›
              </button>
            </div>
          </div>
        </section>

        {/* ── 2. FOUR ELEVATED CONTACT CHANNEL CARDS ── */}
        <div id="contact-channels" className="contact-grid-cards">
          {[
            {
              icon: "🏛️",
              badge: "Headquarters",
              title: "Main Campus Address",
              line1: "KM4 Academic Boulevard, Hodan",
              line2: "Mogadishu, Federal Republic",
              footer: "Gate A & B Visitor Parking Available",
              color: "#1d4ed8",
              bg: "#eaf2ff",
            },
            {
              icon: "📞",
              badge: "Direct Switchboard",
              title: "Telephone & Hotlines",
              line1: "Main Desk: +252 61 500 1000",
              line2: "Admissions: +252 61 500 1001",
              footer: " Toll-Free Parent Line · Ext. 101–115",
              color: "#059669",
              bg: "#d1fae5",
            },
            {
              icon: "✉️",
              badge: "Official Dispatch",
              title: "Email Directory",
              line1: "info@schoolsms.edu",
              line2: "admissions@schoolsms.edu",
              footer: "24/7 Automated Ticket Tracking",
              color: "#7c3aed",
              bg: "#ede9fe",
            },
            {
              icon: "🕰️",
              badge: "Campus Schedule",
              title: "Office & Visiting Hours",
              line1: "Sat – Thu: 7:30 AM – 5:00 PM",
              line2: "Friday: Closed (Online Portal Open)",
              footer: "Appointments Recommended for Tours",
              color: "#d97706",
              bg: "#fef3c7",
            },
          ].map((c) => (
            <div key={c.title} className="contact-channel-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 14,
                    background: c.bg,
                    color: c.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    boxShadow: "0 8px 18px rgba(15,23,42,0.08)",
                  }}
                >
                  {c.icon}
                </div>
                <span className="badge" style={{ background: c.bg, color: c.color }}>
                  {c.badge}
                </span>
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>{c.title}</h3>
              <div style={{ fontSize: "0.92rem", color: "var(--text)", fontWeight: 600 }}>{c.line1}</div>
              <div style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginTop: 3 }}>{c.line2}</div>
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: "1px dashed var(--border)",
                  fontSize: "0.8rem",
                  color: c.color,
                  fontWeight: 700,
                  fontStyle: "italic",
                }}
              >
                ✦ {c.footer}
              </div>
            </div>
          ))}
        </div>

        {/* ── 3. INTERACTIVE DEPARTMENT & LEADERSHIP DIRECTORY SLIDER ── */}
        <section id="departments-slider" className="card" style={{ marginBottom: 28 }}>
          <div className="card-header" style={{ flexWrap: "wrap", gap: 14 }}>
            <div>
              <div className="card-title" style={{ fontSize: "1.25rem" }}>
                Academic & Administrative Department Directory Slider
              </div>
              <div className="card-subtitle">
                Slide through our specialized offices and click "Direct Inquiry" to route your message directly to the department head.
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="badge badge-blue">
                Showing {deptIndex + 1}–{((deptIndex + 2) % DEPARTMENTS.length) + 1} of {DEPARTMENTS.length} Offices
              </span>
              <button className="btn btn-secondary btn-sm" onClick={prevDept} title="Previous Department">
                ← Prev
              </button>
              <button className="btn btn-primary btn-sm" onClick={nextDept} title="Next Department">
                Next →
              </button>
            </div>
          </div>

          <div className="card-body">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 20 }}>
              {visibleDepts.map((dept) => (
                <div
                  key={dept.id}
                  className="animate-fade"
                  style={{
                    borderRadius: 16,
                    border: "1px solid var(--border)",
                    background: "linear-gradient(175deg, #ffffff 0%, #f8fbff 100%)",
                    padding: 22,
                    boxShadow: "var(--shadow-sm)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "transform 0.28s ease, box-shadow 0.28s ease",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <span
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: dept.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.35rem",
                          boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
                        }}
                      >
                        {dept.icon}
                      </span>
                      <span className="badge" style={{ background: dept.bg, color: dept.color }}>
                        {dept.sla}
                      </span>
                    </div>

                    <h4 style={{ fontSize: "1.12rem", fontWeight: 700, color: "var(--text)" }}>{dept.name}</h4>
                    <div style={{ fontSize: "0.86rem", fontWeight: 700, color: dept.color, marginTop: 3 }}>
                      {dept.officer} · <span style={{ fontStyle: "italic", fontWeight: 500 }}>{dept.role}</span>
                    </div>
                    <p style={{ fontSize: "0.86rem", color: "var(--text-muted)", margin: "10px 0 14px", lineHeight: 1.55 }}>
                      {dept.summary}
                    </p>
                  </div>

                  <div>
                    <div
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "#f1f6fd",
                        fontSize: "0.82rem",
                        color: "var(--text)",
                        marginBottom: 14,
                        lineHeight: 1.6,
                      }}
                    >
                      <div><strong>✉️ Email:</strong> {dept.email}</div>
                      <div><strong>📞 Direct:</strong> {dept.phone}</div>
                      <div><strong>📍 Office:</strong> {dept.room}</div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ width: "100%" }}
                      onClick={() => selectDepartmentForForm(dept.name)}
                    >
                      Message This Office →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Department dot indicators */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
              {DEPARTMENTS.map((d, idx) => (
                <button
                  key={d.id}
                  onClick={() => setDeptIndex(idx)}
                  style={{
                    width: idx === deptIndex ? 28 : 10,
                    height: 10,
                    borderRadius: 999,
                    border: "none",
                    background: idx === deptIndex ? "var(--primary)" : "#cbd5e1",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                  }}
                  title={d.name}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. MAIN TWO-COLUMN SECTION: INQUIRY FORM + CAMPUS WINGS & TICKET TRACKER ── */}
        <div id="contact-form-section" className="contact-main-layout">
          {/* Left Column: Interactive Official Contact & Support Form */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title" style={{ fontSize: "1.25rem" }}>
                  Send an Official Inquiry or Support Request
                </div>
                <div className="card-subtitle">
                  Complete the form below to receive an instant tracking reference ID.
                </div>
              </div>
              <span className="badge badge-green">● Online Dispatch Active</span>
            </div>

            <div className="card-body">
              {submittedTicket && (
                <div
                  className="alert alert-success animate-scale"
                  style={{
                    marginBottom: 22,
                    padding: "16px 18px",
                    flexDirection: "column",
                    gap: 6,
                    borderLeft: "5px solid #059669",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: 8 }}>
                    <strong style={{ fontSize: "1rem" }}>
                      ✓ Inquiry Dispatched Successfully!
                    </strong>
                    <span className="badge badge-green" style={{ fontSize: "0.8rem" }}>
                      Ticket #{submittedTicket.id}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.88rem" }}>
                    Routed to <strong>{submittedTicket.department}</strong> ({URGENCY_LEVELS[submittedTicket.urgency]?.label}). A confirmation copy has been logged for <strong>{submittedTicket.email}</strong>.
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="form-grid" style={{ gap: 18 }}>
                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      className="form-input"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Abdirahman Mohamed"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className="form-input"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="your.email@domain.com"
                    />
                  </div>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Telephone / WhatsApp Number</label>
                    <input
                      className="form-input"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+252 61 XXX XXXX"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Your Role / Affiliation</label>
                    <select
                      className="form-select"
                      value={form.visitorRole}
                      onChange={(e) => setForm({ ...form, visitorRole: e.target.value })}
                    >
                      <option>Parent / Guardian</option>
                      <option>Current Student</option>
                      <option>Prospective Applicant</option>
                      <option>Teacher / Faculty Member</option>
                      <option>Administrator</option>
                      <option>External Partner / Visitor</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Target Department / Office *</label>
                    <select
                      className="form-select"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.icon} {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preferred Response Channel</label>
                    <select
                      className="form-select"
                      value={form.preferredContact}
                      onChange={(e) => setForm({ ...form, preferredContact: e.target.value })}
                    >
                      <option>Email & Phone</option>
                      <option>Email Only</option>
                      <option>Telephone Call</option>
                      <option>In-Person Campus Appointment</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Inquiry Subject *</label>
                  <input
                    className="form-input"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Brief summary of your question or request..."
                  />
                </div>

                {/* Interactive Urgency / Priority Slider */}
                <div
                  style={{
                    padding: "16px 18px",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      Interactive Priority & Response Urgency Slider
                    </label>
                    <span
                      className="badge"
                      style={{
                        background: currentUrgency.bg,
                        color: currentUrgency.color,
                        fontSize: "0.78rem",
                      }}
                    >
                      {currentUrgency.label} ({currentUrgency.sla})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    className="pro-range-slider"
                    value={form.urgency}
                    onChange={(e) => setForm({ ...form, urgency: Number(e.target.value) })}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", color: "var(--text-muted)", marginTop: 6 }}>
                    <span>1 · Low</span>
                    <span>2 · Standard</span>
                    <span>3 · Important</span>
                    <span>4 · High</span>
                    <span>5 · Urgent</span>
                  </div>
                </div>

                {/* Interactive Portal Experience Slider */}
                <div
                  style={{
                    padding: "14px 18px",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "#ffffff",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      Portal Experience Rating Slider
                    </label>
                    <span className="badge badge-blue">{form.satisfactionScore}% Satisfaction</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    className="pro-range-slider"
                    value={form.satisfactionScore}
                    onChange={(e) => setForm({ ...form, satisfactionScore: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Detailed Message *</label>
                  <textarea
                    rows={4}
                    className="form-textarea"
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Please provide full details (include Student Name, EMIS Number, or Class Level if applicable)..."
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                    🔒 Protected by School SMS Official Data Privacy Policy
                  </span>
                  <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                    {submitting ? "Dispatching Inquiry..." : "Submit Official Inquiry →"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Campus Wings Interactive Switcher & Recent Tickets */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Campus Wings Interactive Card */}
            <div id="campus-wings" className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Campus Wings & Visitor Guide</div>
                  <div className="card-subtitle">Select a building wing to inspect facilities & hours</div>
                </div>
              </div>
              <div className="card-body">
                <div className="tabs" style={{ width: "100%", marginBottom: 18, display: "flex" }}>
                  {CAMPUS_WINGS.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      className={`tab ${activeWing === w.id ? "active" : ""}`}
                      style={{ flex: 1 }}
                      onClick={() => setActiveWing(w.id)}
                    >
                      {w.name.split(" ")[0]} Wing
                    </button>
                  ))}
                </div>

                {/* Visual Campus Map / Architectural Preview Card */}
                <div
                  key={currentWing.id}
                  className="animate-fade"
                  style={{
                    borderRadius: 16,
                    padding: 22,
                    background: "linear-gradient(145deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)",
                    color: "#ffffff",
                    boxShadow: "var(--shadow)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span className="badge" style={{ background: "rgba(251,191,36,0.22)", color: "#fde68a", border: "1px solid rgba(251,191,36,0.4)" }}>
                      📍 {currentWing.badge}
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "#93c5fd" }}>{currentWing.coordinates}</span>
                  </div>
                  <h4 style={{ fontSize: "1.22rem", fontWeight: 700 }}>{currentWing.name}</h4>
                  <p style={{ fontSize: "0.86rem", color: "rgba(255,255,255,0.8)", fontStyle: "italic", marginTop: 2 }}>
                    {currentWing.subtitle}
                  </p>

                  <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 7, fontSize: "0.86rem" }}>
                    <div><strong>🏛️ Location:</strong> {currentWing.address}</div>
                    <div><strong>🕰️ Hours:</strong> {currentWing.hours}</div>
                    <div><strong>📞 Desk:</strong> {currentWing.phone} · {currentWing.email}</div>
                  </div>

                  <div style={{ marginTop: 16, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {currentWing.facilities.map((fac) => (
                      <span
                        key={fac}
                        style={{
                          fontSize: "0.73rem",
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: "rgba(255,255,255,0.14)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          color: "#e0f2fe",
                          fontWeight: 600,
                        }}
                      >
                        ✓ {fac}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Submitted Inquiry Tickets Card */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Your Recent Inquiry Tickets</div>
                  <div className="card-subtitle">Live tracking of inquiries submitted from this browser</div>
                </div>
                <span className="badge badge-purple">{tickets.length} Logged</span>
              </div>
              <div className="card-body" style={{ padding: tickets.length === 0 ? 24 : 0 }}>
                {tickets.length === 0 ? (
                  <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    No inquiries submitted yet. Use the form on the left to create an official support ticket.
                  </div>
                ) : (
                  tickets.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: "14px 20px",
                        borderBottom: "1px solid var(--border-light)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <strong style={{ fontSize: "0.92rem", color: "var(--primary)" }}>#{t.id} · {t.subject}</strong>
                        <span className="badge badge-green">{t.status}</span>
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                        <strong>Office:</strong> {t.department} · <strong>Submitted:</strong> {t.createdAt}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── 5. INTERACTIVE FAQ ACCORDION ── */}
        <section className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div>
              <div className="card-title" style={{ fontSize: "1.22rem" }}>
                Frequently Asked Questions (FAQ)
              </div>
              <div className="card-subtitle">
                Instant answers to common questions regarding admissions, examinations, and portal access.
              </div>
            </div>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FAQS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={item.q}
                  style={{
                    borderRadius: 12,
                    border: isOpen ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                    background: isOpen ? "#f5f9ff" : "#ffffff",
                    boxShadow: isOpen ? "var(--shadow-sm)" : "none",
                    transition: "all 0.25s ease",
                    overflow: "hidden",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    style={{
                      width: "100%",
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 14,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: isOpen ? "var(--primary)" : "var(--text)",
                    }}
                  >
                    <span>Q{idx + 1}. {item.q}</span>
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: isOpen ? "var(--primary)" : "#e2e8f0",
                        color: isOpen ? "#fff" : "var(--text)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "transform 0.25s ease",
                        transform: isOpen ? "rotate(180deg)" : "none",
                      }}
                    >
                      ▾
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      className="animate-fade"
                      style={{
                        padding: "0 20px 18px",
                        fontSize: "0.92rem",
                        color: "var(--text-muted)",
                        lineHeight: 1.65,
                        borderTop: "1px dashed var(--border)",
                        paddingTop: 12,
                      }}
                    >
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Standalone Footer */}
      {isStandalone && (
        <footer
          style={{
            background: "#0f172a",
            color: "rgba(255,255,255,0.78)",
            padding: "28px 32px",
            textAlign: "center",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            fontSize: "0.88rem",
          }}
        >
          <div style={{ fontWeight: 700, color: "#ffffff", fontSize: "1rem", marginBottom: 4 }}>
            School SMS · Comprehensive School Management System
          </div>
          <div style={{ fontStyle: "italic", color: "#94a3b8" }}>
            © {new Date().getFullYear()} All Rights Reserved · Admissions, Examinations, Attendance & Finance Portal
          </div>
        </footer>
      )}
    </div>
  );
}
