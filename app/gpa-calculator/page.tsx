"use client";

import { useState, useEffect, useCallback } from "react";
import { Calculator, BookOpen, Save, ChevronDown, ChevronRight, AlertCircle, Award, Loader, Eye, GraduationCap, CheckCircle } from "lucide-react";

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
  if (gpa >= 3.70) return "First Class";
  if (gpa >= 3.30) return "Second Class Upper";
  if (gpa >= 3.00) return "Second Class Lower";
  if (gpa >= 2.00) return "General Pass";
  if (gpa > 0) return "Academic Probation";
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
  const [openSems, setOpenSems]   = useState<Record<string, boolean>>({ "1-1": true, "1-2": false, "2-1": true, "2-2": false, "3-1": true, "3-2": false, "4-1": true, "4-2": false });
  const [curriculumLoaded, setCurriculumLoaded] = useState(false);

  // Selected Level Tab (Option B: Level 100 - 400 Tabs)
  const [activeLevel, setActiveLevel] = useState<string>("1");

  // Read cookies
  useEffect(() => {
    const parse = (n: string) =>
      document.cookie.split("; ").find(r => r.startsWith(n + "="))?.split("=")[1] ?? "";
    const id   = parse("uwu_user_id");
    const role = parse("uwu_role");
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
      setNeedsSpecialization(false);
      await loadCurriculum();
    } catch (e: any) {
      setSpecError(e.message || "Failed to set specialization.");
    } finally {
      setSettingSpec(false);
    }
  };

  const liveGPA = computeGPA(curriculum, localGrades);
  const liveClass = classFromGPA(liveGPA);

  const handleGradeChange = (moduleId: number, grade: string) => {
    setLocalGrades(prev => ({ ...prev, [moduleId]: grade }));
  };

  const handleSave = async () => {
    if (previewMode) return;
    setSaving(true); setSaveMsg(""); setError("");
    const gradesToSave: any[] = [];
    for (const [yr, yearData] of Object.entries(curriculum))
      for (const [sem, semData] of Object.entries(yearData))
        for (const grp of Object.values(semData))
          for (const mod of grp.modules) {
            const g = localGrades[mod.module_id];
            if (g !== undefined) gradesToSave.push({ module_id: mod.module_id, academic_year: +yr, semester: +sem, grade: g, gpv: GPV_MAP[g] || 0 });
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

  const toggleSem = (k: string) => setOpenSems(p => ({ ...p, [k]: !p[k] }));

  /* ── No user ID (session cookie missing) ── */
  if (!loading && myRole && myRole !== "superadmin" && !myId) return (
    <div className="container py-16 flex justify-center">
      <div className="card text-center" style={{ maxWidth: "460px", borderTop: "3px solid var(--warning)", backgroundColor: "#ffffff" }}>
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
      <div className="container" style={{ maxWidth: '1210px', marginTop: '1.5rem', paddingBottom: '4rem' }}>
        <div className="mb-10 text-center">
          <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "3rem", fontWeight: 700, color: "#000000" }}>
            Smart GPA Calculator
          </h1>
          <p style={{ fontFamily: "var(--font-inclusive-sans), sans-serif", fontSize: "1.15rem", color: "#64748b", fontWeight: 500, marginTop: "0.5rem" }}>
            Superadmin Preview Mode — select a degree programme to inspect its curriculum.
          </p>
        </div>

        <div className="card" style={{ maxWidth: "600px", margin: "0 auto", padding: "2.5rem", borderRadius: "2.2rem", border: "1px solid rgba(0, 0, 0, 0.1)", background: "#ffffff", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center gap-4 mb-8">
            <div style={{ padding: "1rem", borderRadius: "1rem", backgroundColor: "rgba(0, 12, 102, 0.05)" }}>
              <Eye size={32} style={{ color: "#000c66" }} />
            </div>
            <div>
              <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "1.5rem", fontWeight: 700 }}>Select Degree Programme</h2>
              <p className="text-muted text-sm mt-1">Preview any degree curriculum as Superadmin</p>
            </div>
          </div>

          {degrees.length === 0 ? (
            <div className="text-center text-muted py-12">
              <Loader size={40} style={{ margin: "0 auto 1rem", animation: "spin 1s linear infinite", color: "#000c66" }} />
              <p style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700 }}>Loading degrees...</p>
              <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {degrees.map(d => (
                <button
                  key={d.degree_code}
                  onClick={() => handleDegreeSelect(d.degree_code)}
                  className="card text-left flex items-center gap-4 hover-scale"
                  style={{ cursor: "pointer", padding: "1.25rem", border: "1px solid rgba(0, 0, 0, 0.1)", background: "#ffffff", borderRadius: "1rem", transition: "all 0.2s" }}>
                  <div style={{ padding: "0.75rem", borderRadius: "0.75rem", backgroundColor: "rgba(0, 12, 102, 0.05)", flexShrink: 0 }}>
                    <GraduationCap size={24} style={{ color: "#000c66" }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#000c66" }}>{d.degree_code}</div>
                    <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>{d.degree_name}</div>
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

  /* ── Not eligible ── */
  if (notEligible) return (
    <div className="container py-16 flex justify-center">
      <div className="card text-center shadow-2xl" style={{ maxWidth: "550px", borderTop: "3px solid var(--warning)", background: "#ffffff", borderRadius: "2.2rem" }}>
        <AlertCircle size={56} style={{ margin: "0 auto 1.5rem", color: "var(--warning)" }} />
        <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "1.8rem", fontWeight: 800, marginBottom: "1rem" }}>Feature Not Available</h2>
        <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>The Smart GPA Calculator is currently available only for <strong>Faculty of Applied Sciences</strong> students:</p>
        <div className="flex justify-center gap-3 flex-wrap mb-6">
          {["IIT", "CST", "MRT", "SCT"].map(d => (
            <span key={d} className="badge" style={{ fontSize: "1rem", padding: "0.5rem 1.25rem", backgroundColor: "rgba(0, 12, 102, 0.05)", color: "#000c66", border: "1px solid rgba(0, 12, 102, 0.15)", borderRadius: "9999px", fontFamily: "var(--font-syne), sans-serif", fontWeight: 700 }}>{d}</span>
          ))}
        </div>
        <p style={{ fontSize: "0.85rem", color: "#64748b", padding: "0.75rem", borderRadius: "0.75rem", backgroundColor: "#f1f3f5" }}>Support for other faculties will be added in a future update.</p>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error && !curriculumLoaded) return (
    <div className="container py-12">
      <div className="p-4 rounded-lg flex items-center gap-3" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
        <AlertCircle size={20} />
        <span className="font-medium">{error}</span>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ maxWidth: '1210px', marginTop: '1.5rem', paddingBottom: '4rem' }}>
      {/* Skeleton Animation Style Injection */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .skeleton-pulse {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* Title Section */}
      <div className="flex justify-between items-start mb-8 flex-wrap gap-4" style={{ marginTop: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "3rem", fontWeight: 700, color: "#000000", letterSpacing: "0.02em", marginBottom: "0.25rem" }}>
            Smart GPA Calculator
          </h1>
          <p style={{ fontFamily: "var(--font-inclusive-sans), sans-serif", fontSize: "1.15rem", color: "#64748b", fontWeight: 500, marginBottom: "1rem" }}>
            {userInfo ? userInfo.degree_name : "Loading Degree Programme..."}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <span style={{ 
              border: "1.5px solid #000c66", 
              borderRadius: "9999px", 
              padding: "0.4rem 1.25rem", 
              color: "#000c66", 
              fontSize: "0.9rem", 
              fontWeight: 700, 
              fontFamily: "var(--font-syne), sans-serif" 
            }}>
              {userInfo ? userInfo.enrollment_number : "UWU/IIT/.../.../"}
            </span>
            <span style={{ 
              border: "1.5px solid #000c66", 
              borderRadius: "9999px", 
              padding: "0.4rem 1.25rem", 
              color: "#000c66", 
              fontSize: "0.9rem", 
              fontWeight: 700, 
              fontFamily: "var(--font-syne), sans-serif" 
            }}>
              {userInfo ? `Batch ${userInfo.batch}` : "Batch ..."}
            </span>
          </div>

          {/* MRT/SCT: Specialization Toggles */}
          {userInfo && !previewMode && !needsSpecialization && userInfo.raw_degree && ["MRT", "SCT"].includes(userInfo.raw_degree) && (
            <div className="flex items-center gap-3 mt-4">
              <span style={{ backgroundColor: "rgba(0, 12, 102, 0.05)", border: "1px solid rgba(0,12,102,0.15)", borderRadius: "9999px", padding: "0.4rem 1rem", fontSize: "0.85rem", fontWeight: 700, color: "#000c66", fontFamily: "var(--font-syne), sans-serif" }}>
                Specialization: {userInfo.degree_code}
              </span>
              <button
                style={{ padding: "0.4rem 1rem", backgroundColor: "#000c66", color: "#ffffff", border: "none", borderRadius: "9999px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, fontFamily: "var(--font-syne), sans-serif" }}
                onClick={() => setNeedsSpecialization(true)}>
                Change Specialization
              </button>
            </div>
          )}
        </div>

        {/* Superadmin Mode Selector */}
        {myRole === "superadmin" && previewMode && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.75rem", backgroundColor: "#f8fafc", padding: "1rem 1.5rem", borderRadius: "1.5rem", border: "1px solid rgba(0,0,0,0.1)" }}>
            <span style={{ backgroundColor: "rgba(0, 12, 102, 0.05)", color: "#000c66", border: "1px solid rgba(0, 12, 102, 0.15)", borderRadius: "9999px", padding: "0.3rem 0.9rem", fontSize: "0.8rem", fontWeight: 700, fontFamily: "var(--font-syne), sans-serif" }}>
              Previewing: {userInfo?.degree_code}
            </span>
            <button 
              onClick={() => { setCurriculumLoaded(false); setSelectedDegree(""); setCurriculum({}); }}
              style={{ padding: "0.4rem 1rem", backgroundColor: "#334155", color: "#ffffff", border: "none", borderRadius: "9999px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, fontFamily: "var(--font-syne), sans-serif" }}
            >
              Switch Degree
            </button>
          </div>
        )}
      </div>

      {/* GPA Summary Boxes Block */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
        {/* Simulated GPA */}
        <div style={{ backgroundColor: "#e6e9ec", borderRadius: "1.8rem", padding: "1.5rem 1.25rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ backgroundColor: "#000c66", color: "#ffffff", borderRadius: "9999px", padding: "0.5rem 2.2rem", fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "1.15rem", textAlign: "center", width: "fit-content" }}>
            Simulated GPA
          </div>
          <div style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "2.5rem", color: "#000000", marginTop: "1rem" }}>
            {liveGPA.toFixed(2)}
          </div>
        </div>

        {/* Official GPA */}
        <div style={{ backgroundColor: "#e6e9ec", borderRadius: "1.8rem", padding: "1.5rem 1.25rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ backgroundColor: "#000c66", color: "#ffffff", borderRadius: "9999px", padding: "0.5rem 2.2rem", fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "1.15rem", textAlign: "center", width: "fit-content" }}>
            Official GPA
          </div>
          <div style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "2.5rem", color: "#000000", marginTop: "1rem" }}>
            {previewMode ? liveGPA.toFixed(2) : (gpaSummary?.current_gpa ?? 0) === 0 ? liveGPA.toFixed(2) : (gpaSummary?.current_gpa ?? 0).toFixed(2)}
          </div>
        </div>

        {/* Projected Honors */}
        <div style={{ backgroundColor: "#e6e9ec", borderRadius: "1.8rem", padding: "1.5rem 1.25rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ backgroundColor: "#000c66", color: "#ffffff", borderRadius: "9999px", padding: "0.5rem 2.2rem", fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "1.15rem", textAlign: "center", width: "fit-content" }}>
            Projected Honors
          </div>
          <div style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "1.65rem", color: "#000000", marginTop: "1.2rem", textAlign: "center", lineHeight: "1.2" }}>
            {liveClass}
          </div>
        </div>
      </div>

      {/* Action Status Prompts */}
      {error && (
        <div style={{ marginBottom: "1.5rem", padding: "1rem", borderRadius: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)", fontFamily: "var(--font-syne), sans-serif", fontWeight: 700 }}>
          <AlertCircle size={20} /> <span>{error}</span>
        </div>
      )}
      {saveMsg && (
        <div style={{ marginBottom: "1.5rem", padding: "1rem", borderRadius: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "rgba(34,197,94,0.1)", color: "var(--success)", border: "1px solid rgba(34,197,94,0.2)", fontFamily: "var(--font-syne), sans-serif", fontWeight: 700 }}>
          <CheckCircle size={20} /> <span>{saveMsg}</span>
        </div>
      )}

      {/* Specialization Selection Row (MRT / SCT students) */}
      {needsSpecialization && specOptions.length > 0 && (
        <div className="card mb-10 overflow-hidden" style={{ borderRadius: "2.2rem", border: "1px solid rgba(0,0,0,0.1)", background: "#ffffff", padding: "2.5rem", boxShadow: "0 10px 25px rgba(0,0,0,0.03)" }}>
          <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "1.6rem", fontWeight: 800, color: "#000000", marginBottom: "0.5rem" }}>
            Choose Your Specialization
          </h3>
          <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
            <strong>{baseDegree}</strong> students select a specialization at Level 300 (Year 3). Once you select your specialization, the full 4-year curriculum will load permanently.
          </p>
          {specError && <div style={{ color: "var(--danger)", marginBottom: "1rem", fontWeight: 700 }}>{specError}</div>}
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {specOptions.map(opt => (
              <button
                key={opt.code}
                disabled={settingSpec}
                onClick={() => handleSelectSpec(opt.code)}
                style={{ cursor: "pointer", padding: "1.25rem", border: "1px solid rgba(0, 0, 0, 0.1)", background: "#ffffff", borderRadius: "1rem", textAlign: "left", transition: "all 0.2s" }}
              >
                <div style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#000c66" }}>{baseDegree}-{opt.code}</div>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>{opt.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Level Tabs Accordion Bar & Save Grades Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        {/* Level Tabs Pill Container */}
        <div style={{ display: "inline-flex", backgroundColor: "#e6effd", padding: "0.3rem", borderRadius: "9999px", border: "1px solid rgba(0, 12, 102, 0.05)" }}>
          {["1", "2", "3", "4"].map(lvl => {
            const isActive = activeLevel === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setActiveLevel(lvl)}
                style={{
                  backgroundColor: isActive ? "#000c66" : "transparent",
                  color: isActive ? "#ffffff" : "#000c66",
                  border: "none",
                  borderRadius: "9999px",
                  padding: "0.6rem 2rem",
                  fontFamily: "var(--font-syne), sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                Level {lvl}00
              </button>
            );
          })}
        </div>

        {/* Save Grades Button */}
        {!previewMode && (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              backgroundColor: "#334155",
              color: "#ffffff",
              border: "none",
              borderRadius: "9999px",
              padding: "0.75rem 2rem",
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "opacity 0.2s",
              opacity: saving ? 0.7 : 1
            }}
          >
            <Save size={18} />
            <span>Save All Grades</span>
          </button>
        )}
      </div>

      {/* Curriculum View (Filtered by selected level/year) */}
      {loading || !curriculumLoaded || !curriculum[activeLevel] ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Skeleton placeholders representing Semester I and Semester II loading */}
          <div className="skeleton-pulse" style={{ width: "100%", backgroundColor: "#cbd5e1", height: "48px", borderRadius: "9999px" }} />
          <div className="skeleton-pulse" style={{ width: "100%", backgroundColor: "#e2e8f0", height: "180px", borderRadius: "1.8rem", marginTop: "-0.75rem" }} />
          
          <div className="skeleton-pulse" style={{ width: "100%", backgroundColor: "#cbd5e1", height: "48px", borderRadius: "9999px", marginTop: "1rem" }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {Object.entries(curriculum[activeLevel]).sort(([a], [b]) => +a - +b).map(([sem, semData]) => {
            const semKey = `${activeLevel}-${sem}`;
            const isSemOpen = openSems[semKey];

            return (
              <div key={sem} style={{ display: "flex", flexDirection: "column" }}>
                {/* Semester Accordion Toggle Bar */}
                <button
                  onClick={() => toggleSem(semKey)}
                  style={{
                    width: "100%",
                    backgroundColor: "#000c66",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "9999px",
                    padding: "0.85rem 1.8rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontFamily: "var(--font-syne), sans-serif",
                    fontWeight: 700,
                    fontSize: "1.1rem"
                  }}
                >
                  <span>Semester {sem === "1" ? "I" : "II"}</span>
                  {isSemOpen ? <ChevronDown size={22} /> : <ChevronRight size={22} />}
                </button>

                {/* Semester Content Container */}
                {isSemOpen && (
                  <div style={{ 
                    backgroundColor: "#f0f7ff", 
                    borderRadius: "1.8rem", 
                    padding: "1.5rem 2rem", 
                    marginTop: "0.75rem", 
                    border: "1px solid rgba(0, 12, 102, 0.08)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2rem"
                  }}>
                    {Object.values(semData).map(grp => (
                      <div key={grp.group_id} style={{ display: "flex", flexDirection: "column" }}>
                        {/* Group Header */}
                        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "1rem" }}>
                          <h4 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "1.15rem", fontWeight: 700, color: "#000000", margin: 0 }}>
                            {grp.group_name} Course Units
                          </h4>
                          {Number(grp.min_credits_required) > 0 && (
                            <span style={{ fontFamily: "var(--font-inclusive-sans), sans-serif", fontSize: "0.95rem", color: "#64748b", fontWeight: 500 }}>
                              ({Number(grp.min_credits_required).toFixed(1)} credits required)
                            </span>
                          )}
                        </div>

                        {/* Subject Table Card Wrapper */}
                        <div style={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "1.2rem",
                          padding: "0.75rem 1.25rem",
                          overflowX: "auto",
                          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)"
                        }}>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                              <tr style={{ borderBottom: "1px solid #cbd5e1" }}>
                                <th style={{ padding: "0.75rem 0.5rem", textAlign: "left", fontFamily: "var(--font-syne), sans-serif", fontSize: "0.95rem", fontWeight: 700, color: "#000c66" }}>Module Code</th>
                                <th style={{ padding: "0.75rem 0.5rem", textAlign: "left", fontFamily: "var(--font-syne), sans-serif", fontSize: "0.95rem", fontWeight: 700, color: "#000c66" }}>Module Name</th>
                                <th style={{ padding: "0.75rem 0.5rem", textAlign: "center", fontFamily: "var(--font-syne), sans-serif", fontSize: "0.95rem", fontWeight: 700, color: "#000c66" }}>Credits</th>
                                <th style={{ padding: "0.75rem 0.5rem", textAlign: "center", fontFamily: "var(--font-syne), sans-serif", fontSize: "0.95rem", fontWeight: 700, color: "#000c66" }}>Type</th>
                                <th style={{ padding: "0.75rem 0.5rem", textAlign: "right", fontFamily: "var(--font-syne), sans-serif", fontSize: "0.95rem", fontWeight: 700, color: "#000c66" }}>Grade</th>
                              </tr>
                            </thead>
                            <tbody>
                              {grp.modules.map(mod => {
                                const sel = localGrades[mod.module_id] ?? "";
                                return (
                                  <tr key={mod.module_id} style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.05)" }}>
                                    {/* Code */}
                                    <td style={{ padding: "0.85rem 0.5rem", fontFamily: "var(--font-syne), sans-serif", fontSize: "0.95rem", fontWeight: 700, color: "#000c66" }}>
                                      {mod.module_code}
                                    </td>
                                    {/* Name */}
                                    <td style={{ padding: "0.85rem 0.5rem", fontFamily: "var(--font-syne), sans-serif", fontSize: "0.95rem", fontWeight: 500, color: "#000c66" }}>
                                      <span style={{ textDecoration: "underline" }}>{mod.module_name}</span>
                                      {!mod.is_mandatory && (
                                        <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "0.5rem", fontWeight: 500 }}>(non-GPA)</span>
                                      )}
                                    </td>
                                    {/* Credits */}
                                    <td style={{ padding: "0.85rem 0.5rem", textAlign: "center", fontFamily: "var(--font-syne), sans-serif", fontSize: "0.95rem", fontWeight: 500, color: "#000c66" }}>
                                      {Number(mod.credits).toFixed(1)}
                                    </td>
                                    {/* Type */}
                                    <td style={{ padding: "0.85rem 0.5rem", textAlign: "center", fontFamily: "var(--font-syne), sans-serif", fontSize: "0.9rem", fontWeight: 700, color: "#000c66" }}>
                                      {mod.is_gpa ? "GPA" : "Non-GPA"}
                                    </td>
                                    {/* Grade Dropdown Selector */}
                                    <td style={{ padding: "0.85rem 0.5rem", textAlign: "right" }}>
                                      <div style={{ position: "relative", display: "inline-block" }}>
                                        <select
                                          value={sel}
                                          onChange={e => handleGradeChange(mod.module_id, e.target.value)}
                                          disabled={false}
                                          style={{
                                            padding: "0.35rem 1.8rem 0.35rem 0.8rem",
                                            fontFamily: "var(--font-syne), sans-serif",
                                            fontWeight: 700,
                                            fontSize: "0.9rem",
                                            color: sel ? "#ffffff" : "#000c66",
                                            backgroundColor: sel ? "var(--primary)" : "rgba(0, 12, 102, 0.05)",
                                            border: sel ? "1px solid var(--primary)" : "1px solid rgba(0, 12, 102, 0.15)",
                                            borderRadius: "9999px",
                                            outline: "none",
                                            cursor: "pointer",
                                            appearance: "none",
                                            textAlign: "center",
                                            minWidth: "75px"
                                          }}
                                        >
                                          {GRADES.map(g => (
                                            <option key={g} value={g} style={{ backgroundColor: "#ffffff", color: "#000000", fontWeight: 600 }}>
                                              {g || "—"}
                                            </option>
                                          ))}
                                        </select>
                                        <ChevronDown size={14} style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: sel ? "#ffffff" : "#000c66" }} />
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
