"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Module = { id: number; title: string; rawContent: string };

// ─── Markdown Parser ────────────────────────────────────────────────────────
function parseMarkdown(md: string): React.ReactNode[] {
  const lines = md.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  const formatInline = (text: string): React.ReactNode => {
    // Split on bold, code, and italic patterns
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((p, idx) => {
      if (p.startsWith("**") && p.endsWith("**"))
        return <strong key={idx} style={{ color: "#1e293b", fontWeight: 700 }}>{p.slice(2, -2)}</strong>;
      if (p.startsWith("`") && p.endsWith("`"))
        return <code key={idx} style={{ background: "#f1f5f9", color: "#dc2626", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 15 }}>{p.slice(1, -1)}</code>;
      if (p.startsWith("*") && p.endsWith("*") && p.length > 2)
        return <em key={idx} style={{ color: "#64748b", fontStyle: "italic" }}>{p.slice(1, -1)}</em>;
      return p;
    });
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    // skip top-level # and ## headings and ---
    if (line.startsWith("# ") || line.startsWith("---")) { i++; continue; }
    if (line.startsWith("## ")) { i++; continue; }

    // ### heading → section title
    if (line.startsWith("### ")) {
      nodes.push(
        <h2 key={i} style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", margin: "36px 0 14px", paddingBottom: 10, borderBottom: "2px solid #e2e8f0" }}>
          {line.slice(4)}
        </h2>
      );
      i++; continue;
    }

    // #### sub-heading
    if (line.startsWith("#### ")) {
      nodes.push(
        <h3 key={i} style={{ fontSize: 20, fontWeight: 700, color: "#1e3a5f", margin: "24px 0 10px" }}>
          {line.slice(5)}
        </h3>
      );
      i++; continue;
    }

    // code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      nodes.push(<CodeBlock key={`code-${i}`} code={codeLines.join("\n")} lang={lang} />);
      continue;
    }

    // table
    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      nodes.push(<MdTable key={`table-${i}`} lines={tableLines} />);
      continue;
    }

    // list
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))) {
        const t = lines[i].trim().slice(2);
        items.push(<li key={i} style={{ marginBottom: 8, lineHeight: 1.7 }}>{formatInline(t)}</li>);
        i++;
      }
      nodes.push(
        <ul key={`ul-${i}`} style={{ margin: "14px 0", paddingLeft: 28, listStyle: "disc", color: "#374151" }}>
          {items}
        </ul>
      );
      continue;
    }

    // numbered list
    if (/^\d+\./.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\./.test(lines[i].trim())) {
        const t = lines[i].trim().replace(/^\d+\.\s*/, "");
        items.push(<li key={i} style={{ marginBottom: 8, lineHeight: 1.7 }}>{formatInline(t)}</li>);
        i++;
      }
      nodes.push(
        <ol key={`ol-${i}`} style={{ margin: "14px 0", paddingLeft: 28, color: "#374151" }}>
          {items}
        </ol>
      );
      continue;
    }

    // blank
    if (line === "") { i++; continue; }

    // paragraph
    nodes.push(
      <p key={i} style={{ fontSize: 17, lineHeight: 1.85, color: "#374151", marginBottom: 16 }}>
        {formatInline(line)}
      </p>
    );
    i++;
  }

  return nodes;
}

