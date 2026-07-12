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
  CORE: "#000c66", ESD: "#0088cc", BGE: "#ec4899",
  ELECTIVE: "#0e9f6e", OPTIONAL: "#b25e00", BASKET: "#f97316",
};
const CLASS_META: Record<string, { color: string; bg: string; border: string }> = {
  "First Class Honours":         { color: "#6d28d9", bg: "rgba(139,92,246,0.08)", border: "#ddd6fe" },
  "Second Class Upper Division": { color: "#0369a1", bg: "rgba(14,165,233,0.08)", border: "#bae6fd" },
  "Second Class Lower Division": { color: "#0e9f6e", bg: "rgba(14,159,110,0.08)", border: "#a7f3d0" },
  "General Pass":                { color: "#b25e00", bg: "rgba(178,94,0,0.08)",   border: "#fde68a" },
  "Below Minimum":               { color: "#dc2626", bg: "rgba(239,68,68,0.08)",  border: "#fecaca" },
  "Not Enough Data":             { color: "#64748b", bg: "rgba(100,116,139,0.06)", border: "#e2e8f0" },
};

function getGradeColor(grade: string | null): string {
  if (!grade) return "#94a3b8";
  const gpv = GPV_MAP[grade] ?? 0;
  if (gpv >= 3.70) return "#000c66";
  if (gpv >= 3.00) return "#0088cc";
  if (gpv >= 2.00) return "#0e9f6e";
  if (gpv >= 1.00) return "#b25e00";
  return "#dc2626";
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
  if (gpa > 0)    return "Below Minimum";
  return "Not Enough Data";
}

/* ─── Shared card style ──────────────────────────────────────── */
const card: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "1.5rem",
  boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
  border: "1px solid #e2e8f0",
};

