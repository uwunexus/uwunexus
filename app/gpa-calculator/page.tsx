"use client";

import { useState, useEffect, useCallback } from "react";
import { Calculator, BookOpen, TrendingUp, Save, ChevronDown, ChevronRight, AlertCircle, Award, Loader, Eye, GraduationCap, CheckCircle } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────── */
interface Module {
  module_id: number; module_code: string; module_name: string;
  credits: number; is_gpa: number; is_mandatory: number;
  grade: string | null; gpv: number | null;
}
interface Group {
  group_id: number; group_type: string; group_name: string;
  min_credits_required: number; modules: Module[];
}
interface Semester { [groupId: string]: Group; }
interface Year { [semester: string]: Semester; }
interface Curriculum { [year: string]: Year; }
interface GPASummary { current_gpa: number; total_gpa_credits: number; modules_completed: number; degree_class: string; }
interface UserInfo { degree_code: string; degree_name: string; enrollment_number: string; batch: string; raw_degree?: string; }
interface DegreeOption { degree_code: string; degree_name: string; }

/* ─── Constants ─────────────────────────────────────────────── */
const GRADES = ["", "A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "E"];
const GPV_MAP: Record<string, number> = {
  "A+": 4.00, "A": 4.00, "A-": 3.70, "B+": 3.30, "B": 3.00, "B-": 2.70,
  "C+": 2.30, "C": 2.00, "C-": 1.70, "D+": 1.30, "D": 1.00, "E": 0.00,
};
const GROUP_TYPE_COLORS: Record<string, string> = {
  CORE: "var(--primary)", ESD: "var(--accent)", BGE: "#ec4899",
  ELECTIVE: "var(--success)", OPTIONAL: "var(--warning)", BASKET: "#f97316",
};
const CLASS_COLORS: Record<string, { bg: string; color: string; border: string; shadow: string }> = {
  "First Class Honours":         { bg: "rgba(139,92,246,0.1)", color: "#c4b5fd", border: "rgba(139,92,246,0.3)", shadow: "0 4px 30px rgba(139,92,246,0.2)" },
  "Second Class Upper Division": { bg: "rgba(59,130,246,0.1)",  color: "#93c5fd", border: "rgba(59,130,246,0.3)", shadow: "0 4px 30px rgba(59,130,246,0.2)" },
  "Second Class Lower Division": { bg: "rgba(34,197,94,0.1)",   color: "#86efac", border: "rgba(34,197,94,0.3)", shadow: "0 4px 30px rgba(34,197,94,0.2)" },
  "General Pass":                { bg: "rgba(234,179,8,0.1)",   color: "#fde047", border: "rgba(234,179,8,0.3)", shadow: "0 4px 30px rgba(234,179,8,0.2)" },
  "Below Minimum":               { bg: "rgba(239,68,68,0.1)",   color: "#fca5a5", border: "rgba(239,68,68,0.3)", shadow: "0 4px 30px rgba(239,68,68,0.2)" },
  "Not Enough Data":             { bg: "rgba(148,163,184,0.05)",  color: "#cbd5e1", border: "rgba(148,163,184,0.2)", shadow: "none" },
};

function getGradeColor(grade: string | null): string {
  if (!grade) return "var(--muted)";
  const gpv = GPV_MAP[grade] ?? 0;
  if (gpv >= 3.70) return "var(--primary)";
  if (gpv >= 3.00) return "var(--accent)";
  if (gpv >= 2.00) return "var(--success)";
  if (gpv >= 1.00) return "var(--warning)";
  return "var(--danger)";
}

function computeGPA(curriculum: Curriculum, localGrades: Record<number, string>) {
  let totalW = 0, totalC = 0;
  for (const yr of Object.values(curriculum))
    for (const sem of Object.values(yr))
      for (const grp of Object.values(sem))
        for (const mod of grp.modules) {
          const g = localGrades[mod.module_id];
          if (g && Number(mod.is_gpa) === 1 && GPV_MAP[g] !== undefined) {
            totalW += Number(mod.credits) * GPV_MAP[g]; totalC += Number(mod.credits);
          }
        }
  return totalC > 0 ? Math.round((totalW / totalC) * 100) / 100 : 0;
}

function classFromGPA(gpa: number) {
  if (gpa >= 3.70) return "First Class Honours";
  if (gpa >= 3.30) return "Second Class Upper Division";
  if (gpa >= 3.00) return "Second Class Lower Division";
  if (gpa >= 2.00) return "General Pass";
  if (gpa > 0) return "Below Minimum";
  return "Not Enough Data";
}

/* ─── Main ────────────────────────────────────────────────────── */
export default function GPACalculatorPage() {
  const [myId, setMyId]     = useState("");
  const [myRole, setMyRole] = useState("");

  // Superadmin degree selection
  const [degrees, setDegrees]               = useState<DegreeOption[]>([]);
  const [selectedDegree, setSelectedDegree] = useState<string>("");
  const [previewMode, setPreviewMode]       = useState(false);

  // Specialization (MRT/SCT)
  const [needsSpecialization, setNeedsSpecialization] = useState(false);
  const [specOptions, setSpecOptions]                 = useState<{code:string;label:string}[]>([]);
  const [baseDegree, setBaseDegree]                   = useState<string>("");
  const [settingSpec, setSettingSpec]                 = useState(false);
  const [specError, setSpecError]                     = useState("");

  // Data
  const [userInfo, setUserInfo]       = useState<UserInfo | null>(null);
  const [gpaSummary, setGpaSummary]   = useState<GPASummary | null>(null);
  const [curriculum, setCurriculum]   = useState<Curriculum>({});
  const [localGrades, setLocalGrades] = useState<Record<number, string>>({});

  // UI
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [notEligible, setNotEligible] = useState(false);
  const [saveMsg, setSaveMsg]     = useState("");
  const [openYears, setOpenYears] = useState<Record<string, boolean>>({ "1": true });
  const [openSems, setOpenSems]   = useState<Record<string, boolean>>({ "1-1": true });
  const [curriculumLoaded, setCurriculumLoaded] = useState(false);

  // Read cookies
  useEffect(() => {
    const parse = (n: string) =>
      document.cookie.split("; ").find(r => r.startsWith(n + "="))?.split("=")[1] ?? "";
    const id   = parse("uwu_user_id");
    const role = parse("uwu_user_role");
    setMyId(id);
    setMyRole(role);

    // If superadmin: fetch degree list, don't auto-load curriculum
    if (role === "superadmin" && id) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/get_gpa.php?user_id=${id}&list_degrees=1`)
        .then(r => r.json())
        .then(d => { if (d.success) setDegrees(d.degrees); });
    }
  }, []);

  // Auto-load for non-superadmin
  useEffect(() => {
    if (myId && myRole && myRole !== "superadmin") loadCurriculum();
    // eslint-disable-next-line
  }, [myId, myRole]);

  const loadCurriculum = useCallback(async (degreeOverride?: string) => {
    if (!myId) return;
    setLoading(true); setError(""); setNotEligible(false); setCurriculumLoaded(false);
    try {
      const url = degreeOverride
        ? `${process.env.NEXT_PUBLIC_API_URL}/get_gpa.php?user_id=${myId}&degree_override=${degreeOverride}`
        : `${process.env.NEXT_PUBLIC_API_URL}/get_gpa.php?user_id=${myId}`;
      const r = await fetch(url);
      const d = await r.json();

      if (!d.success && d.not_eligible) { setNotEligible(true); return; }
      if (!d.success) throw new Error(d.message);

      setUserInfo(d.user);
      setGpaSummary(d.gpa_summary);
      setCurriculum(d.curriculum);
      setPreviewMode(d.preview_mode);
      setNeedsSpecialization(d.needs_specialization ?? false);
      setSpecOptions(d.spec_options ?? []);
      setBaseDegree(d.base_degree ?? "");
      setCurriculumLoaded(true);

      // Seed grades
      const seed: Record<number, string> = {};
      for (const yr of Object.values(d.curriculum as Curriculum))
        for (const sem of Object.values(yr))
          for (const grp of Object.values(sem))
            for (const mod of grp.modules)
              if (mod.grade) seed[mod.module_id] = mod.grade;
      setLocalGrades(seed);

      // Open first year/sem
      setOpenYears({ "1": true });
      setOpenSems({ "1-1": true });
    } catch (e: any) {
      setError(e.message || "Failed to load curriculum.");
    } finally {
      setLoading(false);
    }
  }, [myId]);

  const handleDegreeSelect = (code: string) => {
    setSelectedDegree(code);
    if (code) loadCurriculum(code);
    else { setCurriculum({}); setCurriculumLoaded(false); setUserInfo(null); }
  };

  const handleSelectSpec = async (specCode: string) => {
    setSettingSpec(true); setSpecError("");
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/set_specialization.php`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: +myId, specialization: specCode }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      // Reload full curriculum with specialization now set
      setNeedsSpecialization(false);
      await loadCurriculum();
    } catch (e: any) {
      setSpecError(e.message || "Failed to set specialization.");
    } finally {
      setSettingSpec(false);
    }
  };

  const liveGPA   = computeGPA(curriculum, localGrades);
  const liveClass = classFromGPA(liveGPA);

  const handleGradeChange = (moduleId: number, grade: string) => {
    setLocalGrades(prev => ({ ...prev, [moduleId]: grade }));
  };

  const handleSave = async () => {
    if (previewMode) return; // No saving in preview mode
    setSaving(true); setSaveMsg(""); setError("");
    const gradesToSave: any[] = [];
    for (const [yr, yearData] of Object.entries(curriculum))
      for (const [sem, semData] of Object.entries(yearData))
        for (const grp of Object.values(semData))
          for (const mod of grp.modules) {
            const g = localGrades[mod.module_id];
            if (g) gradesToSave.push({ module_id: mod.module_id, academic_year: +yr, semester: +sem, grade: g, gpv: GPV_MAP[g] });
          }
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/save_grades.php`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: +myId, grades: gradesToSave }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      setGpaSummary(d.gpa_summary);
      setSaveMsg("Grades saved successfully!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (e: any) { setError(e.message || "Failed to save."); }
    finally { setSaving(false); }
  };

  const toggleYear = (yr: string) => setOpenYears(p => ({ ...p, [yr]: !p[yr] }));
  const toggleSem  = (k: string)  => setOpenSems(p => ({ ...p, [k]: !p[k] }));

  const classStyle = CLASS_COLORS[liveClass] ?? CLASS_COLORS["Not Enough Data"];

  /* ── No user ID (session cookie missing) ── */
  if (!loading && myRole && myRole !== "superadmin" && !myId) return (
    <div className="container py-16 flex justify-center relative z-10">
      <div className="card text-center" style={{ maxWidth: "460px", borderTop: "3px solid var(--warning)", background: "rgba(15,23,42,0.6)", backdropFilter: "blur(12px)" }}>
        <AlertCircle size={48} style={{ margin: "0 auto 1rem", color: "var(--warning)" }} />
        <h2 className="text-2xl font-bold mb-3">Session Expired</h2>
        <p className="text-muted mb-4">Your session is missing some details. Please log out and log back in to continue.</p>
        <a href="/login" className="btn btn-primary" style={{ display: "inline-flex", justifyContent: "center" }}>Login Again</a>
      </div>
    </div>
  );

  /* ── Superadmin degree selector ── */
  if (myRole === "superadmin" && !curriculumLoaded) {
    return (
      <div className="container py-12 relative z-10">
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500 inline-flex items-center gap-3">
            <Calculator size={40} className="text-purple-500" />
            Smart GPA Calculator
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">Superadmin Preview Mode — select a degree programme to inspect its curriculum.</p>
        </div>

        <div className="card" style={{ maxWidth: "600px", margin: "0 auto", padding: "2.5rem", borderTop: "3px solid var(--primary)", background: "rgba(15,23,42,0.6)", backdropFilter: "blur(16px)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
          <div className="flex items-center gap-4 mb-8">
            <div style={{ padding: "1rem", borderRadius: "1rem", backgroundColor: "rgba(139,92,246,0.15)", boxShadow: "inset 0 0 10px rgba(139,92,246,0.1)" }}>
              <Eye size={32} style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Select Degree Programme</h2>
              <p className="text-muted text-sm mt-1">Preview any degree curriculum as Superadmin</p>
            </div>
          </div>

          {degrees.length === 0 ? (
            <div className="text-center text-muted py-12">
              <Loader size={40} style={{ margin: "0 auto 1rem", animation: "spin 1s linear infinite", color: "var(--primary)" }} />
              <p className="text-lg">Loading degrees...</p>
              <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {degrees.map(d => (
                <button
                  key={d.degree_code}
                  onClick={() => handleDegreeSelect(d.degree_code)}
                  className="card text-left flex items-center gap-4 hover-scale"
                  style={{ cursor: "pointer", padding: "1.25rem", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)"; (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.05)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}>
                  <div style={{ padding: "0.75rem", borderRadius: "0.75rem", backgroundColor: "rgba(139,92,246,0.15)", flexShrink: 0 }}>
                    <GraduationCap size={24} style={{ color: "var(--primary)" }} />
                  </div>
                  <div>
                    <div className="font-bold text-lg" style={{ color: "var(--primary)" }}>{d.degree_code}</div>
                    <div className="text-sm text-muted mt-1">{d.degree_name}</div>
                  </div>
                  <ChevronRight size={20} className="text-muted" style={{ marginLeft: "auto" }} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Loading ── */
  if (loading) return (
    <div className="container py-20 text-center relative z-10">
      <Loader size={48} style={{ margin: "0 auto 1rem", color: "var(--danger)", animation: "spin 1s linear infinite" }} />
      <p className="text-xl text-muted font-medium mt-4">Analyzing Curriculum Data...</p>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── Not eligible ── */
  if (notEligible) return (
    <div className="container py-16 flex justify-center relative z-10">
      <div className="card text-center shadow-2xl" style={{ maxWidth: "550px", borderTop: "3px solid var(--warning)", background: "rgba(15,23,42,0.6)", backdropFilter: "blur(16px)" }}>
        <AlertCircle size={56} style={{ margin: "0 auto 1.5rem", color: "var(--warning)" }} />
        <h2 className="text-3xl font-extrabold mb-4">Feature Not Available</h2>
        <p className="text-muted mb-6 text-lg">The Smart GPA Calculator is currently available only for <strong>Faculty of Applied Sciences</strong> students:</p>
        <div className="flex justify-center gap-3 flex-wrap mb-6">
          {["IIT", "CST", "MRT", "SCT"].map(d => (
            <span key={d} className="badge" style={{ fontSize: "1rem", padding: "0.5rem 1rem", backgroundColor: "rgba(139,92,246,0.1)", color: "var(--primary)", border: "1px solid rgba(139,92,246,0.3)" }}>{d}</span>
          ))}
        </div>
        <p className="text-muted text-sm p-3 rounded" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>Support for other faculties will be added in a future update.</p>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error && !curriculumLoaded) return (
    <div className="container py-12 relative z-10">
      <div className="p-4 rounded-lg flex items-center gap-3" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
        <AlertCircle size={20} />
        <span className="font-medium">{error}</span>
      </div>
    </div>
  );

  /* ── Main UI ── */
  return (
    <div className="container py-10 relative z-10">
      {/* Background Blur Elements */}
      <div style={{ position: "fixed", top: "-10%", left: "-5%", width: "40vw", height: "40vw", background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(0,0,0,0) 70%)", zIndex: -1, pointerEvents: "none", filter: "blur(40px)" }} />
      <div style={{ position: "fixed", bottom: "-10%", right: "-5%", width: "50vw", height: "50vw", background: "radial-gradient(circle, rgba(236,72,153,0.1) 0%, rgba(0,0,0,0) 70%)", zIndex: -1, pointerEvents: "none", filter: "blur(60px)" }} />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-5xl font-extrabold mb-3 flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500" style={{ letterSpacing: "-0.02em" }}>
            <Calculator size={42} className="text-red-500" />
            Smart GPA Calculator
          </h1>
          {userInfo && (
            <p className="text-lg font-medium text-foreground">{userInfo.degree_name}</p>
          )}
          {userInfo && !previewMode && (
            <p className="text-muted mt-1 flex items-center gap-2">
              <span className="badge" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>{userInfo.enrollment_number}</span>
              <span className="badge" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>Batch {userInfo.batch}</span>
            </p>
          )}
          {/* MRT/SCT: show current specialization + change button */}
          {userInfo && !previewMode && !needsSpecialization && userInfo.raw_degree && ["MRT","SCT"].includes(userInfo.raw_degree) && (
            <div className="flex items-center gap-3 mt-4">
              <span className="badge font-bold" style={{ backgroundColor: "rgba(234,179,8,0.15)", color: "var(--warning)", border: "1px solid rgba(234,179,8,0.3)", padding: "0.4rem 0.8rem" }}>
                Specialization: {userInfo.degree_code}
              </span>
              <button
                className="btn text-xs hover-scale"
                style={{ padding: "0.4rem 1rem", backgroundColor: "rgba(234,179,8,0.1)", color: "var(--warning)", border: "1px solid rgba(234,179,8,0.3)", transition: "all 0.2s" }}
                onClick={() => setNeedsSpecialization(true)}>
                ✎ Change Specialization
              </button>
            </div>
          )}
        </div>
        
        {/* Superadmin: back button to pick another degree */}
        {myRole === "superadmin" && previewMode && (
          <div className="flex flex-col items-end gap-3 bg-black/40 p-4 rounded-xl border border-white/5 backdrop-blur-md">
            <div className="badge font-bold text-sm" style={{ backgroundColor: "rgba(139,92,246,0.2)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.4)", padding: "0.5rem 1rem" }}>
              <Eye size={16} style={{ display: "inline", marginRight: "0.5rem", verticalAlign: "text-bottom" }} />
              Preview Mode — {userInfo?.degree_code}
            </div>
            <button className="btn btn-secondary text-sm hover-scale" onClick={() => { setCurriculumLoaded(false); setSelectedDegree(""); setCurriculum({}); }}>
              ← Switch Degree
            </button>
          </div>
        )}
      </div>

      {/* GPA Summary */}
      {userInfo && (
        <div className="grid gap-6 mb-12" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          
          {/* Live GPA Card */}
          <div className="card text-center relative overflow-hidden" style={{ borderTop: "none", background: "rgba(15,23,42,0.6)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #ef4444, #f97316)" }} />
            <div className="text-muted text-sm font-semibold uppercase tracking-wider mb-2 mt-2">Live GPA</div>
            <div className="text-7xl font-black mb-2" style={{ background: "linear-gradient(180deg, #f87171, #ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {liveGPA.toFixed(2)}
            </div>
            <div className="text-xs text-muted bg-white/5 inline-block px-3 py-1 rounded-full">{previewMode ? "Preview (not saved)" : "Calculated from entries below"}</div>
          </div>

          {/* Saved GPA Card */}
          {!previewMode && (
            <div className="card text-center relative overflow-hidden" style={{ borderTop: "none", background: "rgba(15,23,42,0.6)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #22c55e, #10b981)" }} />
              <div className="text-muted text-sm font-semibold uppercase tracking-wider mb-2 mt-2">Saved GPA</div>
              <div className="text-7xl font-black mb-2" style={{ background: "linear-gradient(180deg, #86efac, #22c55e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {(gpaSummary?.current_gpa ?? 0).toFixed(2)}
              </div>
              <div className="text-xs text-muted bg-white/5 inline-block px-3 py-1 rounded-full">{gpaSummary?.modules_completed ?? 0} modules · {gpaSummary?.total_gpa_credits ?? 0} credits</div>
            </div>
          )}

          {/* Projected Class Card */}
          <div className="card text-center flex flex-col justify-center items-center relative overflow-hidden" style={{ borderTop: "none", gridColumn: previewMode ? "span 2" : "span 1", background: "rgba(15,23,42,0.6)", backdropFilter: "blur(16px)", border: `1px solid ${classStyle.border}`, boxShadow: classStyle.shadow }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: classStyle.color }} />
            <div className="text-muted text-sm font-semibold uppercase tracking-wider mb-4 flex items-center justify-center gap-2 mt-2">
              <Award size={18} style={{ color: classStyle.color }} /> Projected Degree Class
            </div>
            <div className="text-3xl font-black px-4 leading-tight" style={{ color: classStyle.color, textShadow: `0 0 20px ${classStyle.bg}` }}>{liveClass}</div>
            <div className="text-xs text-muted mt-4 bg-white/5 inline-block px-3 py-1 rounded-full">Based on Live GPA</div>
          </div>

        </div>
      )}

      {/* Errors / Messages */}
      {error && (
        <div className="mb-6 p-4 rounded-lg flex items-center gap-3 backdrop-blur-md" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)" }}>
          <AlertCircle size={20} className="flex-shrink-0" /> <span className="font-medium">{error}</span>
        </div>
      )}
      {saveMsg && (
        <div className="mb-6 p-4 rounded-lg flex items-center gap-3 backdrop-blur-md" style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#86efac", border: "1px solid rgba(34,197,94,0.3)" }}>
          <CheckCircle size={20} className="flex-shrink-0" /> <span className="font-medium">{saveMsg}</span>
        </div>
      )}

      {/* Preview mode banner */}
      {previewMode && (
        <div className="mb-8 p-4 rounded-xl flex items-center gap-3 backdrop-blur-md shadow-lg" style={{ backgroundColor: "rgba(139,92,246,0.15)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.3)" }}>
          <Eye size={20} className="flex-shrink-0" />
          <div>
            <strong className="block mb-1">Superadmin Preview Mode Active</strong>
            <span className="text-sm opacity-90">Grade entries are for inspection only. Saving is disabled in preview mode.</span>
          </div>
        </div>
      )}

      {/* Save button (students only) Top */}
      {!previewMode && (
        <div className="flex justify-end mb-6 sticky top-4 z-50">
          <button className="btn btn-primary hover-scale shadow-2xl" onClick={handleSave} disabled={saving} style={{ backgroundColor: "var(--danger)", padding: "0.85rem 2rem", opacity: saving ? 0.7 : 1, borderRadius: "2rem", border: "1px solid rgba(255,255,255,0.2)" }}>
            <Save size={20} /> {saving ? "Saving..." : "Save All Grades"}
          </button>
        </div>
      )}

      {/* Specialization selector (MRT / SCT students) */}
      {needsSpecialization && specOptions.length > 0 && (
        <div className="card mb-10 overflow-hidden shadow-2xl" style={{ borderTop: "none", background: "rgba(15,23,42,0.7)", backdropFilter: "blur(16px)", border: "1px solid rgba(234,179,8,0.3)" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "var(--warning)" }} />
          <div className="p-8">
            <h3 className="text-2xl font-black mb-3 flex items-center gap-3" style={{ color: "var(--warning)" }}>
              <Award size={28} /> Choose Your Specialization
            </h3>
            <p className="text-muted mb-6 text-lg">
              <strong>{baseDegree}</strong> students select a specialization at Level 300 (Year 3). Years 1 &amp; 2 are shown below.
              Once you select your specialization, the full 4-year curriculum will load permanently.
            </p>
            {specError && <div className="mb-4 p-3 rounded-lg flex items-center gap-2" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}><AlertCircle size={16}/>{specError}</div>}
            
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
              {specOptions.map(opt => (
                <button
                  key={opt.code}
                  disabled={settingSpec}
                  onClick={() => handleSelectSpec(opt.code)}
                  className="card text-left flex items-center gap-4 hover-scale"
                  style={{ cursor: "pointer", padding: "1.5rem", border: "1px solid rgba(234,179,8,0.2)", background: "rgba(255,255,255,0.03)", opacity: settingSpec ? 0.7 : 1, transition: "all 0.3s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--warning)"; (e.currentTarget as HTMLElement).style.background = "rgba(234,179,8,0.05)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(234,179,8,0.2)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}>
                  <div style={{ padding: "0.85rem", borderRadius: "1rem", backgroundColor: "rgba(234,179,8,0.15)", flexShrink: 0, boxShadow: "inset 0 0 10px rgba(234,179,8,0.1)" }}>
                    <GraduationCap size={28} style={{ color: "var(--warning)" }} />
                  </div>
                  <div>
                    <div className="font-bold text-lg mb-1" style={{ color: "var(--warning)" }}>{baseDegree}-{opt.code}</div>
                    <div className="text-sm text-muted">{opt.label}</div>
                  </div>
                  <ChevronRight size={20} className="text-muted" style={{ marginLeft: "auto" }} />
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 text-sm text-muted text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(0,0,0,0.2)" }}>
            You can change your specialization anytime using the "Change Specialization" button in the header.
          </div>
        </div>
      )}

      {/* Curriculum Accordion */}
      <div className="flex flex-col gap-6">
        {Object.entries(curriculum).sort(([a], [b]) => +a - +b).map(([yr, yearData]) => (
          <div key={yr} className="card p-0 overflow-hidden shadow-xl" style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "1rem" }}>
            <button onClick={() => toggleYear(yr)} className="w-full flex justify-between items-center p-6 transition-colors"
              style={{ background: openYears[yr] ? "rgba(255,255,255,0.05)" : "transparent", borderBottom: openYears[yr] ? "1px solid rgba(255,255,255,0.05)" : "none", cursor: "pointer" }}>
              <span className="text-2xl font-black flex items-center gap-4 text-foreground tracking-tight">
                <div style={{ padding: "0.5rem", background: "rgba(139,92,246,0.15)", borderRadius: "0.5rem", color: "var(--primary)" }}>
                  <BookOpen size={24} />
                </div>
                Level {yr}00 <span className="opacity-40 px-2 font-normal">|</span> Year {yr}
              </span>
              <div style={{ padding: "0.5rem", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }}>
                {openYears[yr] ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
              </div>
            </button>

            {openYears[yr] && (
              <div className="p-6 flex flex-col gap-6 bg-black/20">
                {Object.entries(yearData).sort(([a], [b]) => +a - +b).map(([sem, semData]) => {
                  const semKey = `${yr}-${sem}`;
                  return (
                    <div key={sem} style={{ border: "1px solid rgba(255,255,255,0.05)", borderRadius: "1rem", overflow: "hidden", background: "rgba(15,23,42,0.4)" }}>
                      <button onClick={() => toggleSem(semKey)} className="w-full flex justify-between items-center p-5 transition-colors hover:bg-white/5"
                        style={{ background: openSems[semKey] ? "rgba(255,255,255,0.03)" : "transparent", cursor: "pointer", borderBottom: openSems[semKey] ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                        <span className="text-lg font-bold text-foreground">Semester {sem}</span>
                        {openSems[semKey] ? <ChevronDown size={20} className="text-muted" /> : <ChevronRight size={20} className="text-muted" />}
                      </button>

                      {openSems[semKey] && (
                        <div className="p-5 flex flex-col gap-6">
                          {Object.values(semData).map(grp => {
                            const grpColor = GROUP_TYPE_COLORS[grp.group_type] ?? "var(--primary)";
                            return (
                              <div key={grp.group_id} className="bg-white/5 p-5 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3 mb-5">
                                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: grpColor, flexShrink: 0, boxShadow: `0 0 10px ${grpColor}` }} />
                                  <span className="font-bold tracking-wide uppercase text-sm" style={{ color: grpColor, letterSpacing: "0.05em" }}>{grp.group_name}</span>
                                  {grp.min_credits_required > 0 && (
                                    <span className="text-xs text-muted font-medium bg-black/40 px-3 py-1 rounded-full border border-white/5">
                                      {grp.min_credits_required} credits required
                                    </span>
                                  )}
                                </div>
                                <div style={{ overflowX: "auto" }}>
                                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 0.5rem" }}>
                                    <thead>
                                      <tr>
                                        {["Module Code", "Module Name", "Credits", "Type", "Grade"].map(h => (
                                          <th key={h} className="pb-3 px-4 text-left text-xs font-bold text-muted uppercase tracking-wider" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", whiteSpace: "nowrap" }}>{h}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {grp.modules.map(mod => {
                                        const sel = localGrades[mod.module_id] ?? "";
                                        const gradeColor = getGradeColor(sel || null);
                                        return (
                                          <tr key={mod.module_id} style={{ transition: "all 0.2s" }}
                                            className="group"
                                            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.01)")}
                                            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
                                            <td className="p-4 font-mono text-sm font-semibold text-foreground bg-black/20 rounded-l-lg border-y border-l border-white/5 group-hover:bg-white/5" style={{ whiteSpace: "nowrap" }}>{mod.module_code}</td>
                                            <td className="p-4 text-sm text-foreground bg-black/20 border-y border-white/5 group-hover:bg-white/5">
                                              <span className="font-medium">{mod.module_name}</span>
                                              {!mod.is_mandatory && <span className="ml-3 text-xs bg-black/40 text-muted px-2 py-1 rounded border border-white/5">Pool</span>}
                                            </td>
                                            <td className="p-4 text-sm font-semibold text-center text-foreground bg-black/20 border-y border-white/5 group-hover:bg-white/5">{mod.credits}</td>
                                            <td className="p-4 text-center bg-black/20 border-y border-white/5 group-hover:bg-white/5">
                                              {mod.is_gpa ? (
                                                <span className="badge font-bold" style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#86efac", fontSize: "0.7rem", border: "1px solid rgba(34,197,94,0.2)" }}>GPA</span>
                                              ) : (
                                                <span className="badge font-bold" style={{ backgroundColor: "rgba(148,163,184,0.1)", color: "#cbd5e1", fontSize: "0.7rem", border: "1px solid rgba(148,163,184,0.2)" }}>Non-GPA</span>
                                              )}
                                            </td>
                                            <td className="p-4 bg-black/20 rounded-r-lg border-y border-r border-white/5 group-hover:bg-white/5 text-right">
                                              <div className="relative inline-block">
                                                <select className="form-input text-base font-bold cursor-pointer appearance-none outline-none"
                                                  style={{ 
                                                    padding: "0.5rem 2rem 0.5rem 1rem", 
                                                    width: "100px", 
                                                    color: sel ? gradeColor : "var(--muted)", 
                                                    backgroundColor: sel ? `${gradeColor}1A` : "rgba(0,0,0,0.3)",
                                                    border: `1px solid ${sel ? gradeColor + "4D" : "rgba(255,255,255,0.1)"}`,
                                                    opacity: previewMode ? 0.8 : 1,
                                                    borderRadius: "0.5rem",
                                                    boxShadow: sel ? `0 0 15px ${gradeColor}33` : "none"
                                                  }}
                                                  value={sel}
                                                  onChange={e => handleGradeChange(mod.module_id, e.target.value)}>
                                                  {GRADES.map(g => <option key={g} value={g} className="bg-slate-900 text-white">{g || "—"}</option>)}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" style={{ color: sel ? gradeColor : "var(--muted)" }} />
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom save + grade reference */}
      {!previewMode && (
        <div className="flex justify-end mt-8 gap-4 items-center">
          {saveMsg && <span className="text-sm font-medium" style={{ color: "#86efac" }}>{saveMsg}</span>}
          <button className="btn btn-primary hover-scale shadow-xl" onClick={handleSave} disabled={saving} style={{ backgroundColor: "var(--danger)", padding: "0.85rem 2.5rem", opacity: saving ? 0.7 : 1, borderRadius: "2rem", border: "1px solid rgba(255,255,255,0.2)" }}>
            <Save size={20} /> {saving ? "Saving..." : "Save All Grades"}
          </button>
        </div>
      )}

      {/* Grade Reference Guide */}
      <div className="card mt-16 p-8 shadow-2xl relative overflow-hidden" style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "1.5rem" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", background: "var(--primary)" }} />
        <div className="text-xl font-black mb-6 flex items-center gap-3 tracking-tight">
          <TrendingUp size={24} style={{ color: "var(--primary)" }} /> Grade Reference <span className="font-normal text-muted opacity-60">| UWU Scale</span>
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))" }}>
          {[["A+/A","4.00","90–100"],["A-","3.70","70–79"],["B+","3.30","60–69"],["B","3.00","55–59"],["B-","2.70","50–54"],["C+","2.30","45–49"],["C","2.00","40–44"],["C-","1.70","35–39"],["D+","1.30","30–34"],["D","1.00","25–29"],["E","0.00","0–24"]].map(([g, gpv, range]) => {
            const color = getGradeColor(g.split("/")[0]);
            return (
              <div key={g} className="text-center p-3 rounded-xl transition-transform hover:-translate-y-1" style={{ backgroundColor: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", boxShadow: `inset 0 0 0 1px ${color}1A` }}>
                <div className="font-black text-xl mb-1" style={{ color: color, textShadow: `0 0 10px ${color}4D` }}>{g}</div>
                <div className="text-sm font-semibold text-foreground">{gpv}</div>
                <div className="text-xs text-muted font-medium mt-1">{range}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
