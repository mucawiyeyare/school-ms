import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { auth } from "../lib/auth";

const LOGIN_SLIDES = [
  {
    icon: "🎓",
    title: "Automated Promotions & Academic Records",
    desc: "Seamless grade transitions, EMIS tracking, and complete multi-year academic history for every student.",
  },
  {
    icon: "📝",
    title: "Examinations, Rankings & Report Cards",
    desc: "Comprehensive assessment management across Monthly, Midterm, and Final exams with automated class positioning.",
  },
  {
    icon: "✅",
    title: "Real-Time Attendance & Tuition Tracking",
    desc: "Daily classroom attendance sheets, instant student portal updates, and verified tuition payment ledgers.",
  },
];

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("abdi@gmail.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % LOGIN_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      auth.setToken(data.token);
      auth.setUser(data.user);
      nav(data.user?.role === "Student" ? "/student/home" : "/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const activeSlide = LOGIN_SLIDES[slideIdx];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #f0f4f8 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", position: "relative", overflow: "hidden" }}>
      {/* Decorative background blobs */}
      <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 520, height: 520, borderRadius: "50%", background: "rgba(37,99,235,0.08)", filter: "blur(80px)" }} />
      <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: 620, height: 620, borderRadius: "50%", background: "rgba(139,92,246,0.08)", filter: "blur(100px)" }} />

      <div className="animate-scale login-container" style={{ position: "relative", zIndex: 10 }}>
        {/* Left Panel with Interactive Showcase Slider */}
        <aside className="login-aside">
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 15px", background: "rgba(255,255,255,0.15)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(255,255,255,0.28)", marginBottom: 30, backdropFilter: "blur(10px)", boxShadow: "0 8px 20px rgba(0,0,0,0.18)" }}>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 22, height: 22, color: "#fbbf24" }}>
                <path d="M12 2 2 7l10 5 10-5-10-5Zm0 8L5 6.5V12c0 3.4 2.9 6 7 6s7-2.6 7-6V6.5L12 10Z"/>
              </svg>
              <span style={{ fontSize: ".96rem", fontWeight: 700, color: "#fff", letterSpacing: "0.02em" }}>School SMS · Executive Portal</span>
            </div>

            <h2 style={{ fontSize: "2.25rem", fontWeight: 700, color: "#fff", lineHeight: 1.15 }}>
              Welcome to School SMS
            </h2>
            <p style={{ marginTop: 14, fontSize: ".94rem", color: "rgba(255,255,255,0.82)", lineHeight: 1.6, fontStyle: "italic" }}>
              Sign in to manage students, classes, enrollments, examinations, promotions, and institutional records.
            </p>
          </div>

          {/* Interactive Feature Slider Card inside Login Aside */}
          <div
            key={slideIdx}
            className="animate-fade"
            style={{
              position: "relative",
              zIndex: 2,
              margin: "24px 0",
              padding: "20px 22px",
              borderRadius: 16,
              background: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.24)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 14px 32px rgba(0, 0, 0, 0.22)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <span style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(251,191,36,0.22)", border: "1px solid rgba(251,191,36,0.45)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                {activeSlide.icon}
              </span>
              <span style={{ fontSize: "1.02rem", fontWeight: 700, color: "#fff" }}>{activeSlide.title}</span>
            </div>
            <p style={{ fontSize: "0.86rem", color: "rgba(255,255,255,0.84)", lineHeight: 1.55 }}>
              {activeSlide.desc}
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {LOGIN_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSlideIdx(idx)}
                    style={{
                      width: idx === slideIdx ? 22 : 8,
                      height: 8,
                      borderRadius: 999,
                      border: "none",
                      background: idx === slideIdx ? "#fbbf24" : "rgba(255,255,255,0.35)",
                      cursor: "pointer",
                      transition: "all 0.25s ease",
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: "0.75rem", color: "#fde68a", fontStyle: "italic" }}>
                Slide {slideIdx + 1} / {LOGIN_SLIDES.length}
              </span>
            </div>
          </div>

          <div style={{ position: "relative", zIndex: 2 }}>
            <Link
              to="/contact-us"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                borderRadius: 10,
                background: "rgba(251, 191, 36, 0.2)",
                border: "1px solid rgba(251, 191, 36, 0.45)",
                color: "#fde68a",
                fontSize: "0.88rem",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
              }}
            >
              ✉️ Visit Official Contact Us & Support Page →
            </Link>
          </div>
        </aside>

        {/* Right Panel */}
        <section className="login-main">
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: "1.95rem", fontWeight: 700, color: "var(--text)" }}>Sign In to Portal</h1>
            <p style={{ marginTop: 6, fontSize: ".92rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              Enter your official credentials to access the dashboard.
            </p>
          </div>

          {error && (
            <div className="animate-fade" style={{ marginBottom: 20, padding: "12px 16px", background: "var(--danger-bg)", border: "1px solid #fca5a5", borderRadius: "var(--radius-sm)", fontSize: ".88rem", color: "#991b1b", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, marginTop: 2, flexShrink: 0 }}><path d="M12 22A10 10 0 1 1 12 2a10 10 0 0 1 0 20Zm-1-7v2h2v-2h-2Zm0-8v6h2V7h-2Z"/></svg>
              <span style={{ lineHeight: 1.4 }}>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: ".86rem", fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Email Address</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-sm)", transition: "all .15s" }}>
                <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, color: "var(--text-light)", flexShrink: 0 }}><path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v.5L12 13 3 6.5V6Zm0 3 8.4 5.6a1 1 0 0 0 1.2 0L21 9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" fill="currentColor"/></svg>
                <input value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: ".94rem", color: "var(--text)" }} placeholder="admin@school.com" />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: ".86rem", fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Password</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-sm)", transition: "all .15s" }}>
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, color: "var(--text-light)", flexShrink: 0 }}><path d="M17 9V7a5 5 0 0 0-10 0v2H5v12h14V9h-2Zm-8 0V7a3 3 0 0 1 6 0v2H9Z"/></svg>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: ".94rem", color: "var(--text)" }} placeholder="••••••••" />
              </div>
            </div>

            <button disabled={loading} className="btn btn-primary btn-lg" style={{ marginTop: 8, width: "100%" }}>
              {loading ? "Signing in..." : "Sign In to Dashboard →"}
            </button>
          </form>

          <div style={{ marginTop: 22, paddingTop: 16, borderTop: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.86rem", color: "var(--text-muted)" }}>
            <span>Need help with your account?</span>
            <Link to="/contact-us" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>
              Contact Admissions / IT Support →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
