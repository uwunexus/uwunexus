"use client";

import { useState, useEffect, useCallback } from "react";
import { Calculator, BookOpen, TrendingUp, Save, ChevronDown, ChevronRight, AlertCircle, Award, Loader, Eye, GraduationCap } from "lucide-react";

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
const CLASS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  "First Class Honours":         { bg: "rgba(139,92,246,0.15)", color: "#8b5cf6", border: "#8b5cf6" },
  "Second Class Upper Division": { bg: "rgba(59,130,246,0.15)",  color: "#3b82f6", border: "#3b82f6" },
  "Second Class Lower Division": { bg: "rgba(34,197,94,0.15)",   color: "#22c55e", border: "#22c55e" },
  "General Pass":                { bg: "rgba(234,179,8,0.15)",   color: "#eab308", border: "#eab308" },
  "Below Minimum":               { bg: "rgba(239,68,68,0.15)",   color: "#ef4444", border: "#ef4444" },
  "Not Enough Data":             { bg: "rgba(148,163,184,0.1)",  color: "#94a3b8", border: "#334155" },
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
    const role = parse("uwu_role");
    setMyId(id);
    setMyRole(role);

    // If superadmin: fetch degree list, don't auto-load curriculum
    if (role === "superadmin" && id) {
      fetch(`http://localhost:8000/get_gpa.php?user_id=${id}&list_degrees=1`)
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
        ? `http://localhost:8000/get_gpa.php?user_id=${myId}&degree_override=${degreeOverride}`
        : `http://localhost:8000/get_gpa.php?user_id=${myId}`;
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
      const r = await fetch("http://localhost:8000/set_specialization.php", {
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
      const r = await fetch("http://localhost:8000/save_grades.php", {
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
    <div className="container py-16 flex justify-center">
      <div className="card text-center" style={{ maxWidth: "460px", borderTop: "3px solid var(--warning)" }}>
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
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Calculator size={36} style={{ color: "var(--danger)" }} />
            Smart GPA Calculator
          </h1>
          <p className="text-muted">Superadmin Preview Mode — select a degree programme to inspect its curriculum.</p>
        </div>

        <div className="card" style={{ maxWidth: "600px", margin: "0 auto", padding: "2.5rem", borderTop: "3px solid var(--primary)" }}>
          <div className="flex items-center gap-3 mb-6">
            <div style={{ padding: "0.75rem", borderRadius: "50%", backgroundColor: "rgba(139,92,246,0.1)" }}>
              <Eye size={28} style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Select Degree Programme</h2>
              <p className="text-muted text-sm">Preview any degree curriculum as Superadmin</p>
            </div>
          </div>

          {degrees.length === 0 ? (
            <div className="text-center text-muted py-8">
              <Loader size={32} style={{ margin: "0 auto 0.5rem", animation: "spin 1s linear infinite" }} />
              <p>Loading degrees...</p>
              <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {degrees.map(d => (
                <button
                  key={d.degree_code}
                  onClick={() => handleDegreeSelect(d.degree_code)}
                  className="card text-left flex items-center gap-4"
                  style={{ cursor: "pointer", padding: "1rem 1.25rem", transition: "all 0.2s", border: "1px solid var(--border)", background: "var(--secondary)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)"; (e.currentTarget as HTMLElement).style.transform = "translateX(4px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.transform = ""; }}>
                  <div style={{ padding: "0.5rem", borderRadius: "0.5rem", backgroundColor: "rgba(139,92,246,0.1)", flexShrink: 0 }}>
                    <GraduationCap size={22} style={{ color: "var(--primary)" }} />
                  </div>
                  <div>
                    <div className="font-bold" style={{ color: "var(--primary)" }}>{d.degree_code}</div>
                    <div className="text-sm text-muted">{d.degree_name}</div>
                  </div>
                  <ChevronRight size={18} className="text-muted" style={{ marginLeft: "auto" }} />
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
    <div className="container py-16 text-center">
      <Loader size={40} style={{ margin: "0 auto 1rem", color: "var(--danger)", animation: "spin 1s linear infinite" }} />
      <p className="text-muted">Loading curriculum...</p>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── Not eligible ── */
  if (notEligible) return (
    <div className="container py-16 flex justify-center">
      <div className="card text-center" style={{ maxWidth: "500px", borderTop: "3px solid var(--warning)" }}>
        <AlertCircle size={48} style={{ margin: "0 auto 1rem", color: "var(--warning)" }} />
        <h2 className="text-2xl font-bold mb-3">Feature Not Available</h2>
        <p className="text-muted mb-4">The Smart GPA Calculator is currently available only for <strong>Faculty of Applied Sciences</strong> students:</p>
        <div className="flex justify-center gap-2 flex-wrap mb-4">
          {["IIT", "CST", "MRT", "SCT"].map(d => (
            <span key={d} className="badge badge-primary" style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}>{d}</span>
          ))}
        </div>
        <p className="text-muted text-sm">Support for other faculties will be added in a future update.</p>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error && !curriculumLoaded) return (
    <div className="container py-8">
      <div className="p-4 rounded text-sm" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>
    </div>
  );

  /* ── Main UI ── */
  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Calculator size={36} style={{ color: "var(--danger)" }} />
            Smart GPA Calculator
          </h1>
          {userInfo && (
            <p className="text-muted">{userInfo.degree_name}</p>
          )}
          {userInfo && !previewMode && (
            <p className="text-muted text-sm">{userInfo.enrollment_number} · {userInfo.batch}</p>
          )}
        {/* MRT/SCT: show current specialization + change button */}
        {userInfo && !previewMode && !needsSpecialization && userInfo.raw_degree && ["MRT","SCT"].includes(userInfo.raw_degree) && (
          <div className="flex items-center gap-2 mt-1">
            <span className="badge" style={{ backgroundColor: "rgba(234,179,8,0.15)", color: "var(--warning)", border: "1px solid rgba(234,179,8,0.3)" }}>
              {userInfo.degree_code}
            </span>
            <button
              className="btn text-xs"
              style={{ padding: "0.25rem 0.75rem", backgroundColor: "rgba(234,179,8,0.1)", color: "var(--warning)", border: "1px solid rgba(234,179,8,0.3)" }}
              onClick={() => setNeedsSpecialization(true)}>
              ✎ Change Specialization
            </button>
          </div>
        )}
        </div>
        {/* Superadmin: back button to pick another degree */}
        {myRole === "superadmin" && previewMode && (
          <div className="flex items-center gap-3">
            <div className="badge" style={{ backgroundColor: "rgba(139,92,246,0.15)", color: "var(--primary)", border: "1px solid var(--primary)", padding: "0.4rem 1rem", fontSize: "0.8rem" }}>
              <Eye size={14} style={{ display: "inline", marginRight: "0.4rem" }} />
              Preview Mode — {userInfo?.degree_code}
            </div>
            <button className="btn btn-secondary text-sm" onClick={() => { setCurriculumLoaded(false); setSelectedDegree(""); setCurriculum({}); }}>
              ← Back to Degrees
            </button>
          </div>
        )}
      </div>

      {/* GPA Summary */}
      {userInfo && (
        <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <div className="card text-center" style={{ borderTop: "3px solid var(--danger)" }}>
            <div className="text-muted text-sm mb-1">Live GPA</div>
            <div className="text-5xl font-bold mb-1" style={{ color: "var(--danger)" }}>{liveGPA.toFixed(2)}</div>
            <div className="text-xs text-muted">{previewMode ? "Preview (not saved)" : "from entries below"}</div>
          </div>
          {!previewMode && (
            <div className="card text-center" style={{ borderTop: "3px solid var(--success)" }}>
              <div className="text-muted text-sm mb-1">Saved GPA</div>
              <div className="text-5xl font-bold mb-1" style={{ color: "var(--success)" }}>
                {(gpaSummary?.current_gpa ?? 0).toFixed(2)}
              </div>
              <div className="text-xs text-muted">{gpaSummary?.modules_completed ?? 0} modules · {gpaSummary?.total_gpa_credits ?? 0} GPA credits</div>
            </div>
          )}
          <div className="card text-center" style={{ borderTop: `3px solid ${classStyle.border}`, gridColumn: previewMode ? "span 2" : "span 1" }}>
            <div className="text-muted text-sm mb-2 flex items-center justify-center gap-2">
              <Award size={16} /> Projected Degree Class
            </div>
            <div className="text-2xl font-bold" style={{ color: classStyle.color }}>{liveClass}</div>
            <div className="text-xs text-muted mt-1">Based on grades entered below</div>
          </div>
        </div>
      )}

      {/* Errors / Messages */}
      {error    && <div className="mb-4 p-3 rounded text-sm" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}
      {saveMsg  && <div className="mb-4 p-3 rounded text-sm" style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "var(--success)", border: "1px solid rgba(34,197,94,0.3)" }}>{saveMsg}</div>}

      {/* Preview mode banner */}
      {previewMode && (
        <div className="mb-6 p-3 rounded text-sm flex items-center gap-2" style={{ backgroundColor: "rgba(139,92,246,0.1)", color: "var(--primary)", border: "1px solid rgba(139,92,246,0.3)" }}>
          <Eye size={16} />
          <strong>Superadmin Preview Mode:</strong> Grade entries are for inspection only. Saving is disabled in preview mode.
        </div>
      )}

      {/* Save button (students only) */}
      {!previewMode && (
        <div className="flex justify-end mb-6">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ backgroundColor: "var(--danger)", opacity: saving ? 0.7 : 1 }}>
            <Save size={18} /> {saving ? "Saving..." : "Save Grades"}
          </button>
        </div>
      )}

      {/* Specialization selector (MRT / SCT students) */}
      {needsSpecialization && specOptions.length > 0 && (
        <div className="card mb-8 overflow-hidden" style={{ borderTop: "3px solid var(--warning)" }}>
          <div className="p-5" style={{ backgroundColor: "rgba(234,179,8,0.07)" }}>
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
              <Award size={20} style={{ color: "var(--warning)" }} />
              Choose Your Specialization
            </h3>
            <p className="text-muted text-sm mb-4">
              <strong>{baseDegree}</strong> students select a specialization at Level 300 (Year 3). Years 1 &amp; 2 are shown below.
              Once you select your specialization, the full 4-year curriculum will load permanently.
            </p>
            {specError && <div className="mb-3 p-2 rounded text-sm" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>{specError}</div>}
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              {specOptions.map(opt => (
                <button
                  key={opt.code}
                  disabled={settingSpec}
                  onClick={() => handleSelectSpec(opt.code)}
                  className="card text-left flex items-center gap-3"
                  style={{ cursor: "pointer", padding: "1rem 1.25rem", border: "1px solid var(--border)", background: "var(--secondary)", opacity: settingSpec ? 0.7 : 1, transition: "all 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--warning)"; (e.currentTarget as HTMLElement).style.transform = "translateX(4px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.transform = ""; }}>
                  <div style={{ padding: "0.5rem", borderRadius: "0.5rem", backgroundColor: "rgba(234,179,8,0.15)", flexShrink: 0 }}>
                    <GraduationCap size={20} style={{ color: "var(--warning)" }} />
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: "var(--warning)" }}>{baseDegree}-{opt.code}</div>
                    <div className="text-xs text-muted">{opt.label}</div>
                  </div>
                  <ChevronRight size={16} className="text-muted" style={{ marginLeft: "auto" }} />
                </button>
              ))}
            </div>
          </div>
          <div className="p-3 text-xs text-muted text-center" style={{ borderTop: "1px solid var(--border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
            You can change your specialization anytime using the "Change Specialization" button in the header.
          </div>
        </div>
      )}

      {/* Curriculum Accordion */}
      <div className="flex flex-col gap-4">
        {Object.entries(curriculum).sort(([a], [b]) => +a - +b).map(([yr, yearData]) => (
          <div key={yr} className="card p-0 overflow-hidden">
            <button onClick={() => toggleYear(yr)} className="w-full flex justify-between items-center p-5"
              style={{ width: "100%", background: "rgba(255,255,255,0.03)", borderBottom: openYears[yr] ? "1px solid var(--border)" : "none", cursor: "pointer", color: "var(--foreground)" }}>
              <span className="text-xl font-bold flex items-center gap-3">
                <BookOpen size={20} style={{ color: "var(--primary)" }} />
                Level {yr}00 — Year {yr}
              </span>
              {openYears[yr] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>

            {openYears[yr] && (
              <div className="p-4 flex flex-col gap-4">
                {Object.entries(yearData).sort(([a], [b]) => +a - +b).map(([sem, semData]) => {
                  const semKey = `${yr}-${sem}`;
                  return (
                    <div key={sem} style={{ border: "1px solid var(--border)", borderRadius: "0.5rem", overflow: "hidden" }}>
                      <button onClick={() => toggleSem(semKey)} className="w-full flex justify-between items-center p-4"
                        style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.03)", cursor: "pointer", color: "var(--foreground)" }}>
                        <span className="font-semibold">Semester {sem}</span>
                        {openSems[semKey] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>

                      {openSems[semKey] && (
                        <div className="p-4 flex flex-col gap-4">
                          {Object.values(semData).map(grp => {
                            const grpColor = GROUP_TYPE_COLORS[grp.group_type] ?? "var(--primary)";
                            return (
                              <div key={grp.group_id}>
                                <div className="flex items-center gap-2 mb-3">
                                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: grpColor, flexShrink: 0, display: "inline-block" }} />
                                  <span className="font-semibold text-sm" style={{ color: grpColor }}>{grp.group_name}</span>
                                  {grp.min_credits_required > 0 && (
                                    <span className="text-xs text-muted">({grp.min_credits_required} credits required)</span>
                                  )}
                                </div>
                                <div style={{ overflowX: "auto" }}>
                                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                      <tr style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                                        {["Module Code", "Module Name", "Credits", "GPA?", "Grade"].map(h => (
                                          <th key={h} className="p-3 text-left text-xs font-semibold text-muted" style={{ borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {grp.modules.map(mod => {
                                        const sel = localGrades[mod.module_id] ?? "";
                                        return (
                                          <tr key={mod.module_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)")}
                                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                                            <td className="p-3 font-mono text-sm" style={{ whiteSpace: "nowrap" }}>{mod.module_code}</td>
                                            <td className="p-3 text-sm">
                                              {mod.module_name}
                                              {!mod.is_mandatory && <span className="text-xs text-muted ml-2">(Pool)</span>}
                                            </td>
                                            <td className="p-3 text-sm text-center">{mod.credits}</td>
                                            <td className="p-3 text-center">
                                              {mod.is_gpa ? (
                                                <span className="badge" style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "var(--success)", fontSize: "0.65rem" }}>GPA</span>
                                              ) : (
                                                <span className="badge" style={{ backgroundColor: "rgba(148,163,184,0.1)", color: "#94a3b8", fontSize: "0.65rem" }}>Non-GPA</span>
                                              )}
                                            </td>
                                            <td className="p-3">
                                              <select className="form-input text-sm"
                                                style={{ padding: "0.3rem 0.5rem", width: "80px", color: getGradeColor(sel || null), opacity: previewMode ? 0.8 : 1 }}
                                                value={sel}
                                                onChange={e => handleGradeChange(mod.module_id, e.target.value)}>
                                                {GRADES.map(g => <option key={g} value={g}>{g || "—"}</option>)}
                                              </select>
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
          {saveMsg && <span className="text-sm" style={{ color: "var(--success)" }}>{saveMsg}</span>}
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ backgroundColor: "var(--danger)", padding: "0.75rem 2rem", opacity: saving ? 0.7 : 1 }}>
            <Save size={18} /> {saving ? "Saving..." : "Save All Grades"}
          </button>
        </div>
      )}

      <div className="card mt-8 p-4">
        <div className="font-semibold mb-3 flex items-center gap-2 text-sm">
          <TrendingUp size={16} style={{ color: "var(--primary)" }} /> Grade Reference (UWU Scale)
        </div>
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
          {[["A+/A","4.00","90–100"],["A-","3.70","70–79"],["B+","3.30","60–69"],["B","3.00","55–59"],["B-","2.70","50–54"],["C+","2.30","45–49"],["C","2.00","40–44"],["C-","1.70","35–39"],["D+","1.30","30–34"],["D","1.00","25–29"],["E","0.00","0–24"]].map(([g, gpv, range]) => (
            <div key={g} className="text-center" style={{ padding: "0.4rem", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "0.4rem" }}>
              <div className="font-bold text-sm" style={{ color: getGradeColor(g.split("/")[0]) }}>{g}</div>
              <div className="text-xs text-muted">GPV {gpv}</div>
              <div className="text-xs text-muted">{range}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