/* ─── Main ────────────────────────────────────────────────────── */
export default function GPACalculatorPage() {
  const [myId, setMyId]     = useState("");
  const [myRole, setMyRole] = useState("");

  const [degrees, setDegrees]               = useState<DegreeOption[]>([]);
  const [selectedDegree, setSelectedDegree] = useState<string>("");
  const [previewMode, setPreviewMode]       = useState(false);

  const [needsSpecialization, setNeedsSpecialization] = useState(false);
  const [specOptions, setSpecOptions]                 = useState<{code:string;label:string}[]>([]);
  const [baseDegree, setBaseDegree]                   = useState<string>("");
  const [settingSpec, setSettingSpec]                 = useState(false);
  const [specError, setSpecError]                     = useState("");

  const [userInfo, setUserInfo]       = useState<UserInfo | null>(null);
  const [gpaSummary, setGpaSummary]   = useState<GPASummary | null>(null);
  const [curriculum, setCurriculum]   = useState<Curriculum>({});
  const [localGrades, setLocalGrades] = useState<Record<number, string>>({});

  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [notEligible, setNotEligible] = useState(false);
  const [saveMsg, setSaveMsg]     = useState("");
  const [openYears, setOpenYears] = useState<Record<string, boolean>>({ "1": true });
  const [openSems, setOpenSems]   = useState<Record<string, boolean>>({ "1-1": true });
  const [curriculumLoaded, setCurriculumLoaded] = useState(false);

  useEffect(() => {
    const parse = (n: string) =>
      document.cookie.split("; ").find(r => r.startsWith(n + "="))?.split("=")[1] ?? "";
    const id   = parse("uwu_user_id");
    const role = parse("uwu_role");
    setMyId(id); setMyRole(role);
    if (role === "superadmin" && id) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/get_gpa.php?user_id=${id}&list_degrees=1`)
        .then(r => r.json())
        .then(d => { if (d.success) setDegrees(d.degrees); });
    }
  }, []);

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
      setUserInfo(d.user); setGpaSummary(d.gpa_summary); setCurriculum(d.curriculum);
      setPreviewMode(d.preview_mode); setNeedsSpecialization(d.needs_specialization ?? false);
      setSpecOptions(d.spec_options ?? []); setBaseDegree(d.base_degree ?? "");
      setCurriculumLoaded(true);
      const seed: Record<number, string> = {};
      for (const yr of Object.values(d.curriculum as Curriculum))
        for (const sem of Object.values(yr))
          for (const grp of Object.values(sem))
            for (const mod of grp.modules)
              if (mod.grade) seed[mod.module_id] = mod.grade;
      setLocalGrades(seed);
      setOpenYears({ "1": true }); setOpenSems({ "1-1": true });
    } catch (e: any) { setError(e.message || "Failed to load curriculum."); }
    finally { setLoading(false); }
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
      setNeedsSpecialization(false);
      await loadCurriculum();
    } catch (e: any) { setSpecError(e.message || "Failed to set specialization."); }
    finally { setSettingSpec(false); }
  };

  const liveGPA   = computeGPA(curriculum, localGrades);
  const liveClass = classFromGPA(liveGPA);
  const classMeta = CLASS_META[liveClass] ?? CLASS_META["Not Enough Data"];

  const handleGradeChange = (moduleId: number, grade: string) =>
    setLocalGrades(prev => ({ ...prev, [moduleId]: grade }));

  const handleSave = async () => {
    if (previewMode) return;
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

  /* ── Session missing ── */
  if (!loading && myRole && myRole !== "superadmin" && !myId) return (
    <div className="container py-16 flex justify-center">
      <div style={{ ...card, maxWidth: "460px", padding: "2.5rem", textAlign: "center", borderTop: "4px solid #b25e00" }}>
        <AlertCircle size={48} style={{ margin: "0 auto 1rem", color: "#b25e00" }} />
        <h2 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "1.5rem", marginBottom: "0.75rem" }}>Session Expired</h2>
        <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>Please log out and log back in to continue.</p>
        <a href="/login" className="btn btn-primary" style={{ display: "inline-flex", justifyContent: "center", backgroundColor: "#000c66" }}>Login Again</a>
      </div>
    </div>
  );

  /* ── Superadmin degree selector ── */
  if (myRole === "superadmin" && !curriculumLoaded) return (
    <div className="container py-12" style={{ maxWidth: "700px" }}>
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "2.5rem", color: "#000000", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Calculator size={36} style={{ color: "#000c66" }} /> Smart GPA Calculator
        </h1>
        <p style={{ color: "#64748b", fontSize: "1rem" }}>Superadmin Preview — select a degree programme to inspect its curriculum.</p>
      </div>

      <div style={{ ...card, padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ padding: "0.75rem", borderRadius: "1rem", backgroundColor: "rgba(0,12,102,0.08)" }}>
            <Eye size={28} style={{ color: "#000c66" }} />
          </div>
          <div>
            <h2 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "1.25rem", color: "#000000" }}>Select Degree Programme</h2>
            <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Preview any degree curriculum</p>
          </div>
        </div>

        {degrees.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "#64748b" }}>
            <Loader size={36} style={{ margin: "0 auto 1rem", animation: "spin 1s linear infinite", color: "#000c66" }} />
            <p>Loading degrees...</p>
            <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {degrees.map(d => (
              <button key={d.degree_code} onClick={() => handleDegreeSelect(d.degree_code)}
                style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", borderRadius: "1rem", border: "1.5px solid #e2e8f0", backgroundColor: "#ffffff", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#000c66"; (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0,12,102,0.03)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.backgroundColor = "#ffffff"; }}
              >
                <div style={{ padding: "0.6rem", borderRadius: "0.75rem", backgroundColor: "rgba(0,12,102,0.08)", flexShrink: 0 }}>
                  <GraduationCap size={22} style={{ color: "#000c66" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, color: "#000c66", fontSize: "1rem" }}>{d.degree_code}</div>
                  <div style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.15rem" }}>{d.degree_name}</div>
                </div>
                <ChevronRight size={18} style={{ color: "#94a3b8" }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  /* ── Loading ── */
  if (loading) return (
    <div className="container py-20 text-center">
      <Loader size={44} style={{ margin: "0 auto 1rem", color: "#000c66", animation: "spin 1s linear infinite" }} />
      <p style={{ color: "#64748b", fontSize: "1.1rem", fontFamily: "var(--font-syne)" }}>Analyzing Curriculum Data...</p>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── Not eligible ── */
  if (notEligible) return (
    <div className="container py-16 flex justify-center">
      <div style={{ ...card, maxWidth: "560px", padding: "2.5rem", textAlign: "center", borderTop: "4px solid #b25e00" }}>
        <AlertCircle size={52} style={{ margin: "0 auto 1.25rem", color: "#b25e00" }} />
        <h2 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "1.75rem", marginBottom: "1rem" }}>Feature Not Available</h2>
        <p style={{ color: "#64748b", marginBottom: "1.25rem", fontSize: "1rem" }}>
          The Smart GPA Calculator is currently available only for <strong>Faculty of Applied Sciences</strong> students:
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          {["IIT", "CST", "MRT", "SCT"].map(d => (
            <span key={d} style={{ backgroundColor: "rgba(0,12,102,0.08)", color: "#000c66", border: "1px solid rgba(0,12,102,0.2)", borderRadius: "9999px", padding: "0.4rem 1rem", fontWeight: 700, fontFamily: "var(--font-syne)" }}>{d}</span>
          ))}
        </div>
        <p style={{ color: "#94a3b8", fontSize: "0.875rem", backgroundColor: "#f8fafc", padding: "0.75rem 1rem", borderRadius: "0.75rem" }}>
          Support for other faculties will be added in a future update.
        </p>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error && !curriculumLoaded) return (
    <div className="container py-12">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", backgroundColor: "rgba(239,68,68,0.06)", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "1rem" }}>
        <AlertCircle size={20} /><span style={{ fontWeight: 600 }}>{error}</span>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════
       MAIN UI
     ══════════════════════════════════════════════════ */
  return (
    <div className="container py-10" style={{ maxWidth: "1100px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem", marginBottom: "2.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "2.5rem", color: "#000000", display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <Calculator size={36} style={{ color: "#000c66" }} /> Smart GPA Calculator
          </h1>
          {userInfo && <p style={{ fontFamily: "var(--font-syne)", fontSize: "1.05rem", color: "#000000", fontWeight: 600 }}>{userInfo.degree_name}</p>}
          {userInfo && !previewMode && (
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ backgroundColor: "#f1f5f9", color: "#475569", borderRadius: "9999px", padding: "0.2rem 0.8rem", fontSize: "0.82rem", fontWeight: 600 }}>{userInfo.enrollment_number}</span>
              <span style={{ backgroundColor: "#f1f5f9", color: "#475569", borderRadius: "9999px", padding: "0.2rem 0.8rem", fontSize: "0.82rem", fontWeight: 600 }}>Batch {userInfo.batch}</span>
            </div>
          )}
          {userInfo && !previewMode && !needsSpecialization && userInfo.raw_degree && ["MRT","SCT"].includes(userInfo.raw_degree) && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.75rem" }}>
              <span style={{ backgroundColor: "rgba(178,94,0,0.1)", color: "#b25e00", border: "1px solid rgba(178,94,0,0.25)", borderRadius: "9999px", padding: "0.3rem 0.9rem", fontSize: "0.82rem", fontWeight: 700 }}>
                Specialization: {userInfo.degree_code}
              </span>
              <button onClick={() => setNeedsSpecialization(true)} style={{ backgroundColor: "transparent", color: "#b25e00", border: "1px solid rgba(178,94,0,0.3)", borderRadius: "9999px", padding: "0.3rem 0.9rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                ✎ Change
              </button>
            </div>
          )}
        </div>

        {/* Superadmin preview badge + switch */}
        {myRole === "superadmin" && previewMode && (
          <div style={{ ...card, padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "flex-end" }}>
            <span style={{ backgroundColor: "rgba(0,12,102,0.08)", color: "#000c66", border: "1px solid rgba(0,12,102,0.2)", borderRadius: "9999px", padding: "0.3rem 0.9rem", fontSize: "0.82rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Eye size={14} /> Preview — {userInfo?.degree_code}
            </span>
            <button onClick={() => { setCurriculumLoaded(false); setSelectedDegree(""); setCurriculum({}); }}
              style={{ backgroundColor: "#f1f5f9", color: "#000c66", border: "1.5px solid #e2e8f0", borderRadius: "9999px", padding: "0.4rem 1rem", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>
              ← Switch Degree
            </button>
          </div>
        )}
      </div>

      {/* ── GPA Summary Cards ── */}
      {userInfo && (
        <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginBottom: "2.5rem" }}>

          {/* Live GPA */}
          <div style={{ ...card, padding: "1.75rem", borderTop: "4px solid #000c66", textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>Live GPA</div>
            <div style={{ fontSize: "4rem", fontWeight: 900, color: "#000c66", lineHeight: 1, marginBottom: "0.5rem", fontFamily: "var(--font-syne)" }}>{liveGPA.toFixed(2)}</div>
            <div style={{ fontSize: "0.78rem", color: "#94a3b8", backgroundColor: "#f8fafc", borderRadius: "9999px", padding: "0.2rem 0.8rem", display: "inline-block" }}>
              {previewMode ? "Preview (not saved)" : "Calculated from entries below"}
            </div>
          </div>

          {/* Saved GPA */}
          {!previewMode && (
            <div style={{ ...card, padding: "1.75rem", borderTop: "4px solid #0e9f6e", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>Saved GPA</div>
              <div style={{ fontSize: "4rem", fontWeight: 900, color: "#0e9f6e", lineHeight: 1, marginBottom: "0.5rem", fontFamily: "var(--font-syne)" }}>{(gpaSummary?.current_gpa ?? 0).toFixed(2)}</div>
              <div style={{ fontSize: "0.78rem", color: "#94a3b8", backgroundColor: "#f8fafc", borderRadius: "9999px", padding: "0.2rem 0.8rem", display: "inline-block" }}>
                {gpaSummary?.modules_completed ?? 0} modules · {gpaSummary?.total_gpa_credits ?? 0} credits
              </div>
            </div>
          )}

          {/* Projected Class */}
          <div style={{ ...card, padding: "1.75rem", borderTop: `4px solid ${classMeta.color}`, textAlign: "center", backgroundColor: classMeta.bg, gridColumn: previewMode ? "span 2" : "span 1" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
              <Award size={14} /> Projected Degree Class
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: classMeta.color, lineHeight: 1.2, marginBottom: "0.5rem", fontFamily: "var(--font-syne)" }}>{liveClass}</div>
            <div style={{ fontSize: "0.78rem", color: "#94a3b8", backgroundColor: "#ffffff", borderRadius: "9999px", padding: "0.2rem 0.8rem", display: "inline-block", border: `1px solid ${classMeta.border}` }}>
              Based on Live GPA
            </div>
          </div>
        </div>
      )}

      {/* ── Alerts ── */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", backgroundColor: "rgba(239,68,68,0.06)", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "1rem", marginBottom: "1.5rem" }}>
          <AlertCircle size={18} /><span style={{ fontWeight: 600 }}>{error}</span>
        </div>
      )}
      {saveMsg && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", backgroundColor: "rgba(14,159,110,0.06)", color: "#0e9f6e", border: "1px solid #a7f3d0", borderRadius: "1rem", marginBottom: "1.5rem" }}>
          <CheckCircle size={18} /><span style={{ fontWeight: 600 }}>{saveMsg}</span>
        </div>
      )}

      {/* Preview banner */}
      {previewMode && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", backgroundColor: "rgba(0,12,102,0.06)", color: "#000c66", border: "1px solid rgba(0,12,102,0.2)", borderRadius: "1rem", marginBottom: "1.5rem" }}>
          <Eye size={18} />
          <div>
            <strong style={{ display: "block" }}>Superadmin Preview Mode Active</strong>
            <span style={{ fontSize: "0.875rem", opacity: 0.8 }}>Grade entries are for inspection only. Saving is disabled.</span>
          </div>
        </div>
      )}

      {/* Save button (sticky) */}
      {!previewMode && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.5rem", position: "sticky", top: "1rem", zIndex: 50 }}>
          <button onClick={handleSave} disabled={saving}
            style={{ backgroundColor: "#000c66", color: "#ffffff", border: "none", borderRadius: "9999px", padding: "0.75rem 2rem", fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", opacity: saving ? 0.7 : 1, boxShadow: "0 4px 16px rgba(0,12,102,0.25)", transition: "opacity 0.2s" }}>
            <Save size={18} /> {saving ? "Saving..." : "Save All Grades"}
          </button>
        </div>
      )}

      {/* ── Specialization Picker ── */}
      {needsSpecialization && specOptions.length > 0 && (
        <div style={{ ...card, marginBottom: "2rem", borderTop: "4px solid #b25e00", overflow: "hidden" }}>
          <div style={{ padding: "2rem" }}>
            <h3 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "1.4rem", color: "#b25e00", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Award size={24} /> Choose Your Specialization
            </h3>
            <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
              <strong>{baseDegree}</strong> students select a specialization at Level 300 (Year 3). Years 1 &amp; 2 are shown below.
              Once you select your specialization, the full 4-year curriculum will load permanently.
            </p>
            {specError && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", backgroundColor: "rgba(239,68,68,0.06)", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "0.75rem", marginBottom: "1rem" }}>
                <AlertCircle size={16} />{specError}
              </div>
            )}
            <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
              {specOptions.map(opt => (
                <button key={opt.code} disabled={settingSpec} onClick={() => handleSelectSpec(opt.code)}
                  style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem", border: "1.5px solid rgba(178,94,0,0.25)", borderRadius: "1.25rem", backgroundColor: "#ffffff", cursor: "pointer", textAlign: "left", opacity: settingSpec ? 0.7 : 1, transition: "all 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#b25e00"; (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(178,94,0,0.04)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(178,94,0,0.25)"; (e.currentTarget as HTMLElement).style.backgroundColor = "#ffffff"; }}>
                  <div style={{ padding: "0.7rem", borderRadius: "0.75rem", backgroundColor: "rgba(178,94,0,0.1)", flexShrink: 0 }}>
                    <GraduationCap size={24} style={{ color: "#b25e00" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, color: "#b25e00", fontSize: "1rem" }}>{baseDegree}-{opt.code}</div>
                    <div style={{ color: "#64748b", fontSize: "0.875rem" }}>{opt.label}</div>
                  </div>
                  <ChevronRight size={18} style={{ color: "#94a3b8" }} />
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: "0.875rem 2rem", borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "0.825rem", color: "#94a3b8", textAlign: "center" }}>
            You can change your specialization anytime using the "Change" button in the header.
          </div>
        </div>
      )}

      {/* ── Curriculum Accordion ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {Object.entries(curriculum).sort(([a], [b]) => +a - +b).map(([yr, yearData]) => (
          <div key={yr} style={{ ...card, overflow: "hidden" }}>
            {/* Year header */}
            <button onClick={() => toggleYear(yr)}
              style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.75rem", backgroundColor: openYears[yr] ? "#f8fafc" : "#ffffff", borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: openYears[yr] ? "1px solid #e2e8f0" : "none", cursor: "pointer" }}>
              <span style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "1.25rem", color: "#000000", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ padding: "0.5rem", backgroundColor: "rgba(0,12,102,0.08)", borderRadius: "0.6rem" }}>
                  <BookOpen size={20} style={{ color: "#000c66" }} />
                </div>
                Level {yr}00 <span style={{ color: "#94a3b8", fontWeight: 400, margin: "0 0.25rem" }}>|</span> Year {yr}
              </span>
              <div style={{ padding: "0.4rem", borderRadius: "50%", backgroundColor: "#f1f5f9" }}>
                {openYears[yr] ? <ChevronDown size={20} style={{ color: "#64748b" }} /> : <ChevronRight size={20} style={{ color: "#64748b" }} />}
              </div>
            </button>

            {openYears[yr] && (
              <div style={{ padding: "1.25rem 1.75rem", display: "flex", flexDirection: "column", gap: "1rem", backgroundColor: "#fafbfc" }}>
                {Object.entries(yearData).sort(([a], [b]) => +a - +b).map(([sem, semData]) => {
                  const semKey = `${yr}-${sem}`;
                  return (
                    <div key={sem} style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "1rem", overflow: "hidden" }}>
                      <button onClick={() => toggleSem(semKey)}
                        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", backgroundColor: openSems[semKey] ? "#f8fafc" : "#ffffff", borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: openSems[semKey] ? "1px solid #e2e8f0" : "none", cursor: "pointer" }}>
                        <span style={{ fontFamily: "var(--font-syne)", fontWeight: 700, color: "#000000", fontSize: "1rem" }}>Semester {sem}</span>
                        {openSems[semKey] ? <ChevronDown size={18} style={{ color: "#94a3b8" }} /> : <ChevronRight size={18} style={{ color: "#94a3b8" }} />}
                      </button>

                      {openSems[semKey] && (
                        <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                          {Object.values(semData).map(grp => {
                            const grpColor = GROUP_TYPE_COLORS[grp.group_type] ?? "#000c66";
                            return (
                              <div key={grp.group_id} style={{ border: "1px solid #e2e8f0", borderLeft: `4px solid ${grpColor}`, borderRadius: "0.75rem", overflow: "hidden", backgroundColor: "#fafbfc" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.75rem 1rem", borderBottom: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
                                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: grpColor, flexShrink: 0 }} />
                                  <span style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "0.82rem", color: grpColor, textTransform: "uppercase", letterSpacing: "0.06em" }}>{grp.group_name}</span>
                                  {grp.min_credits_required > 0 && (
                                    <span style={{ marginLeft: "auto", backgroundColor: "#f1f5f9", color: "#64748b", borderRadius: "9999px", padding: "0.15rem 0.6rem", fontSize: "0.75rem", fontWeight: 600 }}>
                                      {grp.min_credits_required} credits required
                                    </span>
                                  )}
                                </div>
                                <div style={{ overflowX: "auto" }}>
                                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                      <tr style={{ backgroundColor: "#f8fafc" }}>
                                        {["Module Code", "Module Name", "Credits", "Type", "Grade"].map(h => (
                                          <th key={h} style={{ padding: "0.6rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>{h}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {grp.modules.map((mod, idx) => {
                                        const sel = localGrades[mod.module_id] ?? "";
                                        const gradeColor = getGradeColor(sel || null);
                                        return (
                                          <tr key={mod.module_id} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fafbfc", borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 700, color: "#000c66", whiteSpace: "nowrap" }}>{mod.module_code}</td>
                                            <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#1e293b" }}>
                                              <span style={{ fontWeight: 600 }}>{mod.module_name}</span>
                                              {!mod.is_mandatory && <span style={{ marginLeft: "0.5rem", backgroundColor: "#f1f5f9", color: "#94a3b8", borderRadius: "9999px", padding: "0.1rem 0.5rem", fontSize: "0.7rem", fontWeight: 600 }}>Pool</span>}
                                            </td>
                                            <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: 700, textAlign: "center", color: "#475569" }}>{mod.credits}</td>
                                            <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                                              {mod.is_gpa ? (
                                                <span style={{ backgroundColor: "rgba(14,159,110,0.1)", color: "#0e9f6e", border: "1px solid rgba(14,159,110,0.2)", borderRadius: "9999px", padding: "0.15rem 0.6rem", fontSize: "0.7rem", fontWeight: 700 }}>GPA</span>
                                              ) : (
                                                <span style={{ backgroundColor: "#f1f5f9", color: "#94a3b8", border: "1px solid #e2e8f0", borderRadius: "9999px", padding: "0.15rem 0.6rem", fontSize: "0.7rem", fontWeight: 700 }}>Non-GPA</span>
                                              )}
                                            </td>
                                            <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                                              <div style={{ position: "relative", display: "inline-block" }}>
                                                <select
                                                  style={{ appearance: "none", padding: "0.4rem 2rem 0.4rem 0.75rem", width: "90px", borderRadius: "0.6rem", border: `1.5px solid ${sel ? gradeColor + "66" : "#e2e8f0"}`, backgroundColor: sel ? `${gradeColor}12` : "#f8fafc", color: sel ? gradeColor : "#94a3b8", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", outline: "none", opacity: previewMode ? 0.75 : 1 }}
                                                  value={sel}
                                                  onChange={e => handleGradeChange(mod.module_id, e.target.value)}>
                                                  {GRADES.map(g => <option key={g} value={g}>{g || "—"}</option>)}
                                                </select>
                                                <ChevronDown size={13} style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: sel ? gradeColor : "#94a3b8" }} />
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

      {/* ── Bottom Save ── */}
      {!previewMode && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem", gap: "1rem", alignItems: "center" }}>
          {saveMsg && <span style={{ fontWeight: 600, color: "#0e9f6e", fontSize: "0.9rem" }}>{saveMsg}</span>}
          <button onClick={handleSave} disabled={saving}
            style={{ backgroundColor: "#000c66", color: "#ffffff", border: "none", borderRadius: "9999px", padding: "0.75rem 2.5rem", fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", opacity: saving ? 0.7 : 1, boxShadow: "0 4px 16px rgba(0,12,102,0.25)" }}>
            <Save size={18} /> {saving ? "Saving..." : "Save All Grades"}
          </button>
        </div>
      )}

      {/* ── Grade Reference ── */}
      <div style={{ ...card, marginTop: "3rem", padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid #e2e8f0" }}>
          <TrendingUp size={22} style={{ color: "#000c66" }} />
          <span style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "1.1rem", color: "#000000" }}>Grade Reference</span>
          <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>| UWU Scale</span>
        </div>
        <div style={{ display: "grid", gap: "0.6rem", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))" }}>
          {[["A+/A","4.00","90–100"],["A-","3.70","70–79"],["B+","3.30","60–69"],["B","3.00","55–59"],["B-","2.70","50–54"],["C+","2.30","45–49"],["C","2.00","40–44"],["C-","1.70","35–39"],["D+","1.30","30–34"],["D","1.00","25–29"],["E","0.00","0–24"]].map(([g, gpv, range]) => {
            const color = getGradeColor(g.split("/")[0]);
            return (
              <div key={g} style={{ textAlign: "center", padding: "0.875rem 0.5rem", borderRadius: "0.875rem", backgroundColor: "#f8fafc", border: `1.5px solid ${color}22`, transition: "transform 0.15s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "none"}>
                <div style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: "1.2rem", color, marginBottom: "0.2rem" }}>{g}</div>
                <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#1e293b" }}>{gpv}</div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "0.1rem" }}>{range}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
