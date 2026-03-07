import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { auth } from "../lib/auth";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("abdi@gmail.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0f4f8 0%, #e0e7ff 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", position: "relative", overflow: "hidden" }}>
      {/* Decorative background blobs */}
      <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: "rgba(37,99,235,0.06)", filter: "blur(80px)" }} />
      <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: 600, height: 600, borderRadius: "50%", background: "rgba(139,92,246,0.06)", filter: "blur(100px)" }} />

      <div className="animate-scale login-container" style={{ position: "relative", zIndex: 10 }}>
        {/* Left Panel */}
        <aside className="login-aside">
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "rgba(255,255,255,0.15)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(255,255,255,0.25)", marginBottom: 36, backdropFilter: "blur(10px)" }}>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 22, height: 22, color: "#fbbf24" }}>
                <path d="M12 2 2 7l10 5 10-5-10-5Zm0 8L5 6.5V12c0 3.4 2.9 6 7 6s7-2.6 7-6V6.5L12 10Z"/>
              </svg>
              <span style={{ fontSize: ".9rem", fontWeight: 700, color: "#fff", letterSpacing: "0.02em" }}>School SMS</span>
            </div>
            
            <h2 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.03em" }}>
              Welcome back,<br/>Admin
            </h2>
            <p style={{ marginTop: 16, fontSize: ".9rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.6, maxWidth: "90%" }}>
              Sign in to manage your school's students, classes, enrollments, promotions, and more.
            </p>
          </div>

          <div className="features-list" style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative", zIndex: 2 }}>
            {[
              { label: "Student Promotions & History", icon: "🎓" },
              { label: "Attendance Tracking", icon: "✅" },
              { label: "Exams & Report Cards", icon: "📝" },
              { label: "Fee Management", icon: "💳" },
            ].map(f => (
              <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, background: "rgba(255,255,255,0.15)", borderRadius: "8px", fontSize: "1rem" }}>{f.icon}</span>
                <span style={{ fontSize: ".85rem", color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>{f.label}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Panel */}
        <section className="login-main">
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text)", letterSpacing: "-.02em" }}>Sign In</h1>
            <p style={{ marginTop: 6, fontSize: ".88rem", color: "var(--text-muted)" }}>Enter your credentials to access the dashboard.</p>
          </div>

          {error && (
            <div className="animate-fade" style={{ marginBottom: 20, padding: "12px 16px", background: "var(--danger-bg)", border: "1px solid #fca5a5", borderRadius: "var(--radius-sm)", fontSize: ".85rem", color: "#991b1b", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, marginTop: 2, flexShrink: 0 }}><path d="M12 22A10 10 0 1 1 12 2a10 10 0 0 1 0 20Zm-1-7v2h2v-2h-2Zm0-8v6h2V7h-2Z"/></svg>
              <span style={{ lineHeight: 1.4 }}>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>Email Address</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", transition: "all .15s" }}
                onFocus={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,.1)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, color: "var(--text-light)", flexShrink: 0 }}><path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v.5L12 13 3 6.5V6Zm0 3 8.4 5.6a1 1 0 0 0 1.2 0L21 9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" fill="currentColor"/></svg>
                <input value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: ".88rem", color: "var(--text)", fontFamily: "inherit" }} placeholder="admin@school.com" />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>Password</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", transition: "all .15s" }}
                 onFocus={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,.1)"; }}
                 onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, color: "var(--text-light)", flexShrink: 0 }}><path d="M17 9V7a5 5 0 0 0-10 0v2H5v12h14V9h-2Zm-8 0V7a3 3 0 0 1 6 0v2H9Z"/></svg>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: ".88rem", color: "var(--text)", fontFamily: "inherit" }} placeholder="••••••••" />
              </div>
            </div>

            <button disabled={loading} style={{ marginTop: 8, padding: "14px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--primary)", color: "#fff", fontSize: ".92rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .7 : 1, boxShadow: "var(--shadow-blue)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit", transition: "all .2s" }}
              onMouseOver={e => !loading && (e.currentTarget.style.background = "var(--primary-dark)")}
              onMouseOut={e => !loading && (e.currentTarget.style.background = "var(--primary)")}
            >
              {loading ? (
                <>
                  <svg style={{ width: 18, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none"><path d="M12 3a9 9 0 1 0 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                  Signing in...
                </>
              ) : (
                <>Sign In</>
              )}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
