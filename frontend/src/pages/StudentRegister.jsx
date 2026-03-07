import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

// ── Step indicator ───────────────────────────────────────────────────────────
const STEPS = [
  { num: 1, label: "Login Details",   icon: "🔐" },
  { num: 2, label: "Personal Info",   icon: "👤" },
  { num: 3, label: "Contact & Guardian", icon: "📞" },
  { num: 4, label: "Class Placement", icon: "🏫" },
];

function StepIndicator({ current }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 0, marginBottom: 36, overflowX: "auto", paddingBottom: 4,
    }}>
      {STEPS.map((step, i) => {
        const done    = current > step.num;
        const active  = current === step.num;
        return (
          <div key={step.num} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 42, height: 42, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: ".85rem",
                background: done    ? "var(--success)"  :
                            active  ? "var(--primary)"  : "var(--border)",
                color:      done    ? "#fff"             :
                            active  ? "#fff"             : "var(--text-muted)",
                boxShadow:  active  ? "0 0 0 4px rgba(79,70,229,.2)" : "none",
                transition: "all .3s",
              }}>
                {done ? "✓" : step.icon}
              </div>
              <span style={{
                fontSize: ".68rem", fontWeight: active ? 700 : 500,
                color: active ? "var(--primary)" : done ? "var(--success)" : "var(--text-muted)",
                whiteSpace: "nowrap",
              }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                width: 48, height: 2, margin: "0 4px", marginBottom: 22, flexShrink: 0,
                background: done ? "var(--success)" : "var(--border)",
                transition: "background .3s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Section heading ──────────────────────────────────────────────────────────
function SectionHead({ emoji, title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: "1.3rem" }}>{emoji}</span>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text)", letterSpacing: "-.02em" }}>
          {title}
        </h2>
      </div>
      {subtitle && (
        <p style={{ fontSize: ".8rem", color: "var(--text-muted)", marginLeft: 36 }}>{subtitle}</p>
      )}
    </div>
  );
}

// ── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, required, hint, children, col }) {
  return (
    <div className="reg-field" style={{ gridColumn: col || undefined }}>
      <label className="form-label">
        {label}
        {required && <span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>}
        {!required && <span style={{ color: "var(--text-light)", fontWeight: 400, marginLeft: 4 }}>(optional)</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: ".7rem", color: "var(--text-light)", marginTop: 3 }}>{hint}</p>}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  email: "", password: "", confirmPassword: "",
  firstName: "", lastName: "", gender: "Male",
  dateOfBirth: "", admissionDate: new Date().toISOString().slice(0, 10),
  phone: "", address: "", emisNumber: "",
  guardianName: "", guardianPhone: "",
  emergencyContactName: "", emergencyContactPhone: "",
  academicYearId: "", classLevelId: "", sectionId: "",
};