// ─── Code Block Component ────────────────────────────────────────────────────
function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Syntax highlight – escape HTML first, then inject spans
  const highlight = (c: string) => {
    let h = c
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    // Comments
    h = h.replace(/((?:\/\/|#(?!\w))[^\n]*)/g, '<span style="color:#6a9955">$1</span>');
    // Keywords
    h = h.replace(/\b(return|const|let|var|function|export|default|if|else|echo|require|try|catch|new|await|async|import|from|use|class|public|private|static|void|int|string|bool|array)\b/g, '<span style="color:#569cd6">$1</span>');
    // Booleans / null
    h = h.replace(/\b(true|false|null|undefined|NULL|TRUE|FALSE)\b/g, '<span style="color:#4ec9b0">$1</span>');
    // Strings (single and double quoted — HTML-escaped version)
    h = h.replace(/(=\s*)?(&quot;.*?&quot;|&#039;.*?&#039;|"[^"]*"|'[^']*')/g, (match, prefix, str) => {
      if (prefix) return match;
      return `<span style="color:#ce9178">${str}</span>`;
    });
    return h;
  };

  return (
    <div style={{ margin: "24px 0", borderRadius: 10, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1e293b", padding: "10px 18px" }}>
        <span style={{ color: "#94a3b8", fontSize: 13, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>{lang || "code"}</span>
        <button onClick={copy} style={{ background: copied ? "#059669" : "#334155", color: "#fff", border: "none", borderRadius: 6, padding: "4px 14px", cursor: "pointer", fontSize: 13, transition: "background 0.2s" }}>
          {copied ? "✓ Copied!" : "Copy"}
        </button>
      </div>
      <pre style={{ background: "#0d1117", margin: 0, padding: "20px 22px", overflowX: "auto", fontSize: 14.5, lineHeight: 1.8, fontFamily: "'Fira Code', 'Consolas', monospace", color: "#e6edf3" }}>
        <code style={{ color: "#e6edf3" }} dangerouslySetInnerHTML={{ __html: highlight(code) }} />
      </pre>
    </div>
  );
}

// ─── Table Component ─────────────────────────────────────────────────────────
function MdTable({ lines }: { lines: string[] }) {
  // Filter out separator rows (lines that only contain |, -, and spaces)
  const allRows = lines.filter(l => l.replace(/[\|\-\s]/g, "").trim() !== "");
  if (allRows.length < 2) return null;
  const headers = allRows[0].split("|").filter(c => c.trim() !== "").map(h => h.trim());
  // All rows after the header are data rows (separator rows already filtered above)
  const dataRows = allRows.slice(1);

  return (
    <div style={{ overflowX: "auto", margin: "20px 0", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
        <thead>
          <tr>{headers.map((h, i) => <th key={i} style={{ background: "#1e293b", color: "#e2e8f0", padding: "12px 18px", textAlign: "left", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {dataRows.map((row, ri) => {
            const cells = row.split("|").filter(Boolean).map(c => c.trim());
            return (
              <tr key={ri} style={{ background: ri % 2 === 0 ? "#f8fafc" : "#fff" }}>
                {cells.map((c, ci) => <td key={ci} style={{ padding: "9px 16px", borderBottom: "1px solid #e2e8f0", color: "#374151" }}>{c}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────
export default function LearnClient({ modules }: { modules: Module[] }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [activeId, setActiveId] = useState(1);
  const [progress, setProgress] = useState<Set<number>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const role = document.cookie.split("; ").find(r => r.startsWith("uwu_role="))?.split("=")[1];
    if (role !== "superadmin") { router.push("/"); return; }
    setAuthorized(true);
    const saved = localStorage.getItem("lms_active");
    if (saved) setActiveId(Number(saved));
    const savedProgress = localStorage.getItem("lms_progress");
    if (savedProgress) setProgress(new Set(JSON.parse(savedProgress)));
  }, [router]);

  const goTo = (id: number) => {
    setActiveId(id);
    localStorage.setItem("lms_active", String(id));
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const markDone = (id: number) => {
    const next = new Set(progress);
    next.has(id) ? next.delete(id) : next.add(id);
    setProgress(next);
    localStorage.setItem("lms_progress", JSON.stringify([...next]));
  };

  const filtered = modules.filter(m =>
    searchQuery === "" || m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const current = modules.find(m => m.id === activeId) || modules[0];
  const pct = Math.round((progress.size / modules.length) * 100);

  if (!authorized) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 48, height: 48, border: "4px solid #334155", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <p style={{ color: "#94a3b8", fontFamily: "sans-serif" }}>Verifying access...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'Inter', 'Segoe UI', sans-serif", background: "#f8fafc", overflow: "hidden" }}>

      {/* ── Top Bar ── */}
      <header style={{ height: 58, background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0, boxShadow: "0 2px 12px rgba(0,0,0,0.3)", zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setSidebarOpen(p => !p)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, color: "#94a3b8", fontSize: 20, lineHeight: 1 }} title="Toggle sidebar">
            ☰
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800, fontSize: 20, letterSpacing: "-0.5px" }}>UWU-NEXUS</span>
            <span style={{ color: "#475569", fontSize: 14 }}>/ LMS</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Progress */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 120, height: 6, background: "#1e293b", borderRadius: 99 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#10b981,#3b82f6)", borderRadius: 99, transition: "width 0.4s" }} />
            </div>
            <span style={{ color: "#94a3b8", fontSize: 13, fontFamily: "monospace" }}>{pct}%</span>
          </div>
          <div style={{ background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>SUPERADMIN</div>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Sidebar ── */}
        {sidebarOpen && (
          <aside style={{ width: 320, minWidth: 320, maxWidth: 320, background: "#0f172a", display: "flex", flexDirection: "column", flexShrink: 0, borderRight: "1px solid #1e293b", overflowY: "auto", boxShadow: "4px 0 20px rgba(0,0,0,0.2)" }}>

            {/* Search */}
            <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid #1e293b" }}>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="🔍 Search topics..."
                style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* Progress Summary */}
            <div style={{ padding: "12px 16px", background: "#1e293b", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Progress</span>
              <span style={{ color: "#10b981", fontSize: 13, fontWeight: 700 }}>{progress.size} / {modules.length} Done</span>
            </div>

            {/* Module List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              <div style={{ padding: "8px 16px 4px", fontSize: 10, fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.15em" }}>All Modules</div>
              {filtered.map((m, idx) => {
                const isActive = m.id === activeId;
                const isDone = progress.has(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => goTo(m.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 16px",
                      background: isActive ? "linear-gradient(135deg,rgba(16,185,129,0.2),rgba(59,130,246,0.15))" : "transparent",
                      border: "none",
                      borderLeft: isActive ? "3px solid #10b981" : "3px solid transparent",
                      borderBottom: "1px solid #1a2535",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      color: isActive ? "#e2e8f0" : "#64748b",
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#1e293b"; (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
                    onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#64748b"; } }}
                  >
                    {/* Number Badge */}
                    <span style={{
                      minWidth: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      background: isDone ? "#059669" : isActive ? "#10b981" : "#1e293b",
                      color: isDone || isActive ? "#fff" : "#475569",
                      fontSize: 12, fontWeight: 700, flexShrink: 0
                    }}>
                      {isDone ? "✓" : idx + 1}
                    </span>
                    <span style={{ fontSize: 13.5, lineHeight: 1.4, wordBreak: "break-word" }}>{m.title}</span>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p style={{ color: "#475569", textAlign: "center", padding: "24px 16px", fontSize: 14 }}>No results found.</p>
              )}
            </div>
          </aside>
        )}

        {/* ── Main Content ── */}
        <main ref={contentRef} style={{ flex: 1, overflowY: "auto", background: "#f8fafc", display: "flex", flexDirection: "column" }}>

          {/* Breadcrumb bar */}
          <div style={{ background: "#fff", padding: "12px 40px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ color: "#94a3b8", fontSize: 13 }}>LMS</span>
            <span style={{ color: "#cbd5e1" }}>›</span>
            <span style={{ color: "#10b981", fontSize: 13, fontWeight: 600 }}>Module {activeId} of {modules.length}</span>
          </div>

          {/* Content */}
          <div style={{ maxWidth: 860, width: "100%", margin: "0 auto", padding: "40px 40px 80px", flex: 1 }}>

            {/* Chapter header */}
            <div style={{ background: "linear-gradient(135deg,#0f172a,#1e3a5f)", borderRadius: 14, padding: "28px 32px", marginBottom: 36, boxShadow: "0 8px 32px rgba(15,23,42,0.2)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 10 }}>
                Chapter {activeId} — UWU-NEXUS Guide
              </div>
              <h1 style={{ fontSize: 30, fontWeight: 800, color: "#f1f5f9", margin: 0, lineHeight: 1.3 }}>{current.title}</h1>
            </div>

            {/* Nav top */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, gap: 12 }}>
              <button
                onClick={() => activeId > 1 && goTo(activeId - 1)}
                disabled={activeId === 1}
                style={{ display: "flex", alignItems: "center", gap: 8, background: activeId === 1 ? "#e2e8f0" : "#1e293b", color: activeId === 1 ? "#94a3b8" : "#e2e8f0", border: "none", borderRadius: 8, padding: "10px 20px", cursor: activeId === 1 ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600, transition: "all 0.2s" }}
              >
                ← Previous
              </button>

              <button
                onClick={() => markDone(activeId)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: progress.has(activeId) ? "#059669" : "transparent",
                  color: progress.has(activeId) ? "#fff" : "#10b981",
                  border: "2px solid #10b981", borderRadius: 8,
                  padding: "10px 22px", cursor: "pointer", fontSize: 14, fontWeight: 700,
                  transition: "all 0.2s"
                }}
              >
                {progress.has(activeId) ? "✓ Completed" : "Mark as Complete"}
              </button>

              <button
                onClick={() => activeId < modules.length && goTo(activeId + 1)}
                disabled={activeId === modules.length}
                style={{ display: "flex", alignItems: "center", gap: 8, background: activeId === modules.length ? "#e2e8f0" : "#10b981", color: activeId === modules.length ? "#94a3b8" : "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: activeId === modules.length ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600, transition: "all 0.2s" }}
              >
                Next →
              </button>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", marginBottom: 36 }} />

            {/* Parsed MD content */}
            <div style={{ minHeight: 400 }}>
              {parseMarkdown(current.rawContent)}
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "40px 0" }} />

            {/* Nav bottom */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => activeId > 1 && goTo(activeId - 1)}
                disabled={activeId === 1}
                style={{ display: "flex", alignItems: "center", gap: 8, background: activeId === 1 ? "#e2e8f0" : "#1e293b", color: activeId === 1 ? "#94a3b8" : "#e2e8f0", border: "none", borderRadius: 8, padding: "10px 20px", cursor: activeId === 1 ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600 }}
              >
                ← Previous
              </button>

              {activeId < modules.length && (
                <div style={{ textAlign: "center", flex: 1 }}>
                  <span style={{ color: "#94a3b8", fontSize: 13 }}>Next up:</span>
                  <div style={{ color: "#0f172a", fontWeight: 700, fontSize: 15, marginTop: 2 }}>
                    {modules.find(m => m.id === activeId + 1)?.title}
                  </div>
                </div>
              )}

              <button
                onClick={() => activeId < modules.length && goTo(activeId + 1)}
                disabled={activeId === modules.length}
                style={{ display: "flex", alignItems: "center", gap: 8, background: activeId === modules.length ? "#e2e8f0" : "#10b981", color: activeId === modules.length ? "#94a3b8" : "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: activeId === modules.length ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600 }}
              >
                Next →
              </button>
            </div>

            {/* Completion card */}
            {activeId === modules.length && progress.size === modules.length && (
              <div style={{ marginTop: 40, background: "linear-gradient(135deg,#064e3b,#1e3a5f)", borderRadius: 14, padding: "36px 32px", textAlign: "center", boxShadow: "0 8px 32px rgba(16,185,129,0.2)" }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
                <h2 style={{ color: "#10b981", fontSize: 26, fontWeight: 800, marginBottom: 10 }}>Course Completed!</h2>
                <p style={{ color: "#94a3b8", fontSize: 17, margin: 0 }}>ඔබ UWU-NEXUS Full-Stack Guide සම්පූර්ණ කළා. ඔයාට සුබ අනාගතයක්!</p>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