export default function StudentRegister() {
  const navigate    = useNavigate();
  const photoRef    = useRef(null);

  const [step, setStep]           = useState(1);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);
  const [showPass, setShowPass]   = useState(false);

  // Lookups
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses]             = useState([]);
  const [sections, setSections]           = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  const filteredSections = sections.filter(
    s => (s.classLevelId?._id || s.classLevelId) === form.classLevelId
  );

  useEffect(() => {
    Promise.all([
      api.get("/api/academic-years"),
      api.get("/api/classes"),
      api.get("/api/sections"),
    ]).then(([yR, cR, sR]) => {
      const activeYear = yR.data.find(y => y.status === "active") || yR.data[0];
      setAcademicYears(yR.data);
      setClasses(cR.data);
      setSections(sR.data);
      setForm(p => ({
        ...p,
        academicYearId: activeYear?._id || "",
        classLevelId:   cR.data[0]?._id  || "",
        sectionId:      "",
      }));
    }).catch(console.error)
      .finally(() => setLoadingLookups(false));
  }, []);

  function onChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  }

  function onPhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Photo must be under 5 MB"); return; }
    setPhotoPreview(URL.createObjectURL(file));
    setError("");
  }

  // ── Validation per step ──────────────────────────────────────────────────
  function validateStep(s) {
    if (s === 1) {
      if (!form.email.trim())    return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email address";
      if (!form.password)        return "Password is required";
      if (form.password.length < 6) return "Password must be at least 6 characters";
      if (form.password !== form.confirmPassword) return "Passwords do not match";
    }
    if (s === 2) {
      if (!form.firstName.trim()) return "First name is required";
      if (!form.lastName.trim())  return "Last name is required";
    }
    if (s === 4) {
      if (!form.academicYearId)  return "Please select an Academic Year";
      if (!form.classLevelId)    return "Please select a Class";
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError("");
    setStep(s => Math.min(s + 1, 4));
  }
  function back() {
    setError("");
    setStep(s => Math.max(s - 1, 1));
  }

  async function submit(e) {
    e.preventDefault();
    const finalErr = validateStep(4);
    if (finalErr) { setError(finalErr); return; }

    setSaving(true); setError("");
    try {
      const fd = new FormData();
      fd.append("email",     form.email.trim());
      fd.append("password",  form.password);
      fd.append("firstName", form.firstName.trim());
      fd.append("lastName",  form.lastName.trim());
      fd.append("gender",    form.gender);
      if (form.dateOfBirth)           fd.append("dateOfBirth",           form.dateOfBirth);
      if (form.admissionDate)         fd.append("admissionDate",          form.admissionDate);
      if (form.phone)                 fd.append("phone",                  form.phone);
      if (form.address)               fd.append("address",                form.address);
      if (form.emisNumber.trim())     fd.append("emisNumber",             form.emisNumber.trim());
      if (form.guardianName)          fd.append("guardianName",           form.guardianName);
      if (form.guardianPhone)         fd.append("guardianPhone",          form.guardianPhone);
      if (form.emergencyContactName)  fd.append("emergencyContactName",   form.emergencyContactName);
      if (form.emergencyContactPhone) fd.append("emergencyContactPhone",  form.emergencyContactPhone);
      if (form.academicYearId)        fd.append("academicYearId",         form.academicYearId);
      if (form.classLevelId)          fd.append("classLevelId",           form.classLevelId);
      if (form.sectionId)             fd.append("sectionId",              form.sectionId);
      const photoFile = photoRef.current?.files?.[0];
      if (photoFile) fd.append("photo", photoFile);

      await api.post("/api/students", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed. Please check your details.");
    } finally {
      setSaving(false);
    }
  }

  // ── Success screen ───────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="reg-page">
        <div className="reg-card animate-scale" style={{ maxWidth: 480, textAlign: "center", padding: "56px 40px" }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%", margin: "0 auto 24px",
            background: "var(--success-bg)", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "2rem",
            boxShadow: "0 0 0 12px rgba(16,185,129,.1)",
          }}>✅</div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>
            Student Registered!
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: ".9rem", marginBottom: 32, lineHeight: 1.7 }}>
            <strong>{form.firstName} {form.lastName}</strong> has been successfully registered and their
            student portal account has been created.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              className="btn btn-primary btn-lg"
              style={{ width: "100%" }}
              onClick={() => { setStep(1); setForm(EMPTY_FORM); setPhotoPreview(null); setSuccess(false); if (photoRef.current) photoRef.current.value = ""; }}
            >
              ➕ Register Another Student
            </button>
            <button className="btn btn-secondary btn-lg" style={{ width: "100%" }} onClick={() => navigate("/students")}>
              📋 View All Students
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reg-page">
      {/* ── Page header ── */}
      <div className="reg-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate("/students")} title="Back to Students">
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 16 }}><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Back
          </button>
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text)", letterSpacing: "-.02em" }}>
              Register New Student
            </h1>
            <p style={{ fontSize: ".82rem", color: "var(--text-muted)", marginTop: 2 }}>
              Complete all steps to create a student account and enroll them in a class.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: ".78rem", color: "var(--text-muted)" }}>Step {step} of 4</span>
          <div style={{ width: 100, height: 6, borderRadius: 999, background: "var(--border)", overflow: "hidden" }}>
            <div style={{ width: `${(step / 4) * 100}%`, height: "100%", background: "var(--primary)", borderRadius: 999, transition: "width .4s ease" }} />
          </div>
        </div>
      </div>

      <div className="reg-body">
        {/* ── Left: Photo + step list ── */}
        <aside className="reg-sidebar-panel">
          {/* Photo upload */}
          <div className="reg-card" style={{ padding: 24, marginBottom: 16 }}>
            <p style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 14 }}>
              Student Photo
            </p>
            <div
              onClick={() => photoRef.current?.click()}
              style={{
                width: 100, height: 100, borderRadius: "50%",
                margin: "0 auto 14px", cursor: "pointer",
                background: photoPreview ? "transparent" : "var(--primary-bg)",
                border: "3px dashed var(--primary-light)",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", position: "relative",
                transition: "all .2s",
              }}
              title="Click to upload photo"
            >
              {photoPreview
                ? <img src={photoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (
                  <div style={{ textAlign: "center" }}>
                    <svg viewBox="0 0 24 24" fill="none" style={{ width: 32, color: "var(--primary-light)", display: "block", margin: "0 auto" }}>
                      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    <span style={{ fontSize: ".6rem", color: "var(--primary-light)", marginTop: 4, display: "block" }}>Click to upload</span>
                  </div>
                )
              }
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button type="button" className="btn btn-secondary btn-sm" style={{ width: "100%" }} onClick={() => photoRef.current?.click()}>
                {photoPreview ? "Change Photo" : "Upload Photo"}
              </button>
              {photoPreview && (
                <button type="button" className="btn btn-sm" style={{ width: "100%", color: "var(--danger)", border: "1px solid #fca5a5", background: "var(--danger-bg)" }}
                  onClick={() => { setPhotoPreview(null); if (photoRef.current) photoRef.current.value = ""; }}>
                  Remove
                </button>
              )}
            </div>
            <p style={{ fontSize: ".68rem", color: "var(--text-light)", textAlign: "center", marginTop: 10 }}>JPG, PNG, WEBP · max 5 MB</p>
            <input ref={photoRef} type="file" accept="image/*" onChange={onPhotoChange} style={{ display: "none" }} />
          </div>

          {/* Step list */}
          <div className="reg-card" style={{ padding: "20px 20px" }}>
            <p style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 14 }}>
              Progress
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {STEPS.map(s => {
                const done   = step > s.num;
                const active = step === s.num;
                return (
                  <div key={s.num} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px", borderRadius: 10,
                    background: active ? "var(--primary-bg)" : done ? "var(--success-bg)" : "transparent",
                    transition: "all .2s",
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: ".75rem", fontWeight: 800,
                      background: done ? "var(--success)" : active ? "var(--primary)" : "var(--border)",
                      color: (done || active) ? "#fff" : "var(--text-muted)",
                    }}>
                      {done ? "✓" : s.num}
                    </div>
                    <div>
                      <div style={{ fontSize: ".82rem", fontWeight: active ? 700 : 500, color: active ? "var(--primary)" : done ? "var(--success)" : "var(--text-muted)" }}>
                        {s.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ── Right: Form ── */}
        <main className="reg-main-panel">
          <div className="reg-card" style={{ padding: "36px 40px" }}>
            <StepIndicator current={step} />

            {/* Error banner */}
            {error && (
              <div className="alert alert-error animate-fade" style={{ marginBottom: 24 }}>
                <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, flexShrink: 0 }}>
                  <path d="M12 9v4m0 4h.01M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={submit}>

              {/* ══ STEP 1: Login Details ══════════════════════════════════ */}
              {step === 1 && (
                <div className="animate-fade">
                  <SectionHead emoji="🔐" title="Student Login Details" subtitle="These credentials will be used by the student to access their portal." />
                  <div className="reg-grid">
                    <Field label="Student Email Address" required col="1 / -1">
                      <input type="email" name="email" value={form.email} onChange={onChange}
                        className="form-input" placeholder="student@school.edu" autoFocus />
                    </Field>
                    <Field label="Portal Password" required hint="Minimum 6 characters">
                      <div style={{ position: "relative" }}>
                        <input type={showPass ? "text" : "password"} name="password" value={form.password}
                          onChange={onChange} className="form-input" placeholder="••••••••"
                          style={{ paddingRight: 40 }} />
                        <button type="button" onClick={() => setShowPass(p => !p)}
                          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: ".8rem" }}>
                          {showPass ? "🙈" : "👁️"}
                        </button>
                      </div>
                    </Field>
                    <Field label="Confirm Password" required>
                      <input type={showPass ? "text" : "password"} name="confirmPassword" value={form.confirmPassword}
                        onChange={onChange} className="form-input" placeholder="••••••••" />
                      {form.confirmPassword && form.password !== form.confirmPassword && (
                        <p style={{ fontSize: ".7rem", color: "var(--danger)", marginTop: 3 }}>Passwords do not match</p>
                      )}
                      {form.confirmPassword && form.password === form.confirmPassword && form.confirmPassword.length >= 6 && (
                        <p style={{ fontSize: ".7rem", color: "var(--success)", marginTop: 3 }}>✓ Passwords match</p>
                      )}
                    </Field>
                  </div>
                </div>
              )}

              {/* ══ STEP 2: Personal Info ══════════════════════════════════ */}
              {step === 2 && (
                <div className="animate-fade">
                  <SectionHead emoji="👤" title="Personal Information" subtitle="Enter the student's full personal details as on official documents." />
                  <div className="reg-grid">
                    <Field label="First Name" required>
                      <input name="firstName" value={form.firstName} onChange={onChange}
                        className="form-input" placeholder="Emma" autoFocus />
                    </Field>
                    <Field label="Last Name" required>
                      <input name="lastName" value={form.lastName} onChange={onChange}
                        className="form-input" placeholder="Watson" />
                    </Field>
                    <Field label="Gender" required>
                      <select name="gender" value={form.gender} onChange={onChange} className="form-select">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </Field>
                    <Field label="EMIS Number" hint="Education Management Information System ID">
                      <input name="emisNumber" value={form.emisNumber} onChange={onChange}
                        className="form-input" placeholder="e.g. 20240001" />
                    </Field>
                    <Field label="Date of Birth">
                      <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={onChange}
                        className="form-input" />
                    </Field>
                    <Field label="Admission Date">
                      <input type="date" name="admissionDate" value={form.admissionDate} onChange={onChange}
                        className="form-input" />
                    </Field>
                    <Field label="Phone Number" col="1 / -1">
                      <input name="phone" value={form.phone} onChange={onChange}
                        className="form-input" placeholder="+1 234 567 8900" />
                    </Field>
                  </div>
                </div>
              )}

              {/* ══ STEP 3: Contact & Guardian ═════════════════════════════ */}
              {step === 3 && (
                <div className="animate-fade">
                  <SectionHead emoji="📞" title="Contact & Guardian" subtitle="Provide home address and guardian contact information for emergency use." />
                  <div className="reg-grid">
                    <Field label="Home Address" col="1 / -1">
                      <input name="address" value={form.address} onChange={onChange}
                        className="form-input" placeholder="123 Education Lane, City..." autoFocus />
                    </Field>

                    <div style={{ gridColumn: "1 / -1", paddingTop: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                        <span style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>Guardian Information</span>
                        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                      </div>
                    </div>

                    <Field label="Guardian Name">
                      <input name="guardianName" value={form.guardianName} onChange={onChange}
                        className="form-input" placeholder="e.g. John Doe" />
                    </Field>
                    <Field label="Guardian Phone">
                      <input name="guardianPhone" value={form.guardianPhone} onChange={onChange}
                        className="form-input" placeholder="+1 234 567 8900" />
                    </Field>

                    <div style={{ gridColumn: "1 / -1", paddingTop: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                        <span style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>Emergency Contact</span>
                        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                      </div>
                    </div>

                    <Field label="Contact Name">
                      <input name="emergencyContactName" value={form.emergencyContactName} onChange={onChange}
                        className="form-input" placeholder="e.g. Jane Doe" />
                    </Field>
                    <Field label="Contact Phone">
                      <input name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={onChange}
                        className="form-input" placeholder="+1 234 567 8900" />
                    </Field>
                  </div>
                </div>
              )}

              {/* ══ STEP 4: Class Placement ════════════════════════════════ */}
              {step === 4 && (
                <div className="animate-fade">
                  <SectionHead emoji="🏫" title="Class Placement" subtitle="Assign the student to their appropriate academic year, class, and section." />
                  {loadingLookups ? (
                    <div style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Loading classes…</div>
                  ) : (
                    <div className="reg-grid">
                      <Field label="Academic Year" required col="1 / -1"
                        hint="The academic year this enrolment belongs to">
                        <select name="academicYearId" value={form.academicYearId} onChange={onChange} className="form-select">
                          <option value="">Select Year…</option>
                          {academicYears.map(y => (
                            <option key={y._id} value={y._id}>{y.name}{y.status === "active" ? " (Active)" : ""}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Class / Grade Level" required>
                        <select name="classLevelId" value={form.classLevelId}
                          onChange={e => { onChange(e); setForm(p => ({ ...p, sectionId: "" })); }}
                          className="form-select">
                          <option value="">Select Class…</option>
                          {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                      </Field>
                      <Field label="Section"
                        hint={filteredSections.length === 0 ? "No sections for this class" : "Pick the student's section"}>
                        <select name="sectionId" value={form.sectionId} onChange={onChange} className="form-select"
                          disabled={filteredSections.length === 0}>
                          <option value="">No Section</option>
                          {filteredSections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                      </Field>
                    </div>
                  )}

                  {/* Summary card */}
                  <div style={{
                    marginTop: 28, padding: "20px 24px",
                    background: "linear-gradient(135deg, var(--primary-bg), #f0f4ff)",
                    border: "1px solid var(--primary-light)", borderRadius: 14,
                  }}>
                    <p style={{ fontSize: ".78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--primary)", marginBottom: 14 }}>
                      📋 Registration Summary
                    </p>
                    <div className="reg-summary-grid">
                      {[
                        ["Name",         `${form.firstName || "—"} ${form.lastName || "—"}`],
                        ["Email",        form.email || "—"],
                        ["Gender",       form.gender || "—"],
                        ["EMIS No.",     form.emisNumber || "—"],
                        ["Date of Birth",form.dateOfBirth || "—"],
                        ["Admission",    form.admissionDate || "—"],
                        ["Guardian",     form.guardianName || "—"],
                        ["Academic Year",academicYears.find(y => y._id === form.academicYearId)?.name || "—"],
                        ["Class",        classes.find(c => c._id === form.classLevelId)?.name || "—"],
                        ["Section",      filteredSections.find(s => s._id === form.sectionId)?.name || "None"],
                      ].map(([k, v]) => (
                        <div key={k} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-muted)" }}>{k}</span>
                          <span style={{ fontSize: ".83rem", fontWeight: 600, color: "var(--text)" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Navigation buttons ── */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginTop: 36, paddingTop: 24, borderTop: "1px solid var(--border-light)",
                gap: 12, flexWrap: "wrap",
              }}>
                <button type="button" className="btn btn-secondary"
                  style={{ minWidth: 100, visibility: step === 1 ? "hidden" : "visible" }}
                  onClick={back}>
                  ← Back
                </button>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {step < 4 ? (
                    <button type="button" className="btn btn-primary" style={{ minWidth: 140 }} onClick={next}>
                      Continue →
                    </button>
                  ) : (
                    <button type="submit" className="btn btn-primary btn-lg" disabled={saving} style={{ minWidth: 200 }}>
                      {saving ? (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, animation: "spin 1s linear infinite" }}>
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                          </svg>
                          Registering…
                        </>
                      ) : "✅ Confirm Registration"}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>

      {/* ── Scoped styles ── */}
      <style>{`
        /* Page wrapper */
        .reg-page {
          min-height: 100%;
          display: flex;
          flex-direction: column;
        }

        /* Header bar */
        .reg-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 28px;
        }

        /* Two-column body */
        .reg-body {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 20px;
          align-items: start;
        }

        /* White card */
        .reg-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
        }

        /* Two-column field grid inside form */
        .reg-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px 20px;
        }

        /* Summary grid inside step 4 */
        .reg-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 16px 20px;
        }

        /* ── Tablet (sidebar collapses to top strip) ── */
        @media (max-width: 900px) {
          .reg-body {
            grid-template-columns: 1fr;
          }
          .reg-sidebar-panel {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }
        }

        /* ── Mobile ── */
        @media (max-width: 600px) {
          .reg-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .reg-sidebar-panel {
            grid-template-columns: 1fr;
          }
          .reg-card {
            padding: 24px 18px !important;
          }
          .reg-grid {
            grid-template-columns: 1fr;
          }
          .reg-summary-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 400px) {
          .reg-summary-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
