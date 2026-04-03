import { useState, useEffect, useRef } from "react";

const uid = () => Math.random().toString(36).slice(2, 10);
const fmt = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtFull = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split("T")[0]; };
const isOverdue = (d) => new Date(d) < new Date(new Date().toISOString().split("T")[0]);

const PALETTES = {
  emerald: { primary: "#059669", light: "#d1fae5", grad: "linear-gradient(135deg, #059669 0%, #0d9488 50%, #0891b2 100%)" },
  indigo: { primary: "#4f46e5", light: "#e0e7ff", grad: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)" },
  rose: { primary: "#e11d48", light: "#ffe4e6", grad: "linear-gradient(135deg, #e11d48 0%, #f43f5e 50%, #fb923c 100%)" },
  amber: { primary: "#d97706", light: "#fef3c7", grad: "linear-gradient(135deg, #d97706 0%, #ea580c 50%, #dc2626 100%)" },
  slate: { primary: "#475569", light: "#f1f5f9", grad: "linear-gradient(135deg, #475569 0%, #64748b 50%, #94a3b8 100%)" },
};
const STATUS_COLORS = { "on-track": "#059669", "at-risk": "#d97706", blocked: "#dc2626", completed: "#6366f1", "not-started": "#94a3b8" };
const PRIORITY_COLORS = { high: "#dc2626", medium: "#d97706", low: "#059669" };

const Icon = ({ d, size = 18, color = "currentColor", ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>{typeof d === "string" ? <path d={d} /> : d}</svg>
);
const I = {
  plus: (p) => <Icon d="M12 5v14M5 12h14" {...p} />,
  arrow: (p) => <Icon d="M19 12H5M12 19l-7-7 7-7" {...p} />,
  check: (p) => <Icon d="M20 6L9 17l-5-5" {...p} />,
  clock: (p) => <Icon d={<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>} {...p} />,
  users: (p) => <Icon d={<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></>} {...p} />,
  zap: (p) => <Icon d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" {...p} />,
  target: (p) => <Icon d={<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>} {...p} />,
  layout: (p) => <Icon d={<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></>} {...p} />,
  file: (p) => <Icon d={<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></>} {...p} />,
  alert: (p) => <Icon d={<><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><path d="M12 9v4M12 17h.01" /></>} {...p} />,
  trash: (p) => <Icon d={<><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></>} {...p} />,
  x: (p) => <Icon d="M18 6L6 18M6 6l12 12" {...p} />,
  msg: (p) => <Icon d={<><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></>} {...p} />,
  folder: (p) => <Icon d={<><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></>} {...p} />,
  bar: (p) => <Icon d={<><path d="M18 20V10M12 20V4M6 20v-6" /></>} {...p} />,
  globe: (p) => <Icon d={<><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z" /></>} {...p} />,
  shield: (p) => <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...p} />,
  star: (p) => <Icon d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" {...p} />,
  moon: (p) => <Icon d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" {...p} />,
  sun: (p) => <Icon d={<><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></>} {...p} />,
  gear: (p) => <Icon d={<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></>} {...p} />,
  archive: (p) => <Icon d={<><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" /></>} {...p} />,
  download: (p) => <Icon d={<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></>} {...p} />,
  tag: (p) => <Icon d={<><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><path d="M7 7h.01" /></>} {...p} />,
  search: (p) => <Icon d={<><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>} {...p} />,
};

const SAMPLE = {
  id: uid(), name: "Mobile App Redesign", description: "Complete overhaul of the mobile banking experience to increase engagement and reduce support tickets.", palette: "indigo", status: "on-track", startDate: daysFromNow(-30), endDate: daysFromNow(45), currentWeek: 5, totalWeeks: 12,
  tags: ["Q2 Launch", "Revenue Critical"],
  archived: false,
  sprintConfig: { type: "sprint", length: 2, currentSprint: 3, phases: [] },
  okrs: [
    { id: uid(), objective: "Increase mobile engagement by 40%", keyResults: [{ id: uid(), title: "Daily active users reach 50K", progress: 35 }, { id: uid(), title: "Session duration increases to 8 min avg", progress: 60 }] },
  ],
  integrations: { slack: "", jira: "", gcal: false },
  stakeholders: [
    { id: uid(), name: "Sarah Chen", role: "Engineering Lead", team: "Engineering", avatar: "SC", syncStatus: "synced", lastActive: daysFromNow(-1), permission: "contributor", notifyPref: "all" },
    { id: uid(), name: "Marcus Johnson", role: "Design Director", team: "Design", avatar: "MJ", syncStatus: "synced", lastActive: daysFromNow(0), permission: "contributor", notifyPref: "all" },
    { id: uid(), name: "Priya Patel", role: "Marketing Manager", team: "Marketing", avatar: "PP", syncStatus: "needs-update", lastActive: daysFromNow(-4), permission: "viewer", notifyPref: "weekly" },
    { id: uid(), name: "David Kim", role: "QA Lead", team: "Engineering", avatar: "DK", syncStatus: "synced", lastActive: daysFromNow(-2), permission: "viewer", notifyPref: "tagged" },
  ],
  updates: [
    { id: uid(), date: daysFromNow(-1), title: "Design system v2 components approved", author: "Marcus Johnson", status: "on-track", type: "milestone", body: "All 48 components reviewed and approved by engineering. Ready for implementation sprint." },
    { id: uid(), date: daysFromNow(-3), title: "API latency spike under investigation", author: "Sarah Chen", status: "at-risk", type: "blocker", body: "P95 latency jumped from 200ms to 800ms after the last deployment. Rolling back while we debug." },
    { id: uid(), date: daysFromNow(-5), title: "User research round 2 complete", author: "You", status: "completed", type: "update", body: "Interviewed 12 users. Key insight: 73% want biometric login as default. Updating requirements." },
    { id: uid(), date: daysFromNow(-8), title: "Sprint 4 planning complete", author: "You", status: "on-track", type: "update", body: "Committed to 34 story points. Focus areas: authentication flow and transaction history." },
  ],
  decisions: [
    { id: uid(), date: daysFromNow(-2), title: "Use biometric auth as default login", decidedBy: "PM + Engineering", rationale: "73% of users prefer biometrics. Reduces friction and support tickets for password resets.", alternatives: ["PIN-first with biometric option", "Traditional password + 2FA"], impact: "high", status: "approved" },
    { id: uid(), date: daysFromNow(-6), title: "Defer dark mode to v2", decidedBy: "PM + Design", rationale: "Dark mode requires 40+ additional design tokens. Shipping light mode first reduces timeline by 2 weeks.", alternatives: ["Ship with dark mode", "Auto-detect system theme only"], impact: "medium", status: "approved" },
  ],
  actions: [
    { id: uid(), title: "Finalize auth flow wireframes", owner: "Marcus Johnson", dueDate: daysFromNow(2), priority: "high", status: "in-progress", project: "Design" },
    { id: uid(), title: "Set up CI/CD for React Native", owner: "Sarah Chen", dueDate: daysFromNow(5), priority: "high", status: "in-progress", project: "Engineering" },
    { id: uid(), title: "Draft launch email sequence", owner: "Priya Patel", dueDate: daysFromNow(-2), priority: "medium", status: "todo", project: "Marketing" },
    { id: uid(), title: "Write API documentation for v2", owner: "David Kim", dueDate: daysFromNow(7), priority: "medium", status: "todo", project: "Engineering" },
    { id: uid(), title: "User testing session scheduling", owner: "You", dueDate: daysFromNow(3), priority: "high", status: "in-progress", project: "Product" },
  ],
};

// Robust storage — always uses localStorage, also syncs to window.storage (Claude artifacts) when available
const storageGet = async (key) => {
  // Try localStorage first (works everywhere)
  try {
    const v = localStorage.getItem(key);
    if (v !== null) return v;
  } catch {}
  // Fallback to window.storage (Claude artifact environment)
  try {
    if (window.storage && typeof window.storage.get === "function") {
      const r = await window.storage.get(key);
      if (r && r.value) { try { localStorage.setItem(key, r.value); } catch {} return r.value; }
    }
  } catch {}
  return null;
};
const storageSet = async (key, val) => {
  // Always write to localStorage
  try { localStorage.setItem(key, val); } catch {}
  // Also write to window.storage if available
  try {
    if (window.storage && typeof window.storage.set === "function") {
      await window.storage.set(key, val);
    }
  } catch {}
};

const SK = "syncbase-v2";
const load = async () => { const v = await storageGet(SK); return v ? JSON.parse(v) : null; };
const save = async (d) => { await storageSet(SK, JSON.stringify(d)); };

// ── Auth storage ──
const AUTH_KEY = "syncbase-auth";
const USERS_KEY = "syncbase-users";

const loadAuth = async () => { const v = await storageGet(AUTH_KEY); return v ? JSON.parse(v) : null; };
const saveAuth = async (d) => { await storageSet(AUTH_KEY, JSON.stringify(d)); };
const loadUsers = async () => { const v = await storageGet(USERS_KEY); return v ? JSON.parse(v) : []; };
const saveUsers = async (d) => { await storageSet(USERS_KEY, JSON.stringify(d)); };
const hashPw = (pw) => { let h = 0; for (let i = 0; i < pw.length; i++) { h = ((h << 5) - h + pw.charCodeAt(i)) | 0; } return "h" + Math.abs(h).toString(36); };

const validatePassword = (pw) => {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Password must include an uppercase letter.";
  if (!/[a-z]/.test(pw)) return "Password must include a lowercase letter.";
  if (!/[0-9]/.test(pw)) return "Password must include a number.";
  return null;
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{--f:'DM Sans',sans-serif;--fm:'JetBrains Mono',monospace;--bg:#fafaf9;--card:#fff;--hover:#f5f5f4;--border:#e7e5e4;--bl:#f0eeec;--txt:#1c1917;--t2:#57534e;--t3:#a8a29e;--r:12px;--rs:8px;--rx:6px;--tr:all .2s cubic-bezier(.4,0,.2,1);--modal-bg:rgba(28,25,23,.45);--input-bg:#fff;--digest-bg:#0f172a;--digest-txt:#e2e8f0;--badge-bg:var(--hover);--badge-txt:var(--t2);--met-bg:var(--card);--met-border:var(--bl);--card-shadow:0 6px 20px rgba(28,25,23,.06);--focus-ring:rgba(99,102,241,.1)}
.dark{--bg:#0c0d12;--card:#16181f;--hover:#1c1f28;--border:#282c37;--bl:#1c1f28;--txt:#ededef;--t2:#b0b3bc;--t3:#787d8a;--modal-bg:rgba(0,0,0,.65);--input-bg:#1c1f28;--digest-bg:#0e1018;--digest-txt:#d4d6dc;--badge-bg:rgba(255,255,255,.06);--badge-txt:rgba(255,255,255,.55);--met-bg:#16181f;--met-border:#1c1f28;--card-shadow:0 6px 20px rgba(0,0,0,.25);--focus-ring:rgba(129,140,248,.15)}
body{font-family:var(--f);background:var(--bg);color:var(--txt);-webkit-font-smoothing:antialiased;transition:background .3s,color .3s}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}

@keyframes fu{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fi{from{opacity:0}to{opacity:1}}
@keyframes si{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes gshift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes spin{to{transform:rotate(360deg)}}

/* ── Landing ── */
.land{min-height:100vh}
.hero{position:relative;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f172a 0%,#1e293b 30%,#0f172a 60%,#1a1a2e 100%);color:#fff;text-align:center;overflow:hidden;padding:40px 24px}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 20% 30%,rgba(99,102,241,.15) 0%,transparent 50%),radial-gradient(circle at 80% 70%,rgba(16,185,129,.12) 0%,transparent 50%),radial-gradient(circle at 50% 50%,rgba(244,63,94,.08) 0%,transparent 60%);pointer-events:none}
.hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:64px 64px;pointer-events:none}
.orb{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;opacity:.35;animation:float 8s ease-in-out infinite}
.o1{width:420px;height:420px;background:rgba(99,102,241,.35);top:-120px;right:-100px}
.o2{width:320px;height:320px;background:rgba(16,185,129,.3);bottom:-100px;left:-80px;animation-delay:2.5s}
.o3{width:220px;height:220px;background:rgba(244,63,94,.25);top:38%;left:8%;animation-delay:4.5s}
.badge{display:inline-flex;align-items:center;gap:8px;padding:6px 18px;border-radius:100px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);font-size:13px;font-weight:500;color:rgba(255,255,255,.65);backdrop-filter:blur(8px);margin-bottom:32px;animation:fu .6s ease both}
.badge-dot{width:7px;height:7px;border-radius:50%;background:#10b981;animation:pulse 2s ease infinite}
.hero h1{font-size:clamp(38px,7vw,76px);font-weight:700;line-height:1.05;letter-spacing:-.03em;max-width:780px;margin-bottom:24px;animation:fu .6s ease .1s both}
.hero h1 em{font-style:normal;background:linear-gradient(135deg,#818cf8,#34d399,#f472b6);background-size:200% 200%;animation:gshift 5s ease infinite;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero p.sub{font-size:clamp(16px,2.5vw,19px);color:rgba(255,255,255,.5);max-width:540px;line-height:1.65;margin-bottom:48px;animation:fu .6s ease .2s both}
.ctas{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;animation:fu .6s ease .3s both}
.btn-p{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;border-radius:100px;border:none;background:#fff;color:#0f172a;font-family:var(--f);font-size:15px;font-weight:600;cursor:pointer;transition:var(--tr);box-shadow:0 4px 20px rgba(255,255,255,.12)}
.btn-p:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(255,255,255,.18)}
.btn-s{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;border-radius:100px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.04);color:#fff;font-family:var(--f);font-size:15px;font-weight:500;cursor:pointer;transition:var(--tr);backdrop-filter:blur(4px)}
.btn-s:hover{background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.28)}
.stats{display:flex;gap:48px;margin-top:72px;animation:fu .6s ease .4s both}
.stat{text-align:center}
.stat-n{font-family:var(--fm);font-size:34px;font-weight:700}
.stat-l{font-size:13px;color:rgba(255,255,255,.38);margin-top:4px}

.feat-sec{padding:100px 24px;background:var(--bg)}
.feat-in{max-width:1000px;margin:0 auto}
.feat-tag{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:var(--t3);text-align:center;margin-bottom:10px}
.feat-h2{font-size:clamp(26px,4vw,40px);font-weight:700;text-align:center;letter-spacing:-.02em;margin-bottom:56px}
.feat-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
.feat-c{padding:28px;border-radius:var(--r);background:var(--card);border:1px solid var(--bl);transition:var(--tr)}
.feat-c:hover{border-color:var(--border);box-shadow:0 6px 20px rgba(28,25,23,.06);transform:translateY(-3px)}
.feat-i{width:44px;height:44px;border-radius:11px;display:flex;align-items:center;justify-content:center;margin-bottom:18px}
.feat-c h3{font-size:16px;font-weight:600;margin-bottom:6px}
.feat-c p{font-size:13.5px;color:var(--t2);line-height:1.6}

.cta-sec{padding:80px 24px;text-align:center;background:linear-gradient(180deg,var(--bg),#f5f5f4)}
.cta-sec h2{font-size:clamp(24px,4vw,34px);font-weight:700;margin-bottom:14px;letter-spacing:-.02em}
.cta-sec p{color:var(--t2);margin-bottom:28px;font-size:15px}
.btn-d{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;border-radius:100px;border:none;background:#0f172a;color:#fff;font-family:var(--f);font-size:15px;font-weight:600;cursor:pointer;transition:var(--tr);box-shadow:0 4px 16px rgba(15,23,42,.15)}
.btn-d:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(15,23,42,.2)}

/* ── Search & Filter ── */
.search-wrap{display:flex;gap:10px;align-items:stretch;margin-bottom:14px}
.search-bar{display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:100px;border:1px solid var(--bl);background:var(--card);transition:var(--tr);flex:1}
.search-bar:focus-within{border-color:#6366f1;box-shadow:0 0 0 3px var(--focus-ring)}
.dark .search-bar:focus-within{border-color:#818cf8}
.search-bar input{flex:1;border:none;background:transparent;font-family:var(--f);font-size:13px;color:var(--txt);outline:none}
.search-bar input::placeholder{color:var(--t3)}
.filter-row{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px}
.f-chip{padding:4px 12px;border-radius:100px;border:1px solid var(--bl);background:var(--card);font-family:var(--f);font-size:11px;font-weight:500;color:var(--t3);cursor:pointer;transition:var(--tr);display:inline-flex;align-items:center;gap:4px}
.f-chip:hover{border-color:var(--border);color:var(--t2)}
.f-chip.on{border-color:#6366f1;background:rgba(99,102,241,.08);color:#6366f1}
.dark .f-chip.on{border-color:#818cf8;background:rgba(129,140,248,.1);color:#a5b4fc}
.search-count{font-size:11.5px;color:var(--t3);margin-bottom:14px}

/* Activity Feed */
.feed-item{display:flex;gap:12px;padding:16px;border-radius:var(--r);background:var(--card);border:1px solid var(--bl);margin-bottom:8px;transition:var(--tr)}
.feed-item:hover{border-color:var(--border)}
.feed-dot{width:10px;height:10px;border-radius:50%;margin-top:5px;flex-shrink:0}
.feed-content{flex:1}
.feed-title{font-size:13.5px;font-weight:600;color:var(--txt);margin-bottom:2px}
.feed-body{font-size:12.5px;color:var(--t2);line-height:1.5;margin-top:4px}
.feed-meta{font-size:11px;color:var(--t3);display:flex;gap:10px;align-items:center}
.feed-proj{font-size:10.5px;font-weight:600;padding:2px 8px;border-radius:100px;cursor:pointer;transition:var(--tr)}
.feed-proj:hover{filter:brightness(1.1)}
.feed-type{font-size:10px;font-weight:500;padding:2px 7px;border-radius:100px;background:var(--hover);color:var(--t3)}

/* Comments */
.cmt-section{margin-top:10px;padding-top:10px;border-top:1px solid var(--bl)}
.cmt-toggle{font-size:11.5px;color:var(--t3);cursor:pointer;display:flex;align-items:center;gap:5px;background:none;border:none;font-family:var(--f);transition:var(--tr);padding:0}
.cmt-toggle:hover{color:var(--t2)}
.cmt{display:flex;gap:8px;padding:8px 0}
.cmt:last-child{padding-bottom:0}
.cmt-av{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:9px;color:#fff;flex-shrink:0}
.cmt-body{flex:1}
.cmt-author{font-size:11.5px;font-weight:600;color:var(--txt)}
.cmt-time{font-size:10px;color:var(--t3);margin-left:6px;font-weight:400}
.cmt-text{font-size:12.5px;color:var(--t2);line-height:1.5;margin-top:2px}
.cmt-input{display:flex;gap:8px;margin-top:8px}
.cmt-input input{flex:1;padding:7px 12px;border-radius:100px;border:1px solid var(--bl);background:var(--card);font-family:var(--f);font-size:12px;color:var(--txt);outline:none;transition:var(--tr)}
.cmt-input input:focus{border-color:#6366f1;box-shadow:0 0 0 3px var(--focus-ring)}
.dark .cmt-input input:focus{border-color:#818cf8}
.cmt-input input::placeholder{color:var(--t3)}
.cmt-send{padding:7px 14px;border-radius:100px;border:none;font-family:var(--f);font-size:11.5px;font-weight:600;color:#fff;cursor:pointer;transition:var(--tr)}
.cmt-send:hover{filter:brightness(1.1)}
.cmt-send:disabled{opacity:.35;cursor:not-allowed}

/* RACI Matrix */
.raci-wrap{overflow-x:auto}
.raci-table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--bl);border-radius:var(--r);overflow:hidden;min-width:600px}
.raci-table th{padding:10px 12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--t3);background:var(--hover);border-bottom:1px solid var(--bl);text-align:left}
.raci-table th.raci-col{text-align:center;min-width:80px}
.raci-table td{padding:10px 12px;font-size:13px;color:var(--txt);border-bottom:1px solid var(--bl);background:var(--card)}
.raci-table tr:last-child td{border-bottom:none}
.raci-table tr:hover td{background:var(--hover)}
.raci-cell{text-align:center}
.raci-btn{width:32px;height:32px;border-radius:8px;border:1px solid var(--bl);background:var(--card);cursor:pointer;font-family:var(--f);font-size:12px;font-weight:700;color:var(--t3);transition:var(--tr);display:inline-flex;align-items:center;justify-content:center}
.raci-btn:hover{border-color:var(--border);background:var(--hover)}
.raci-btn.R{background:rgba(99,102,241,.12);color:#6366f1;border-color:rgba(99,102,241,.25)}
.raci-btn.A{background:rgba(220,38,38,.1);color:#dc2626;border-color:rgba(220,38,38,.2)}
.raci-btn.C{background:rgba(217,119,6,.1);color:#d97706;border-color:rgba(217,119,6,.2)}
.raci-btn.I{background:rgba(5,150,105,.1);color:#059669;border-color:rgba(5,150,105,.2)}
.raci-legend{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px}
.raci-legend-item{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--t2)}
.raci-legend-dot{width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700}
.raci-add-row{display:flex;gap:8px;margin-top:12px}
.raci-add-input{flex:1;padding:8px 14px;border-radius:var(--rx);border:1px solid var(--bl);background:var(--card);font-family:var(--f);font-size:13px;color:var(--txt);outline:none;transition:var(--tr)}
.raci-add-input:focus{border-color:#6366f1;box-shadow:0 0 0 3px var(--focus-ring)}
.dark .raci-add-input:focus{border-color:#818cf8}
.raci-add-input::placeholder{color:var(--t3)}

/* ── Auth ── */
.auth-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f172a 0%,#1e293b 40%,#0f172a 70%,#1a1a2e 100%);padding:24px;position:relative;overflow:hidden}
.auth-wrap::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 30% 20%,rgba(99,102,241,.13) 0%,transparent 50%),radial-gradient(circle at 70% 80%,rgba(16,185,129,.1) 0%,transparent 50%);pointer-events:none}
.auth-card{position:relative;z-index:1;width:100%;max-width:420px;background:rgba(255,255,255,.04);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:40px 36px;animation:si .4s ease both}
.auth-logo{display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:32px}
.auth-logo .logo-mark{width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;color:#fff}
.auth-logo span{font-size:22px;font-weight:700;color:#fff;letter-spacing:-.02em}
.auth-card h2{font-size:22px;font-weight:700;color:#fff;text-align:center;margin-bottom:6px}
.auth-card .auth-sub{font-size:14px;color:rgba(255,255,255,.45);text-align:center;margin-bottom:28px}
.auth-fld{margin-bottom:16px}
.auth-fld label{display:block;font-size:12.5px;font-weight:500;color:rgba(255,255,255,.55);margin-bottom:6px}
.auth-fld input{width:100%;padding:11px 15px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);font-family:var(--f);font-size:14px;color:#fff;outline:none;transition:var(--tr)}
.auth-fld input::placeholder{color:rgba(255,255,255,.25)}
.auth-fld input:focus{border-color:rgba(99,102,241,.5);box-shadow:0 0 0 3px rgba(99,102,241,.12);background:rgba(255,255,255,.08)}
.auth-btn{width:100%;padding:13px;border-radius:100px;border:none;font-family:var(--f);font-size:15px;font-weight:600;cursor:pointer;transition:var(--tr);margin-top:8px}
.auth-btn-primary{background:#fff;color:#0f172a}
.auth-btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 24px rgba(255,255,255,.15)}
.auth-btn-primary:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none}
.auth-switch{text-align:center;margin-top:20px;font-size:13px;color:rgba(255,255,255,.4)}
.auth-switch button{background:none;border:none;color:#818cf8;font-family:var(--f);font-size:13px;font-weight:600;cursor:pointer;padding:0;margin-left:4px;transition:var(--tr)}
.auth-switch button:hover{color:#a5b4fc}
.auth-err{padding:10px 14px;border-radius:8px;background:rgba(220,38,38,.12);border:1px solid rgba(220,38,38,.2);color:#fca5a5;font-size:12.5px;margin-bottom:16px;animation:si .25s ease both}
.auth-name-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.auth-avatar{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;color:#fff;margin:0 auto 20px;background:linear-gradient(135deg,#6366f1,#8b5cf6)}

/* User menu */
.user-btn{display:flex;align-items:center;gap:7px;padding:4px 10px 4px 4px;border-radius:100px;border:1px solid var(--border);background:var(--card);cursor:pointer;transition:var(--tr);font-family:var(--f)}
.user-btn:hover{background:var(--hover);border-color:var(--t3)}
.user-av{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:10px;color:#fff;flex-shrink:0}
.user-name{font-size:12px;font-weight:500;color:var(--t2)}
.user-drop{position:absolute;top:calc(100% + 6px);right:0;background:var(--card);border:1px solid var(--border);border-radius:var(--r);box-shadow:0 12px 40px rgba(0,0,0,.12);min-width:200px;padding:6px;z-index:200;animation:si .2s ease both}
.dark .user-drop{box-shadow:0 12px 40px rgba(0,0,0,.35)}
.user-drop-item{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:var(--rs);cursor:pointer;font-size:13px;color:var(--t2);transition:var(--tr);border:none;background:none;width:100%;font-family:var(--f);text-align:left}
.user-drop-item:hover{background:var(--hover);color:var(--txt)}
.user-drop-item.danger{color:#dc2626}
.user-drop-item.danger:hover{background:rgba(220,38,38,.06)}
.user-drop-sep{height:1px;background:var(--border);margin:4px 0}

/* ── App ── */
.app{min-height:100vh;background:var(--bg)}
.hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 28px;background:var(--card);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}
.hdr-l{display:flex;align-items:center;gap:10px}
.logo{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px}
.logo-t{font-size:17px;font-weight:700;letter-spacing:-.02em}
.back{display:flex;align-items:center;gap:5px;padding:5px 11px;border-radius:var(--rx);border:1px solid var(--border);background:transparent;color:var(--t2);font-family:var(--f);font-size:13px;cursor:pointer;transition:var(--tr)}
.back:hover{background:var(--hover);color:var(--txt)}

/* Projects */
.proj-page{max-width:940px;margin:0 auto;padding:44px 24px}
.proj-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:36px}
.proj-hdr h1{font-size:26px;font-weight:700;letter-spacing:-.02em}
.proj-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px}
.pc{padding:24px;border-radius:var(--r);background:var(--card);border:1px solid var(--bl);cursor:pointer;transition:var(--tr);position:relative;overflow:hidden}
.pc:hover{border-color:var(--border);box-shadow:0 6px 20px rgba(28,25,23,.06);transform:translateY(-3px)}
.pc-st{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:100px;font-size:11px;font-weight:500;margin-bottom:12px}
.pc h3{font-size:16px;font-weight:600;margin-bottom:5px}
.pc .desc{font-size:13px;color:var(--t2);line-height:1.5;margin-bottom:14px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.pc-m{display:flex;gap:14px;font-size:12px;color:var(--t3)}
.pc-m span{display:flex;align-items:center;gap:4px}
.new-pc{padding:24px;border-radius:var(--r);border:2px dashed var(--border);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;cursor:pointer;transition:var(--tr);min-height:190px;background:transparent;font-family:var(--f)}
.new-pc:hover{border-color:var(--t3);background:var(--hover)}
.new-pc span{font-size:13px;color:var(--t2);font-weight:500}

/* Portfolio */
.port-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:24px}
.port-stat{padding:16px;border-radius:var(--r);background:var(--card);border:1px solid var(--bl);text-align:center;transition:var(--tr)}
.port-stat:hover{border-color:var(--border)}
.port-stat .ps-v{font-family:var(--fm);font-size:26px;font-weight:700;margin-bottom:2px}
.port-stat .ps-l{font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:.05em;font-weight:500}
.port-toggle{display:flex;gap:2px;padding:3px;border-radius:100px;background:var(--hover);border:1px solid var(--bl)}
.port-toggle button{padding:5px 14px;border-radius:100px;border:none;font-family:var(--f);font-size:12px;font-weight:500;color:var(--t3);cursor:pointer;transition:var(--tr);background:transparent}
.port-toggle button.active{background:var(--card);color:var(--txt);box-shadow:0 1px 4px rgba(0,0,0,.06)}
.dark .port-toggle button.active{box-shadow:0 1px 4px rgba(0,0,0,.2)}

/* Report table */
.rpt-table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--bl);border-radius:var(--r);overflow:hidden}
.rpt-table th{padding:10px 14px;font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--t3);background:var(--hover);border-bottom:1px solid var(--bl);text-align:left}
.rpt-table td{padding:12px 14px;font-size:13px;color:var(--txt);border-bottom:1px solid var(--bl);background:var(--card);transition:var(--tr)}
.rpt-table tr:last-child td{border-bottom:none}
.rpt-table tr:hover td{background:var(--hover)}
.rpt-table .rpt-name{font-weight:600;cursor:pointer;transition:var(--tr)}
.rpt-table .rpt-name:hover{color:#6366f1}
.rpt-bar{height:5px;border-radius:3px;background:var(--bl);overflow:hidden;min-width:60px}
.rpt-bar-fill{height:100%;border-radius:3px;transition:width .5s ease}
.rpt-status{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:100px;font-size:11px;font-weight:500}

/* Dashboard */
.dash{max-width:1080px;margin:0 auto;padding:28px 24px}
.dash-top{margin-bottom:28px}
.dash-st{display:inline-flex;align-items:center;gap:7px;margin-bottom:5px}
.dash-st span{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
.dash-t{font-size:24px;font-weight:700;letter-spacing:-.02em;margin-bottom:3px}
.dash-d{font-size:14px;color:var(--t2)}
.prog{margin-top:14px}
.prog-bar{height:5px;border-radius:3px;background:var(--bl);overflow:hidden;margin-bottom:5px}
.prog-fill{height:100%;border-radius:3px;transition:width .6s ease}
.prog-txt{font-size:11px;color:var(--t3);font-family:var(--fm)}

.mets{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-bottom:28px}
.met{padding:18px;border-radius:var(--r);background:var(--card);border:1px solid var(--bl);transition:var(--tr)}
.met:hover{border-color:var(--border)}
.met-l{font-size:11px;color:var(--t3);font-weight:500;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.met-v{font-size:26px;font-weight:700;font-family:var(--fm);letter-spacing:-.02em}
.met-s{font-size:11px;color:var(--t2);margin-top:3px}

.tabs{display:flex;gap:2px;margin-bottom:22px;border-bottom:1px solid var(--border)}
.tab{padding:9px 18px;border:none;background:transparent;font-family:var(--f);font-size:13.5px;font-weight:500;color:var(--t3);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:var(--tr);display:flex;align-items:center;gap:6px}
.tab:hover{color:var(--t2)}
.tab.on{color:var(--txt);border-bottom-color:var(--txt)}

.add{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:100px;border:1px solid var(--border);background:var(--card);font-family:var(--f);font-size:13px;font-weight:500;color:var(--t2);cursor:pointer;transition:var(--tr)}
.add:hover{background:var(--hover);border-color:var(--t3);color:var(--txt)}

/* Timeline */
.tl{display:flex;gap:14px;padding:18px;border-radius:var(--rs);background:var(--card);border:1px solid var(--bl);margin-bottom:10px;transition:var(--tr);animation:fu .35s ease both}
.tl:hover{border-color:var(--border);box-shadow:0 2px 8px rgba(28,25,23,.04)}
.tl-dot{width:10px;height:10px;border-radius:50%;margin-top:5px;flex-shrink:0}
.tl-c{flex:1}
.tl-h{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:5px}
.tl-t{font-size:14.5px;font-weight:600}
.tl-b{padding:2px 7px;border-radius:100px;font-size:10.5px;font-weight:500}
.tl-m{font-size:12px;color:var(--t3);margin-bottom:5px}
.tl-body{font-size:13.5px;color:var(--t2);line-height:1.6}

/* Decisions */
.dec{padding:22px;border-radius:var(--r);background:var(--card);border:1px solid var(--bl);margin-bottom:14px;transition:var(--tr);animation:fu .35s ease both}
.dec:hover{border-color:var(--border);box-shadow:0 2px 8px rgba(28,25,23,.04)}
.dec-hdr{display:flex;align-items:start;justify-content:space-between;margin-bottom:10px;gap:12px}
.dec-t{font-size:15.5px;font-weight:600;flex:1}
.dec-imp{padding:3px 9px;border-radius:100px;font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap}
.dec-m{font-size:12px;color:var(--t3);margin-bottom:10px}
.dec-sec{margin-bottom:10px}
.dec-sl{font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--t3);margin-bottom:3px}
.dec-sec p{font-size:13.5px;color:var(--t2);line-height:1.5}
.dec-alts{display:flex;flex-wrap:wrap;gap:5px}
.dec-alt{padding:3px 9px;border-radius:100px;font-size:12px;background:var(--hover);color:var(--t2);border:1px solid var(--bl)}

/* Actions */
.act{display:flex;align-items:center;gap:11px;padding:14px 18px;border-radius:var(--rs);background:var(--card);border:1px solid var(--bl);margin-bottom:7px;transition:var(--tr);animation:fu .3s ease both}
.act:hover{border-color:var(--border)}
.act-ck{width:20px;height:20px;border-radius:50%;border:2px solid var(--border);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:var(--tr);flex-shrink:0}
.act-ck.dn{border-color:#059669;background:#059669}
.act-in{flex:1;min-width:0}
.act-t{font-size:14px;font-weight:500}
.act-t.dn{text-decoration:line-through;color:var(--t3)}
.act-sub{font-size:12px;color:var(--t3);margin-top:2px;display:flex;gap:10px;flex-wrap:wrap}
.act-pr{padding:2px 7px;border-radius:100px;font-size:10.5px;font-weight:600}
.act-due{font-size:12px;font-family:var(--fm)}
.act-due.od{color:#dc2626;font-weight:600}
.act-del{background:none;border:none;cursor:pointer;padding:4px;opacity:.3;transition:var(--tr)}
.act-del:hover{opacity:.7}

/* Stakeholders */
.sh{display:flex;align-items:center;gap:14px;padding:18px;border-radius:var(--r);background:var(--card);border:1px solid var(--bl);margin-bottom:10px;transition:var(--tr);animation:fu .35s ease both}
.sh:hover{border-color:var(--border)}
.sh-av{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px;color:#fff;flex-shrink:0}
.sh-in{flex:1}
.sh-n{font-size:14.5px;font-weight:600}
.sh-r{font-size:13px;color:var(--t2)}
.sh-sync{display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:100px;font-size:11px;font-weight:500;margin-top:3px}

.empty{text-align:center;padding:44px 24px;color:var(--t3)}
.empty p{font-size:13px;margin-top:6px}

/* Modal */
.mo{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:200;display:flex;align-items:center;justify-content:center;animation:fi .15s ease;padding:24px;backdrop-filter:blur(4px)}
.mod{background:var(--card);border-radius:16px;width:100%;max-width:500px;box-shadow:0 20px 60px rgba(15,23,42,.18);animation:si .2s ease;max-height:85vh;overflow-y:auto}
.mod-h{display:flex;align-items:center;justify-content:space-between;padding:22px 26px 14px;border-bottom:1px solid var(--bl)}
.mod-h h2{font-size:17px;font-weight:600}
.mod-x{width:30px;height:30px;border-radius:8px;border:none;background:var(--hover);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:var(--tr)}
.mod-x:hover{background:var(--border)}
.mod-b{padding:22px 26px}
.mod-f{padding:14px 26px 22px;display:flex;gap:10px;justify-content:flex-end}

.fld{margin-bottom:18px}
.fld label{display:block;font-size:12.5px;font-weight:500;margin-bottom:5px;color:var(--t2)}
.fld input,.fld textarea,.fld select{width:100%;padding:9px 13px;border-radius:var(--rx);border:1px solid var(--border);background:var(--bg);font-family:var(--f);font-size:14px;color:var(--txt);transition:var(--tr);outline:none}
.fld input:focus,.fld textarea:focus,.fld select:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.08)}
.fld textarea{resize:vertical;min-height:72px}

.pal-pk{display:flex;gap:9px}
.pal-d{width:34px;height:34px;border-radius:50%;cursor:pointer;border:3px solid transparent;transition:var(--tr)}
.pal-d.sel{border-color:var(--txt);transform:scale(1.12)}
.pal-d:hover{transform:scale(1.12)}

.btn-sub{padding:9px 22px;border-radius:100px;border:none;font-family:var(--f);font-size:14px;font-weight:600;color:#fff;cursor:pointer;transition:var(--tr)}
.btn-sub:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,0,0,.12)}
.btn-sub:disabled{opacity:.45;cursor:not-allowed;transform:none}
.btn-gh{padding:9px 22px;border-radius:100px;border:1px solid var(--border);background:transparent;font-family:var(--f);font-size:14px;color:var(--t2);cursor:pointer;transition:var(--tr)}
.btn-gh:hover{background:var(--hover)}

/* Settings */
.set-sec{background:var(--card);border:1px solid var(--bl);border-radius:var(--r);margin-bottom:16px;overflow:hidden}
.set-sec-h{padding:18px 22px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--bl)}
.set-sec-h h3{font-size:15px;font-weight:600;color:var(--txt)}
.set-sec-h .set-ico{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center}
.set-sec-b{padding:20px 22px}
.set-row{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--bl)}
.set-row:last-child{border-bottom:none}
.set-row-l{flex:1}
.set-row-l h4{font-size:13.5px;font-weight:500;color:var(--txt);margin-bottom:2px}
.set-row-l p{font-size:12px;color:var(--t3)}
.set-row-r{display:flex;align-items:center;gap:8px}
.set-input{padding:7px 12px;border-radius:var(--rx);border:1px solid var(--border);background:var(--input-bg);font-family:var(--f);font-size:13px;color:var(--txt);outline:none;transition:var(--tr);width:240px}
.set-input:focus{border-color:#6366f1;box-shadow:0 0 0 3px var(--focus-ring)}
.dark .set-input:focus{border-color:#818cf8}
.set-select{padding:7px 12px;border-radius:var(--rx);border:1px solid var(--border);background:var(--input-bg);font-family:var(--f);font-size:13px;color:var(--txt);cursor:pointer;outline:none}
.set-save{padding:6px 16px;border-radius:100px;border:none;font-family:var(--f);font-size:12.5px;font-weight:600;color:#fff;cursor:pointer;transition:var(--tr)}
.set-save:hover{transform:translateY(-1px);box-shadow:0 3px 10px rgba(0,0,0,.12)}
.set-save:disabled{opacity:.4;cursor:not-allowed;transform:none}
.set-danger{border-color:#fecaca}
.dark .set-danger{border-color:#7f1d1d}
.set-danger .set-sec-h{border-bottom-color:#fecaca}
.dark .set-danger .set-sec-h{border-bottom-color:#7f1d1d}
.btn-danger{padding:7px 16px;border-radius:100px;border:1px solid #fca5a5;background:#fef2f2;font-family:var(--f);font-size:12.5px;font-weight:600;color:#dc2626;cursor:pointer;transition:var(--tr)}
.btn-danger:hover{background:#fee2e2;border-color:#f87171}
.dark .btn-danger{background:rgba(220,38,38,.1);border-color:rgba(220,38,38,.3);color:#f87171}
.dark .btn-danger:hover{background:rgba(220,38,38,.18)}
.set-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:500;background:var(--hover);color:var(--t2);border:1px solid var(--bl)}
.set-suggest{padding:14px 18px;border-radius:var(--rs);background:var(--hover);border:1px solid var(--bl);margin-bottom:8px;transition:var(--tr)}
.set-suggest:hover{border-color:var(--border)}
.set-suggest h4{font-size:13px;font-weight:600;color:var(--txt);margin-bottom:3px;display:flex;align-items:center;gap:6px}
.set-suggest p{font-size:12px;color:var(--t2);line-height:1.5}

/* Dark mode toggle */
.dm-tog{display:flex;align-items:center;gap:6px;padding:5px 12px;border-radius:100px;border:1px solid var(--border);background:var(--card);cursor:pointer;transition:var(--tr);font-family:var(--f);font-size:12px;font-weight:500;color:var(--t2)}
.dm-tog:hover{border-color:var(--t3);background:var(--hover)}
.dm-tog svg{transition:transform .3s}
.dm-tog:hover svg{transform:rotate(20deg)}

/* Dark mode overrides */
.dark .feat-c{background:var(--card);border-color:var(--bl)}
.dark .feat-c:hover{box-shadow:var(--card-shadow);border-color:var(--border)}
.dark .feat-c h3{color:var(--txt)}
.dark .feat-c p{color:var(--t2)}
.dark .feat-tag{color:var(--t3)}
.dark .feat-h2{color:var(--txt)}
.dark .feat-sec{background:var(--bg)}
.dark .pc{background:var(--card);border-color:var(--bl)}
.dark .pc:hover{box-shadow:var(--card-shadow);border-color:var(--border)}
.dark .pc h3{color:var(--txt)}
.dark .pc .desc{color:var(--t2)}
.dark .pc-m{color:var(--t3)}
.dark .new-pc{border-color:var(--border)}
.dark .new-pc:hover{border-color:var(--t3);background:var(--hover)}
.dark .new-pc span{color:var(--t2)}
.dark .tl{background:var(--card);border-color:var(--bl)}
.dark .tl:hover{box-shadow:0 2px 8px rgba(0,0,0,.2);border-color:var(--border)}
.dark .tl-t{color:var(--txt)}
.dark .tl-body{color:var(--t2)}
.dark .tl-m{color:var(--t3)}
.dark .dec{background:var(--card);border-color:var(--bl)}
.dark .dec:hover{box-shadow:0 2px 8px rgba(0,0,0,.2);border-color:var(--border)}
.dark .dec-t{color:var(--txt)}
.dark .dec p{color:var(--t2)}
.dark .dec-m{color:var(--t3)}
.dark .dec-sl{color:var(--t3)}
.dark .dec-alt{background:var(--hover);color:var(--t2);border-color:var(--border)}
.dark .act{background:var(--card);border-color:var(--bl)}
.dark .act:hover{background:var(--hover);border-color:var(--border)}
.dark .act-t{color:var(--txt)}
.dark .act-sub{color:var(--t3)}
.dark .act-ck{border-color:var(--border)}
.dark .sh{background:var(--card);border-color:var(--bl)}
.dark .sh:hover{box-shadow:0 4px 16px rgba(0,0,0,.25);border-color:var(--border)}
.dark .sh-n{color:var(--txt)}
.dark .sh-r{color:var(--t2)}
.dark .hdr{background:rgba(22,24,31,.88);border-bottom-color:var(--border)}
.dark .logo-t{color:var(--txt)}
.dark .back{color:var(--t2);border-color:var(--border)}
.dark .back:hover{background:var(--hover);color:var(--txt)}
.dark .add{color:var(--t2);border-color:var(--border);background:var(--card)}
.dark .add:hover{background:var(--hover);color:var(--txt);border-color:var(--t3)}
.dark .dash-t{color:var(--txt)}
.dark .dash-d{color:var(--t2)}
.dark .dash-st span{color:var(--t2)}
.dark .met{background:var(--met-bg);border-color:var(--met-border)}
.dark .met:hover{border-color:var(--border)}
.dark .met-l{color:var(--t3)}
.dark .met-s{color:var(--t3)}
.dark .tab{color:var(--t3)}
.dark .tab:hover{color:var(--t2)}
.dark .tab.on{color:var(--txt);border-bottom-color:var(--txt)}
.dark .proj-hdr h1{color:var(--txt)}
.dark .empty p{color:var(--t3)}
.dark .prog-bar{background:var(--bl)}
.dark .prog-txt{color:var(--t3)}
.dark .mod-ov{background:var(--modal-bg);backdrop-filter:blur(8px)}
.dark .mod{background:var(--card);border:1px solid var(--border);box-shadow:0 24px 64px rgba(0,0,0,.45)}
.dark .mod-h{border-bottom-color:var(--border)}
.dark .mod-h h3{color:var(--txt)}
.dark .mod-f{border-top-color:var(--border)}
.dark .fld label{color:var(--t2)}
.dark .fld input,.dark .fld textarea,.dark .fld select{background:var(--input-bg);border-color:var(--border);color:var(--txt)}
.dark .fld input:focus,.dark .fld textarea:focus,.dark .fld select:focus{border-color:#818cf8;box-shadow:0 0 0 3px var(--focus-ring)}
.dark .fld input::placeholder,.dark .fld textarea::placeholder{color:var(--t3)}
.dark .btn-gh{border-color:var(--border);color:var(--t2)}
.dark .btn-gh:hover{background:var(--hover);color:var(--txt)}
.dark .pal-d.sel{border-color:var(--txt)}
.dark .cta-sec{background:linear-gradient(180deg,var(--bg),#12141b)}
.dark .cta-sec h2{color:var(--txt)}
.dark .cta-sec p{color:var(--t2)}
.dark .btn-d{background:var(--txt);color:var(--bg)}
.dark .btn-d:hover{box-shadow:0 8px 28px rgba(0,0,0,.3)}
.dark ::-webkit-scrollbar-thumb{background:var(--border)}

@media(max-width:640px){.stats{flex-direction:column;gap:20px}.mets{grid-template-columns:repeat(2,1fr)}.hdr{padding:10px 14px}.dash{padding:20px 14px}.proj-page{padding:28px 14px}.tabs{overflow-x:auto}}
`;

function Logo({ palette = "indigo", size = 34 }) {
  return (
    <div className="logo" style={{ width: size, height: size, background: (PALETTES[palette] || PALETTES.indigo).grad }}>
      <svg width={size * .55} height={size * .55} viewBox="0 0 24 24" fill="none">
        <circle cx="7" cy="7" r="2.8" fill="white" opacity=".9" />
        <circle cx="17" cy="7" r="2.8" fill="white" opacity=".9" />
        <circle cx="12" cy="17" r="2.8" fill="white" opacity=".9" />
        <line x1="9.5" y1="8.5" x2="14.5" y2="8.5" stroke="white" strokeWidth="1.4" opacity=".45" />
        <line x1="8.5" y1="9.5" x2="10.5" y2="15" stroke="white" strokeWidth="1.4" opacity=".45" />
        <line x1="15.5" y1="9.5" x2="13.5" y2="15" stroke="white" strokeWidth="1.4" opacity=".45" />
      </svg>
    </div>
  );
}

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="mo" onClick={onClose}>
      <div className="mod" onClick={(e) => e.stopPropagation()}>
        <div className="mod-h"><h2>{title}</h2><button className="mod-x" onClick={onClose}><I.x size={15} /></button></div>
        <div className="mod-b">{children}</div>
        {footer && <div className="mod-f">{footer}</div>}
      </div>
    </div>
  );
}

function NewProjectModal({ onClose, onSave }) {
  const [f, setF] = useState({ name: "", description: "", palette: "indigo", totalWeeks: 8 });
  const s = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Modal title="New Project" onClose={onClose} footer={<>
      <button className="btn-gh" onClick={onClose}>Cancel</button>
      <button className="btn-sub" style={{ background: PALETTES[f.palette].primary }} disabled={!f.name.trim()} onClick={() => f.name.trim() && onSave(f)}>Create project</button>
    </>}>
      <div className="fld"><label>Project name</label><input value={f.name} onChange={(e) => s("name", e.target.value)} placeholder="e.g. Mobile App Redesign" autoFocus /></div>
      <div className="fld"><label>Description</label><textarea value={f.description} onChange={(e) => s("description", e.target.value)} placeholder="What problem does this solve?" rows={3} /></div>
      <div className="fld"><label>Timeline (weeks)</label><input type="number" min={1} max={52} value={f.totalWeeks} onChange={(e) => s("totalWeeks", parseInt(e.target.value) || 8)} /></div>
      <div className="fld"><label>Color theme</label>
        <div className="pal-pk">{Object.entries(PALETTES).map(([k, v]) => <div key={k} className={`pal-d ${f.palette === k ? "sel" : ""}`} style={{ background: v.grad }} onClick={() => s("palette", k)} />)}</div>
      </div>
    </Modal>
  );
}

function AddUpdateModal({ onClose, onSave, pal }) {
  const [f, setF] = useState({ title: "", body: "", status: "on-track", type: "update" });
  const s = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const p = PALETTES[pal] || PALETTES.indigo;
  return (
    <Modal title="Add Update" onClose={onClose} footer={<>
      <button className="btn-gh" onClick={onClose}>Cancel</button>
      <button className="btn-sub" style={{ background: p.primary }} disabled={!f.title.trim()} onClick={() => f.title.trim() && onSave({ ...f, id: uid(), date: new Date().toISOString().split("T")[0], author: "You" })}>Post update</button>
    </>}>
      <div className="fld"><label>Title</label><input value={f.title} onChange={(e) => s("title", e.target.value)} placeholder="What happened?" autoFocus /></div>
      <div className="fld"><label>Details</label><textarea value={f.body} onChange={(e) => s("body", e.target.value)} placeholder="Add context..." /></div>
      <div style={{ display: "flex", gap: 14 }}>
        <div className="fld" style={{ flex: 1 }}><label>Status</label><select value={f.status} onChange={(e) => s("status", e.target.value)}><option value="on-track">On Track</option><option value="at-risk">At Risk</option><option value="blocked">Blocked</option><option value="completed">Completed</option></select></div>
        <div className="fld" style={{ flex: 1 }}><label>Type</label><select value={f.type} onChange={(e) => s("type", e.target.value)}><option value="update">Update</option><option value="milestone">Milestone</option><option value="blocker">Blocker</option></select></div>
      </div>
    </Modal>
  );
}

function AddDecisionModal({ onClose, onSave, pal }) {
  const [f, setF] = useState({ title: "", rationale: "", decidedBy: "", alternatives: "", impact: "medium" });
  const s = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const p = PALETTES[pal] || PALETTES.indigo;
  return (
    <Modal title="Log Decision" onClose={onClose} footer={<>
      <button className="btn-gh" onClick={onClose}>Cancel</button>
      <button className="btn-sub" style={{ background: p.primary }} disabled={!f.title.trim()} onClick={() => f.title.trim() && onSave({ ...f, id: uid(), date: new Date().toISOString().split("T")[0], status: "approved", alternatives: f.alternatives.split(",").map((x) => x.trim()).filter(Boolean) })}>Log decision</button>
    </>}>
      <div className="fld"><label>Decision</label><input value={f.title} onChange={(e) => s("title", e.target.value)} placeholder="What was decided?" autoFocus /></div>
      <div className="fld"><label>Rationale</label><textarea value={f.rationale} onChange={(e) => s("rationale", e.target.value)} placeholder="Why this choice?" /></div>
      <div className="fld"><label>Decided by</label><input value={f.decidedBy} onChange={(e) => s("decidedBy", e.target.value)} placeholder="e.g. PM + Engineering" /></div>
      <div className="fld"><label>Alternatives (comma-separated)</label><input value={f.alternatives} onChange={(e) => s("alternatives", e.target.value)} placeholder="Option A, Option B" /></div>
      <div className="fld"><label>Impact</label><select value={f.impact} onChange={(e) => s("impact", e.target.value)}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
    </Modal>
  );
}

function AddActionModal({ onClose, onSave, pal }) {
  const [f, setF] = useState({ title: "", owner: "", dueDate: daysFromNow(7), priority: "medium", project: "" });
  const s = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const p = PALETTES[pal] || PALETTES.indigo;
  return (
    <Modal title="Add Action Item" onClose={onClose} footer={<>
      <button className="btn-gh" onClick={onClose}>Cancel</button>
      <button className="btn-sub" style={{ background: p.primary }} disabled={!f.title.trim()} onClick={() => f.title.trim() && onSave({ ...f, id: uid(), status: "todo" })}>Add action</button>
    </>}>
      <div className="fld"><label>Action item</label><input value={f.title} onChange={(e) => s("title", e.target.value)} placeholder="What needs to happen?" autoFocus /></div>
      <div style={{ display: "flex", gap: 14 }}>
        <div className="fld" style={{ flex: 1 }}><label>Owner</label><input value={f.owner} onChange={(e) => s("owner", e.target.value)} placeholder="Who's responsible?" /></div>
        <div className="fld" style={{ flex: 1 }}><label>Team</label><input value={f.project} onChange={(e) => s("project", e.target.value)} placeholder="e.g. Engineering" /></div>
      </div>
      <div style={{ display: "flex", gap: 14 }}>
        <div className="fld" style={{ flex: 1 }}><label>Due date</label><input type="date" value={f.dueDate} onChange={(e) => s("dueDate", e.target.value)} /></div>
        <div className="fld" style={{ flex: 1 }}><label>Priority</label><select value={f.priority} onChange={(e) => s("priority", e.target.value)}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
      </div>
    </Modal>
  );
}

function AddStakeholderModal({ onClose, onSave, pal }) {
  const [f, setF] = useState({ name: "", role: "", team: "" });
  const s = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const p = PALETTES[pal] || PALETTES.indigo;
  return (
    <Modal title="Add Stakeholder" onClose={onClose} footer={<>
      <button className="btn-gh" onClick={onClose}>Cancel</button>
      <button className="btn-sub" style={{ background: p.primary }} disabled={!f.name.trim()} onClick={() => f.name.trim() && onSave({ ...f, id: uid(), avatar: f.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(), syncStatus: "synced", lastActive: new Date().toISOString().split("T")[0] })}>Add stakeholder</button>
    </>}>
      <div className="fld"><label>Name</label><input value={f.name} onChange={(e) => s("name", e.target.value)} placeholder="Full name" autoFocus /></div>
      <div className="fld"><label>Role</label><input value={f.role} onChange={(e) => s("role", e.target.value)} placeholder="e.g. Engineering Lead" /></div>
      <div className="fld"><label>Team</label><input value={f.team} onChange={(e) => s("team", e.target.value)} placeholder="e.g. Engineering" /></div>
    </Modal>
  );
}

// ── Comment Thread ──
function CommentThread({ comments = [], onAdd, accentColor = "#6366f1" }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const count = comments.length;
  const avClrs = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981", "#06b6d4"];
  return (
    <div className="cmt-section">
      <button className="cmt-toggle" onClick={() => setOpen(!open)}>
        <I.msg size={12} /> {count > 0 ? `${count} comment${count !== 1 ? "s" : ""}` : "Add comment"} {open ? "▾" : "▸"}
      </button>
      {open && (
        <div style={{ marginTop: 8 }}>
          {comments.map((c, i) => (
            <div className="cmt" key={c.id}>
              <div className="cmt-av" style={{ background: avClrs[i % avClrs.length] }}>{(c.author || "?")[0].toUpperCase()}</div>
              <div className="cmt-body">
                <span className="cmt-author">{c.author}<span className="cmt-time">{fmt(c.date)}</span></span>
                <div className="cmt-text">{c.text}</div>
              </div>
            </div>
          ))}
          <div className="cmt-input">
            <input value={text} onChange={e => setText(e.target.value)} placeholder="Write a comment..." onKeyDown={e => { if (e.key === "Enter" && text.trim()) { onAdd(text); setText(""); } }} />
            <button className="cmt-send" style={{ background: accentColor }} disabled={!text.trim()} onClick={() => { if (text.trim()) { onAdd(text); setText(""); } }}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({ project: proj, onBack, onUpdate, onDelete, dark, toggleDark, user, onLogout }) {
  const [tab, setTab] = useState("overview");
  const [modal, setModal] = useState(null);
  const pal = PALETTES[proj.palette] || PALETTES.indigo;
  const pct = Math.round((proj.currentWeek / proj.totalWeeks) * 100);
  const onT = proj.updates.filter((u) => u.status === "on-track").length;
  const risk = proj.updates.filter((u) => u.status === "at-risk" || u.status === "blocked").length;
  const open = proj.actions.filter((a) => a.status !== "done").length;
  const od = proj.actions.filter((a) => a.status !== "done" && isOverdue(a.dueDate)).length;

  const addU = (u) => { onUpdate({ ...proj, updates: [u, ...proj.updates] }); setModal(null); };
  const addD = (d) => { onUpdate({ ...proj, decisions: [d, ...proj.decisions] }); setModal(null); };
  const addA = (a) => { onUpdate({ ...proj, actions: [...proj.actions, a] }); setModal(null); };
  const addS = (s) => { onUpdate({ ...proj, stakeholders: [...proj.stakeholders, s] }); setModal(null); };
  const togA = (id) => onUpdate({ ...proj, actions: proj.actions.map((a) => a.id === id ? { ...a, status: a.status === "done" ? "todo" : "done" } : a) });
  const delA = (id) => onUpdate({ ...proj, actions: proj.actions.filter((a) => a.id !== id) });

  // Comments
  const addComment = (type, itemId, text) => {
    if (!text.trim()) return;
    const comment = { id: uid(), author: user?.firstName || "You", text: text.trim(), date: new Date().toISOString().split("T")[0] };
    if (type === "update") {
      onUpdate({ ...proj, updates: proj.updates.map(u => u.id === itemId ? { ...u, comments: [...(u.comments || []), comment] } : u) });
    } else if (type === "decision") {
      onUpdate({ ...proj, decisions: proj.decisions.map(d => d.id === itemId ? { ...d, comments: [...(d.comments || []), comment] } : d) });
    }
  };

  // ── Health Score ──
  const totalU = proj.updates.length || 1;
  const timelineScore = Math.max(0, 100 - (risk / totalU) * 100);
  const actionScore = open === 0 ? 100 : Math.max(0, 100 - (od / open) * 150);
  const staleStakeholders = proj.stakeholders.filter(s => s.syncStatus === "needs-update").length;
  const stakeholderScore = proj.stakeholders.length === 0 ? 100 : Math.max(0, 100 - (staleStakeholders / proj.stakeholders.length) * 100);
  const healthScore = Math.round((timelineScore * .4 + actionScore * .35 + stakeholderScore * .25));
  const healthColor = healthScore >= 75 ? "#059669" : healthScore >= 50 ? "#d97706" : "#dc2626";
  const healthLabel = healthScore >= 75 ? "Healthy" : healthScore >= 50 ? "Needs Attention" : "At Risk";

  // ── AI Weekly Digest ──
  const generateDigest = () => {
    const recentUpdates = proj.updates.slice(0, 3);
    const overdueItems = proj.actions.filter(a => a.status !== "done" && isOverdue(a.dueDate));
    const recentDecisions = proj.decisions.slice(0, 2);
    const needsUpdate = proj.stakeholders.filter(s => s.syncStatus === "needs-update");
    let d = `📊 WEEKLY DIGEST — ${proj.name}\nWeek ${proj.currentWeek} of ${proj.totalWeeks} · Health Score: ${healthScore}/100 (${healthLabel})\n\n`;
    d += `🔄 KEY UPDATES\n`;
    if (recentUpdates.length === 0) d += `  No updates this week.\n`;
    else recentUpdates.forEach(u => { d += `  ${u.status === "at-risk" || u.status === "blocked" ? "⚠️" : "✓"} ${u.title} (${u.author})\n`; });
    if (overdueItems.length > 0) { d += `\n🚨 OVERDUE ACTIONS (${overdueItems.length})\n`; overdueItems.forEach(a => { d += `  → ${a.title} — ${a.owner} (due ${fmt(a.dueDate)})\n`; }); }
    if (recentDecisions.length > 0) { d += `\n⚖️ RECENT DECISIONS\n`; recentDecisions.forEach(dc => { d += `  ${dc.title}: ${dc.rationale.slice(0, 80)}...\n`; }); }
    if (needsUpdate.length > 0) { d += `\n👥 STAKEHOLDERS NEEDING SYNC\n`; needsUpdate.forEach(s => { d += `  ${s.name} (${s.role}) — last active ${fmt(s.lastActive)}\n`; }); }
    d += `\n—\nGenerated by SyncBase`;
    return d;
  };
  const [showDigest, setShowDigest] = useState(false);
  const [digestText, setDigestText] = useState("");

  const TABS = [{ k: "overview", l: "Overview", i: <I.bar size={13} /> }, { k: "timeline", l: "Timeline", i: <I.clock size={13} /> }, { k: "decisions", l: "Decisions", i: <I.file size={13} /> }, { k: "actions", l: "Actions", i: <I.target size={13} /> }, { k: "stakeholders", l: "Stakeholders", i: <I.users size={13} /> }, { k: "raci", l: "RACI", i: <I.shield size={13} /> }, { k: "settings", l: "Settings", i: <I.gear size={13} /> }];
  const avClr = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981", "#06b6d4"];

  return (
    <div className="app">
      <header className="hdr">
        <div className="hdr-l">
          <button className="back" onClick={onBack}><I.arrow size={13} /> Projects</button>
          <Logo palette={proj.palette} size={30} />
          <span className="logo-t">SyncBase</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {user && <UserMenu user={user} onLogout={onLogout} dark={dark} toggleDark={toggleDark} />}
        </div>
      </header>
      <div className="dash">
        <div className="dash-top">
          <div className="dash-st"><span style={{ width: 9, height: 9, borderRadius: "50%", background: STATUS_COLORS[proj.status] }} /><span style={{ color: STATUS_COLORS[proj.status] }}>{proj.status.replace("-", " ")}</span></div>
          <div className="dash-t">{proj.name}</div>
          <div className="dash-d">{proj.description}</div>
          <div className="prog"><div className="prog-bar"><div className="prog-fill" style={{ width: `${pct}%`, background: pal.grad }} /></div><div className="prog-txt">Week {proj.currentWeek} of {proj.totalWeeks} · {pct}% complete</div></div>
        </div>

        <div className="mets">
          {[{ l: "Timeline", v: `${proj.currentWeek}/${proj.totalWeeks}`, s: "weeks", c: pal.primary }, { l: "On Track", v: onT, s: "updates", c: "#059669" }, { l: "At Risk", v: risk, s: "items", c: risk > 0 ? "#d97706" : "#059669" }, { l: "Open Actions", v: open, s: od > 0 ? `${od} overdue` : "on schedule", c: od > 0 ? "#dc2626" : pal.primary }].map((m, i) => (
            <div className="met" key={i} style={{ animationDelay: `${i * .05}s` }}><div className="met-l">{m.l}</div><div className="met-v" style={{ color: m.c }}>{m.v}</div><div className="met-s">{m.s}</div></div>
          ))}
        </div>

        <div className="tabs">{TABS.map((t) => <button key={t.k} className={`tab ${tab === t.k ? "on" : ""}`} onClick={() => setTab(t.k)}>{t.i} {t.l}</button>)}</div>

        {tab === "overview" && <div style={{ animation: "fu .35s ease both" }}>
          {/* Health Score */}
          <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, marginBottom: 20 }}>
            <div style={{ background: "var(--card)", border: "1px solid var(--bl)", borderRadius: "var(--r)", padding: 28, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--t3)", marginBottom: 10 }}>Project Health</div>
              <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 12px" }}>
                <svg viewBox="0 0 120 120" width="120" height="120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bl)" strokeWidth="8" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke={healthColor} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${healthScore * 3.27} 327`} transform="rotate(-90 60 60)"
                    style={{ transition: "stroke-dasharray .8s ease" }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "var(--fm)", fontSize: 28, fontWeight: 700, color: healthColor }}>{healthScore}</span>
                  <span style={{ fontSize: 10, color: "var(--t3)" }}>/100</span>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: healthColor }}>{healthLabel}</div>
              <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 6 }}>Timeline {Math.round(timelineScore)}% · Actions {Math.round(actionScore)}% · Sync {Math.round(stakeholderScore)}%</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { l: "Timeline Progress", v: `${pct}%`, s: `Week ${proj.currentWeek} of ${proj.totalWeeks}`, c: pal.primary },
                { l: "Updates On Track", v: `${onT}/${totalU}`, s: risk > 0 ? `${risk} at risk` : "all clear", c: risk > 0 ? "#d97706" : "#059669" },
                { l: "Action Completion", v: `${proj.actions.filter(a => a.status === "done").length}/${proj.actions.length}`, s: od > 0 ? `${od} overdue` : "on schedule", c: od > 0 ? "#dc2626" : "#059669" },
                { l: "Stakeholder Sync", v: `${proj.stakeholders.filter(s => s.syncStatus === "synced").length}/${proj.stakeholders.length}`, s: staleStakeholders > 0 ? `${staleStakeholders} need update` : "all synced", c: staleStakeholders > 0 ? "#d97706" : "#059669" },
              ].map((m, i) => (
                <div key={i} style={{ background: "var(--card)", border: "1px solid var(--bl)", borderRadius: "var(--r)", padding: "18px 20px", borderLeft: `3px solid ${m.c}` }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--t3)", marginBottom: 6 }}>{m.l}</div>
                  <div style={{ fontFamily: "var(--fm)", fontSize: 24, fontWeight: 700, color: m.c }}>{m.v}</div>
                  <div style={{ fontSize: 12, color: "var(--t2)", marginTop: 4 }}>{m.s}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Weekly Digest */}
          <div style={{ background: "var(--card)", border: "1px solid var(--bl)", borderRadius: "var(--r)", padding: 22, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showDigest ? 16 : 0 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <I.zap size={16} color={pal.primary} />
                  <span style={{ fontWeight: 600, fontSize: 15 }}>AI Weekly Digest</span>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, background: `${pal.primary}14`, color: pal.primary, fontWeight: 600 }}>NEW</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 3 }}>Auto-generated stakeholder summary you can share directly</div>
              </div>
              <button className="add" onClick={() => { setDigestText(generateDigest()); setShowDigest(!showDigest); }}><I.zap size={13} /> {showDigest ? "Hide" : "Generate"} Digest</button>
            </div>
            {showDigest && (
              <div style={{ animation: "fu .3s ease both" }}>
                <pre style={{ fontFamily: "'Aptos', 'Segoe UI', sans-serif", fontSize: 12, lineHeight: 1.7, background: "var(--digest-bg)", color: "var(--digest-txt)", padding: 20, borderRadius: "var(--rs)", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 340, overflowY: "auto", border: "1px solid var(--border)" }}>{digestText}</pre>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button className="add" onClick={() => { navigator.clipboard?.writeText(digestText); }}><I.file size={13} /> Copy to clipboard</button>
                </div>
              </div>
            )}
          </div>

          {/* Quick glance: Recent + Urgent */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "var(--card)", border: "1px solid var(--bl)", borderRadius: "var(--r)", padding: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Recent Updates</div>
              {proj.updates.slice(0, 3).map((u) => (
                <div key={u.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid var(--bl)" }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLORS[u.status], marginTop: 6, flexShrink: 0 }} />
                  <div><div style={{ fontSize: 13, fontWeight: 500 }}>{u.title}</div><div style={{ fontSize: 11, color: "var(--t3)" }}>{u.author} · {fmt(u.date)}</div></div>
                </div>
              ))}
              {proj.updates.length === 0 && <div style={{ fontSize: 12, color: "var(--t3)", textAlign: "center", padding: 16 }}>No updates yet</div>}
            </div>
            <div style={{ background: "var(--card)", border: "1px solid var(--bl)", borderRadius: "var(--r)", padding: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Urgent Actions</div>
              {proj.actions.filter(a => a.status !== "done" && (a.priority === "high" || isOverdue(a.dueDate))).slice(0, 4).map((a) => {
                const ov = isOverdue(a.dueDate);
                return (
                  <div key={a.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid var(--bl)" }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: ov ? "#dc2626" : PRIORITY_COLORS[a.priority], marginTop: 6, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{a.title}</div>
                      <div style={{ fontSize: 11, color: "var(--t3)" }}>{a.owner} · {ov ? <span style={{ color: "#dc2626", fontWeight: 600 }}>Overdue</span> : `Due ${fmt(a.dueDate)}`}</div>
                    </div>
                  </div>
                );
              })}
              {proj.actions.filter(a => a.status !== "done" && (a.priority === "high" || isOverdue(a.dueDate))).length === 0 && <div style={{ fontSize: 12, color: "var(--t3)", textAlign: "center", padding: 16 }}>No urgent actions</div>}
            </div>
          </div>
        </div>}

        {tab === "timeline" && <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}><button className="add" onClick={() => setModal("update")}><I.plus size={13} /> Add update</button></div>
          {proj.updates.length === 0 ? <div className="empty"><I.msg size={28} color="var(--t3)" /><p>No updates yet</p></div> :
            proj.updates.map((u, i) => (
              <div className="tl" key={u.id} style={{ animationDelay: `${i * .04}s` }}>
                <div className="tl-dot" style={{ background: STATUS_COLORS[u.status] }} />
                <div className="tl-c">
                  <div className="tl-h">
                    <span className="tl-t">{u.title}</span>
                    <span className="tl-b" style={{ background: `${STATUS_COLORS[u.status]}18`, color: STATUS_COLORS[u.status] }}>{u.status.replace("-", " ")}</span>
                    {u.type !== "update" && <span className="tl-b" style={{ background: "var(--hover)", color: "var(--t2)" }}>{u.type}</span>}
                  </div>
                  <div className="tl-m">{u.author} · {fmtFull(u.date)}</div>
                  {u.body && <div className="tl-body">{u.body}</div>}
                  <CommentThread comments={u.comments} onAdd={(text) => addComment("update", u.id, text)} accentColor={pal.primary} />
                </div>
              </div>
            ))}
        </div>}

        {tab === "decisions" && <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}><button className="add" onClick={() => setModal("decision")}><I.plus size={13} /> Log decision</button></div>
          {proj.decisions.length === 0 ? <div className="empty"><I.file size={28} color="var(--t3)" /><p>No decisions logged</p></div> :
            proj.decisions.map((d, i) => (
              <div className="dec" key={d.id} style={{ animationDelay: `${i * .04}s` }}>
                <div className="dec-hdr"><span className="dec-t">{d.title}</span><span className="dec-imp" style={{ background: `${PRIORITY_COLORS[d.impact]}14`, color: PRIORITY_COLORS[d.impact] }}>{d.impact} impact</span></div>
                <div className="dec-m">{d.decidedBy} · {fmtFull(d.date)}</div>
                <div className="dec-sec"><div className="dec-sl">Rationale</div><p>{d.rationale}</p></div>
                {d.alternatives?.length > 0 && <div className="dec-sec"><div className="dec-sl">Alternatives</div><div className="dec-alts">{d.alternatives.map((a, j) => <span className="dec-alt" key={j}>{a}</span>)}</div></div>}
                <CommentThread comments={d.comments} onAdd={(text) => addComment("decision", d.id, text)} accentColor={pal.primary} />
              </div>
            ))}
        </div>}

        {tab === "actions" && <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}><button className="add" onClick={() => setModal("action")}><I.plus size={13} /> Add action</button></div>
          {proj.actions.length === 0 ? <div className="empty"><I.target size={28} color="var(--t3)" /><p>No action items</p></div> :
            [...proj.actions].sort((a, b) => { if (a.status === "done" !== (b.status === "done")) return a.status === "done" ? 1 : -1; return new Date(a.dueDate) - new Date(b.dueDate); }).map((a, i) => {
              const dn = a.status === "done", ov = !dn && isOverdue(a.dueDate);
              return (
                <div className="act" key={a.id} style={{ animationDelay: `${i * .03}s`, opacity: dn ? .55 : 1 }}>
                  <div className={`act-ck ${dn ? "dn" : ""}`} onClick={() => togA(a.id)}>{dn && <I.check size={11} color="white" />}</div>
                  <div className="act-in"><div className={`act-t ${dn ? "dn" : ""}`}>{a.title}</div><div className="act-sub"><span>{a.owner}</span>{a.project && <span style={{ color: pal.primary }}>{a.project}</span>}</div></div>
                  <span className="act-pr" style={{ background: `${PRIORITY_COLORS[a.priority]}14`, color: PRIORITY_COLORS[a.priority] }}>{a.priority}</span>
                  <span className={`act-due ${ov ? "od" : ""}`}>{fmt(a.dueDate)}{ov && " !"}</span>
                  <button className="act-del" onClick={() => delA(a.id)} title="Remove"><I.trash size={13} /></button>
                </div>
              );
            })}
        </div>}

        {tab === "stakeholders" && <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}><button className="add" onClick={() => setModal("stakeholder")}><I.plus size={13} /> Add stakeholder</button></div>
          {proj.stakeholders.length === 0 ? <div className="empty"><I.users size={28} color="var(--t3)" /><p>No stakeholders added</p></div> :
            proj.stakeholders.map((s, i) => {
              const sc = s.syncStatus === "synced" ? "#059669" : "#d97706";
              return (
                <div className="sh" key={s.id} style={{ animationDelay: `${i * .05}s` }}>
                  <div className="sh-av" style={{ background: avClr[i % avClr.length] }}>{s.avatar}</div>
                  <div className="sh-in">
                    <div className="sh-n">{s.name}</div>
                    <div className="sh-r">{s.role} · {s.team}</div>
                    <div className="sh-sync" style={{ background: `${sc}14`, color: sc }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: sc }} />
                      {s.syncStatus === "synced" ? "Synced" : "Needs update"}
                      <span style={{ color: "var(--t3)", marginLeft: 3 }}>· {fmt(s.lastActive)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>}

        {tab === "raci" && <RaciTab proj={proj} pal={pal} onUpdate={onUpdate} />}

        {tab === "settings" && <SettingsTab proj={proj} pal={pal} onUpdate={onUpdate} onDelete={onDelete} onBack={onBack} />}
      </div>
      {modal === "update" && <AddUpdateModal pal={proj.palette} onClose={() => setModal(null)} onSave={addU} />}
      {modal === "decision" && <AddDecisionModal pal={proj.palette} onClose={() => setModal(null)} onSave={addD} />}
      {modal === "action" && <AddActionModal pal={proj.palette} onClose={() => setModal(null)} onSave={addA} />}
      {modal === "stakeholder" && <AddStakeholderModal pal={proj.palette} onClose={() => setModal(null)} onSave={addS} />}
    </div>
  );
}

// ── RACI Matrix ──
function RaciTab({ proj, pal, onUpdate }) {
  const [workstreams, setWorkstreams] = useState(proj.raci?.workstreams || [
    { id: uid(), name: "Product Strategy" },
    { id: uid(), name: "Technical Architecture" },
    { id: uid(), name: "User Research" },
    { id: uid(), name: "Launch & GTM" },
  ]);
  const [assignments, setAssignments] = useState(proj.raci?.assignments || {});
  const [newWs, setNewWs] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const RACI_VALS = ["", "R", "A", "C", "I"];
  const RACI_LABELS = { R: "Responsible", A: "Accountable", C: "Consulted", I: "Informed" };
  const RACI_COLORS = { R: "#6366f1", A: "#dc2626", C: "#d97706", I: "#059669" };
  const avClr = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981", "#06b6d4"];

  const getVal = (wsId, shId) => (assignments[`${wsId}-${shId}`] || "");
  const cycleVal = (wsId, shId) => {
    const cur = getVal(wsId, shId);
    const idx = RACI_VALS.indexOf(cur);
    const next = RACI_VALS[(idx + 1) % RACI_VALS.length];
    const newA = { ...assignments, [`${wsId}-${shId}`]: next };
    setAssignments(newA);
    setHasChanges(true);
  };

  const addWorkstream = () => {
    if (!newWs.trim()) return;
    setWorkstreams([...workstreams, { id: uid(), name: newWs.trim() }]);
    setNewWs("");
    setHasChanges(true);
  };

  const removeWorkstream = (id) => {
    setWorkstreams(workstreams.filter(w => w.id !== id));
    const newA = { ...assignments };
    Object.keys(newA).forEach(k => { if (k.startsWith(id + "-")) delete newA[k]; });
    setAssignments(newA);
    setHasChanges(true);
  };

  const saveRaci = () => {
    onUpdate({ ...proj, raci: { workstreams, assignments } });
    setHasChanges(false);
  };

  // Validation: check for workstreams missing an Accountable person
  const warnings = workstreams.filter(ws => {
    const hasA = proj.stakeholders.some(s => getVal(ws.id, s.id) === "A");
    return !hasA;
  });

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--txt)", marginBottom: 4 }}>RACI Matrix</h3>
          <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.5 }}>
            Define who is Responsible, Accountable, Consulted, and Informed for each workstream. Click a cell to cycle through roles.
          </p>
        </div>
        {hasChanges && (
          <button className="set-save" style={{ background: pal.grad }} onClick={saveRaci}>Save RACI</button>
        )}
      </div>

      {/* Legend */}
      <div className="raci-legend">
        {Object.entries(RACI_LABELS).map(([k, v]) => (
          <div className="raci-legend-item" key={k}>
            <div className="raci-legend-dot" style={{ background: `${RACI_COLORS[k]}15`, color: RACI_COLORS[k] }}>{k}</div>
            <span>{v}</span>
          </div>
        ))}
        <div className="raci-legend-item">
          <div className="raci-legend-dot" style={{ background: "var(--hover)", color: "var(--t3)" }}>–</div>
          <span>Not involved</span>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ padding: "10px 14px", borderRadius: "var(--rs)", background: "rgba(217,119,6,.08)", border: "1px solid rgba(217,119,6,.15)", marginBottom: 14, fontSize: 12.5, color: "#d97706", display: "flex", alignItems: "center", gap: 8 }}>
          <I.alert size={14} color="#d97706" />
          {warnings.length} workstream{warnings.length !== 1 ? "s" : ""} missing an Accountable (A) person: {warnings.map(w => w.name).join(", ")}
        </div>
      )}

      {proj.stakeholders.length === 0 ? (
        <div className="empty" style={{ padding: 40 }}>
          <I.users size={28} color="var(--t3)" />
          <p>Add stakeholders first to build your RACI matrix.</p>
        </div>
      ) : (
        <>
          <div className="raci-wrap">
            <table className="raci-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 180 }}>Workstream</th>
                  {proj.stakeholders.map((s, i) => (
                    <th className="raci-col" key={s.id}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: avClr[i % avClr.length], color: "#fff", fontSize: 10, fontWeight: 600 }}>{s.avatar}</div>
                        <span style={{ fontSize: 10, maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name.split(" ")[0]}</span>
                      </div>
                    </th>
                  ))}
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {workstreams.map((ws) => (
                  <tr key={ws.id}>
                    <td style={{ fontWeight: 500 }}>{ws.name}</td>
                    {proj.stakeholders.map((s) => {
                      const val = getVal(ws.id, s.id);
                      return (
                        <td className="raci-cell" key={s.id}>
                          <button className={`raci-btn ${val}`} onClick={() => cycleVal(ws.id, s.id)} title={val ? RACI_LABELS[val] : "Click to assign"}>
                            {val || "–"}
                          </button>
                        </td>
                      );
                    })}
                    <td>
                      <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t3)", padding: 4 }} onClick={() => removeWorkstream(ws.id)} title="Remove workstream"><I.x size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add workstream */}
          <div className="raci-add-row">
            <input className="raci-add-input" value={newWs} onChange={e => setNewWs(e.target.value)} placeholder="Add workstream (e.g. Data Pipeline, Security Review, Vendor Selection)" onKeyDown={e => e.key === "Enter" && addWorkstream()} />
            <button className="set-save" style={{ background: pal.grad }} onClick={addWorkstream} disabled={!newWs.trim()}>Add</button>
          </div>

          {/* Summary */}
          <div style={{ marginTop: 24, padding: 18, background: "var(--card)", border: "1px solid var(--bl)", borderRadius: "var(--r)" }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--txt)", marginBottom: 12 }}>Role Summary</div>
            {proj.stakeholders.map((s, i) => {
              const roles = workstreams.map(ws => ({ ws: ws.name, role: getVal(ws.id, s.id) })).filter(r => r.role);
              return (
                <div key={s.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid var(--bl)" }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: avClr[i % avClr.length], color: "#fff", fontSize: 10, fontWeight: 600, flexShrink: 0 }}>{s.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--txt)" }}>{s.name} <span style={{ fontWeight: 400, color: "var(--t3)", fontSize: 11 }}>· {s.role}</span></div>
                    {roles.length === 0 ? (
                      <div style={{ fontSize: 11.5, color: "var(--t3)", marginTop: 2 }}>No assignments yet</div>
                    ) : (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                        {roles.map((r, j) => (
                          <span key={j} style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 100, background: `${RACI_COLORS[r.role]}12`, color: RACI_COLORS[r.role], fontWeight: 500 }}>
                            {r.role} — {r.ws}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SettingsTab({ proj, pal: palProp, onUpdate, onDelete, onBack }) {
  const [name, setName] = useState(proj.name);
  const [desc, setDesc] = useState(proj.description);
  const [palette, setPalette] = useState(proj.palette);
  const [status, setStatus] = useState(proj.status);
  const [currentWeek, setCurrentWeek] = useState(proj.currentWeek);
  const [totalWeeks, setTotalWeeks] = useState(proj.totalWeeks);
  const [startDate, setStartDate] = useState(proj.startDate);
  const [endDate, setEndDate] = useState(proj.endDate);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newTag, setNewTag] = useState("");

  // Use selected palette for live preview
  const pal = PALETTES[palette] || PALETTES.indigo;

  // Tags — local state
  const [tags, setTags] = useState(proj.tags || []);

  // Stakeholders — local state for permissions & notif prefs
  const [stakeholders, setStakeholders] = useState(proj.stakeholders || []);

  // Sprint / Phase
  const sprintConfig = proj.sprintConfig || { type: "sprint", length: 2, currentSprint: 1, phases: [] };
  const [sprintType, setSprintType] = useState(sprintConfig.type);
  const [sprintLength, setSprintLength] = useState(sprintConfig.length);
  const [currentSprint, setCurrentSprint] = useState(sprintConfig.currentSprint);
  const [phases, setPhases] = useState(sprintConfig.phases || []);
  const [newPhase, setNewPhase] = useState("");

  // OKRs
  const [okrs, setOkrs] = useState(proj.okrs || []);
  const [newObj, setNewObj] = useState("");
  const [newKr, setNewKr] = useState({});

  // Integrations
  const integrations = proj.integrations || { slack: "", jira: "", gcal: false };
  const [slackUrl, setSlackUrl] = useState(integrations.slack);
  const [jiraUrl, setJiraUrl] = useState(integrations.jira);
  const [gcal, setGcal] = useState(integrations.gcal);

  const hasChanges = name !== proj.name || desc !== proj.description || palette !== proj.palette || status !== proj.status || currentWeek !== proj.currentWeek || totalWeeks !== proj.totalWeeks || startDate !== proj.startDate || endDate !== proj.endDate || JSON.stringify(tags) !== JSON.stringify(proj.tags || []) || JSON.stringify(stakeholders) !== JSON.stringify(proj.stakeholders || []) || sprintType !== sprintConfig.type || parseInt(sprintLength) !== sprintConfig.length || parseInt(currentSprint) !== sprintConfig.currentSprint || JSON.stringify(phases) !== JSON.stringify(sprintConfig.phases || []) || JSON.stringify(okrs) !== JSON.stringify(proj.okrs || []) || slackUrl !== integrations.slack || jiraUrl !== integrations.jira || gcal !== integrations.gcal;

  const saveAll = (extra = {}) => {
    onUpdate({ ...proj, name: name.trim() || proj.name, description: desc, palette, status, currentWeek: parseInt(currentWeek) || proj.currentWeek, totalWeeks: parseInt(totalWeeks) || proj.totalWeeks, startDate, endDate, tags, stakeholders, sprintConfig: { type: sprintType, length: parseInt(sprintLength) || 2, currentSprint: parseInt(currentSprint) || 1, phases }, okrs, integrations: { slack: slackUrl, jira: jiraUrl, gcal }, ...extra });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const addTag = () => { if (newTag.trim() && !tags.includes(newTag.trim())) { setTags([...tags, newTag.trim()]); setNewTag(""); } };
  const removeTag = (t) => setTags(tags.filter(x => x !== t));

  const updatePermission = (id, perm) => setStakeholders(stakeholders.map(s => s.id === id ? { ...s, permission: perm } : s));
  const updateNotifyPref = (id, pref) => setStakeholders(stakeholders.map(s => s.id === id ? { ...s, notifyPref: pref } : s));

  const addPhase = () => { if (newPhase.trim()) { setPhases([...phases, { id: uid(), name: newPhase.trim(), status: "pending" }]); setNewPhase(""); } };
  const removePhase = (id) => setPhases(phases.filter(p => p.id !== id));
  const cyclePhaseStatus = (id) => { const order = ["pending", "active", "completed"]; setPhases(phases.map(p => p.id === id ? { ...p, status: order[(order.indexOf(p.status) + 1) % order.length] } : p)); };

  const addOkr = () => { if (newObj.trim()) { setOkrs([...okrs, { id: uid(), objective: newObj.trim(), keyResults: [] }]); setNewObj(""); } };
  const removeOkr = (id) => setOkrs(okrs.filter(o => o.id !== id));
  const addKeyResult = (okrId) => { const t = newKr[okrId]; if (t?.trim()) { setOkrs(okrs.map(o => o.id === okrId ? { ...o, keyResults: [...o.keyResults, { id: uid(), title: t.trim(), progress: 0 }] } : o)); setNewKr({ ...newKr, [okrId]: "" }); } };
  const updateKrProgress = (okrId, krId, val) => setOkrs(okrs.map(o => o.id === okrId ? { ...o, keyResults: o.keyResults.map(kr => kr.id === krId ? { ...kr, progress: Math.min(100, Math.max(0, parseInt(val) || 0)) } : kr) } : o));
  const removeKr = (okrId, krId) => setOkrs(okrs.map(o => o.id === okrId ? { ...o, keyResults: o.keyResults.filter(kr => kr.id !== krId) } : o));

  const exportCSV = () => {
    try {
      let csv = "Type,Title,Status,Owner,Date,Details\n";
      (proj.updates || []).forEach(u => csv += `Update,"${(u.title || '').replace(/"/g, '""')}",${u.status || ''},"${(u.author || '').replace(/"/g, '""')}",${u.date || ''},"${(u.body || '').replace(/"/g, '""')}"\n`);
      (proj.decisions || []).forEach(d => csv += `Decision,"${(d.title || '').replace(/"/g, '""')}",${d.status || ''},"${(d.decidedBy || '').replace(/"/g, '""')}",${d.date || ''},"${(d.rationale || '').replace(/"/g, '""')}"\n`);
      (proj.actions || []).forEach(a => csv += `Action,"${(a.title || '').replace(/"/g, '""')}",${a.status || ''},"${(a.owner || '').replace(/"/g, '""')}",${a.dueDate || ''},${a.priority || ''}\n`);
      const dataUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
      const link = document.createElement("a");
      link.setAttribute("href", dataUri);
      link.setAttribute("download", `${(proj.name || "project").replace(/\s+/g, "_")}_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      navigator.clipboard?.writeText && navigator.clipboard.writeText("Export failed — data copied to clipboard instead."); 
    }
  };

  const exportJSON = () => {
    try {
      const data = JSON.stringify(proj, null, 2);
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(data);
      const link = document.createElement("a");
      link.setAttribute("href", dataUri);
      link.setAttribute("download", `${(proj.name || "project").replace(/\s+/g, "_")}_backup.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      navigator.clipboard?.writeText && navigator.clipboard.writeText(JSON.stringify(proj, null, 2));
    }
  };

  const saveAsTemplate = () => {
    const template = { ...proj, id: uid(), name: `${proj.name} (Template)`, updates: [], decisions: [], actions: [], stakeholders: proj.stakeholders.map(s => ({ ...s, id: uid() })), status: "not-started", currentWeek: 1 };
    // We save it through onUpdate's parent by creating a new project
    // For now, copy to clipboard as JSON
    navigator.clipboard?.writeText(JSON.stringify(template, null, 2));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const SectionBox = ({ icon, iconBg, iconColor, title, badge, danger, children }) => (
    <div className={`set-sec ${danger ? "set-danger" : ""}`}>
      <div className="set-sec-h">
        <div className="set-ico" style={{ background: iconBg, color: iconColor }}>{icon}</div>
        <h3 style={danger ? { color: "#dc2626" } : undefined}>{title}</h3>
        {badge && <span className="set-badge" style={{ marginLeft: "auto" }}>{badge}</span>}
      </div>
      <div className="set-sec-b">{children}</div>
    </div>
  );

  const Row = ({ title, desc, children }) => (
    <div className="set-row">
      <div className="set-row-l"><h4>{title}</h4>{desc && <p>{desc}</p>}</div>
      <div className="set-row-r">{children}</div>
    </div>
  );

  const phaseStatusColors = { pending: "var(--t3)", active: "#d97706", completed: "#059669" };
  const permColors = { contributor: "#6366f1", viewer: "#059669", admin: "#dc2626" };
  const notifLabels = { all: "All updates", weekly: "Weekly digest", tagged: "When tagged" };
  const avClr = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981", "#06b6d4"];

  return (
    <div style={{ maxWidth: 740 }}>
      {/* ─── 1. Project Information ─── */}
      <SectionBox icon={<I.file size={16} />} iconBg={`${pal.primary}14`} iconColor={pal.primary} title="Project Information">
        <Row title="Project Name" desc="Display name across all views">
          <input className="set-input" value={name} onChange={e => setName(e.target.value)} />
        </Row>
        <Row title="Description" desc="Brief summary on project cards">
          <input className="set-input" value={desc} onChange={e => setDesc(e.target.value)} />
        </Row>
        <Row title="Color Theme" desc="Visual identity for this project">
          <div className="pal-pk">{Object.entries(PALETTES).map(([k, v]) => <div key={k} className={`pal-d ${palette === k ? "sel" : ""}`} style={{ background: v.grad, width: 28, height: 28 }} onClick={() => setPalette(k)} />)}</div>
        </Row>
        <Row title="Project Status" desc="Overall health indicator">
          <select className="set-select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="not-started">Not Started</option><option value="on-track">On Track</option><option value="at-risk">At Risk</option><option value="blocked">Blocked</option><option value="completed">Completed</option>
          </select>
        </Row>
      </SectionBox>

      {/* ─── 2. Custom Tags & Labels ─── */}
      <SectionBox icon={<I.tag size={16} />} iconBg="rgba(99,102,241,.1)" iconColor="#6366f1" title="Tags & Labels">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: tags.length > 0 ? 14 : 0 }}>
          {tags.map(t => (
            <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 100, background: `${pal.primary}14`, color: pal.primary, fontSize: 12, fontWeight: 500 }}>
              {t}
              <span style={{ cursor: "pointer", opacity: .6, fontSize: 14, lineHeight: 1 }} onClick={() => removeTag(t)}>&times;</span>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="set-input" style={{ flex: 1 }} value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Add tag (e.g. Q2 Launch, Revenue Critical)" onKeyDown={e => e.key === "Enter" && addTag()} />
          <button className="set-save" style={{ background: pal.grad }} onClick={addTag} disabled={!newTag.trim()}>Add</button>
        </div>
      </SectionBox>

      {/* ─── 3. Access Permissions ─── */}
      <SectionBox icon={<I.shield size={16} />} iconBg="rgba(5,150,105,.1)" iconColor="#059669" title="Access Permissions">
        {stakeholders.length === 0 ? <p style={{ fontSize: 12.5, color: "var(--t3)" }}>Add stakeholders first to manage permissions.</p> :
          stakeholders.map((s, i) => (
            <div className="set-row" key={s.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: avClr[i % avClr.length], color: "#fff", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{s.avatar}</div>
                <div><h4 style={{ fontSize: 13 }}>{s.name}</h4><p style={{ fontSize: 11 }}>{s.role}</p></div>
              </div>
              <select className="set-select" value={s.permission || "viewer"} onChange={e => updatePermission(s.id, e.target.value)} style={{ width: 130 }}>
                <option value="viewer">Viewer</option><option value="contributor">Contributor</option><option value="admin">Admin</option>
              </select>
            </div>
          ))
        }
      </SectionBox>

      {/* ─── 4. Notification Preferences ─── */}
      <SectionBox icon={<I.msg size={16} />} iconBg="rgba(139,92,246,.1)" iconColor="#8b5cf6" title="Notification Preferences">
        <p style={{ fontSize: 12.5, color: "var(--t2)", marginBottom: 14, lineHeight: 1.6 }}>Control how often each stakeholder receives project updates. Reduces noise for busy stakeholders while keeping key contributors in the loop.</p>
        {stakeholders.length === 0 ? <p style={{ fontSize: 12.5, color: "var(--t3)" }}>Add stakeholders first.</p> :
          stakeholders.map((s, i) => (
            <div className="set-row" key={s.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: avClr[i % avClr.length], color: "#fff", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{s.avatar}</div>
                <div><h4 style={{ fontSize: 13 }}>{s.name}</h4><p style={{ fontSize: 11 }}>{s.role} · {s.team}</p></div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {["all", "weekly", "tagged"].map(pref => (
                  <button key={pref} onClick={() => updateNotifyPref(s.id, pref)} style={{
                    padding: "4px 10px", borderRadius: 100, border: `1px solid ${(s.notifyPref || "all") === pref ? "#8b5cf6" : "var(--border)"}`,
                    background: (s.notifyPref || "all") === pref ? "rgba(139,92,246,.1)" : "transparent",
                    color: (s.notifyPref || "all") === pref ? "#8b5cf6" : "var(--t3)",
                    fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "var(--f)", transition: "var(--tr)"
                  }}>{notifLabels[pref]}</button>
                ))}
              </div>
            </div>
          ))
        }
      </SectionBox>

      {/* ─── 5. Sprint / Phase Configuration ─── */}
      <SectionBox icon={<I.clock size={16} />} iconBg="rgba(217,119,6,.1)" iconColor="#d97706" title="Sprint / Phase Configuration">
        <Row title="Methodology" desc="How your team organizes work">
          <div style={{ display: "flex", gap: 4 }}>
            {["sprint", "phase", "continuous"].map(t => (
              <button key={t} onClick={() => setSprintType(t)} style={{
                padding: "5px 14px", borderRadius: 100, border: `1px solid ${sprintType === t ? "#d97706" : "var(--border)"}`,
                background: sprintType === t ? "rgba(217,119,6,.1)" : "transparent",
                color: sprintType === t ? "#d97706" : "var(--t3)",
                fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "var(--f)", textTransform: "capitalize"
              }}>{t}</button>
            ))}
          </div>
        </Row>
        {sprintType === "sprint" && <>
          <Row title="Sprint Length" desc="Duration in weeks">
            <input className="set-input" type="number" min="1" max="8" value={sprintLength} onChange={e => setSprintLength(e.target.value)} style={{ width: 80 }} />
          </Row>
          <Row title="Current Sprint" desc="Which sprint you're in">
            <input className="set-input" type="number" min="1" value={currentSprint} onChange={e => setCurrentSprint(e.target.value)} style={{ width: 80 }} />
          </Row>
        </>}
        {sprintType === "phase" && <>
          <div style={{ marginBottom: 12 }}>
            {phases.map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--bl)" }}>
                <span style={{ fontFamily: "var(--fm)", fontSize: 11, color: "var(--t3)", width: 20 }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                <button onClick={() => cyclePhaseStatus(p.id)} style={{ padding: "3px 10px", borderRadius: 100, border: "none", background: `${phaseStatusColors[p.status]}18`, color: phaseStatusColors[p.status], fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "var(--f)", textTransform: "capitalize" }}>{p.status}</button>
                <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t3)", padding: 2 }} onClick={() => removePhase(p.id)}><I.x size={12} /></button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="set-input" style={{ flex: 1 }} value={newPhase} onChange={e => setNewPhase(e.target.value)} placeholder="Add phase (e.g. Discovery, Design, Build, Launch)" onKeyDown={e => e.key === "Enter" && addPhase()} />
            <button className="set-save" style={{ background: "linear-gradient(135deg, #d97706, #ea580c)" }} onClick={addPhase} disabled={!newPhase.trim()}>Add</button>
          </div>
        </>}
        <Row title="Timeline" desc="Current and total weeks">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--t3)" }}>Week</span>
            <input className="set-input" type="number" min="1" max={totalWeeks} value={currentWeek} onChange={e => setCurrentWeek(e.target.value)} style={{ width: 60 }} />
            <span style={{ fontSize: 11, color: "var(--t3)" }}>of</span>
            <input className="set-input" type="number" min="1" value={totalWeeks} onChange={e => setTotalWeeks(e.target.value)} style={{ width: 60 }} />
          </div>
        </Row>
        <Row title="Dates" desc="Start and end dates">
          <div style={{ display: "flex", gap: 8 }}>
            <input className="set-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: 140 }} />
            <span style={{ color: "var(--t3)", fontSize: 12, alignSelf: "center" }}>→</span>
            <input className="set-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: 140 }} />
          </div>
        </Row>
      </SectionBox>

      {/* ─── 6. Success Criteria & OKRs ─── */}
      <SectionBox icon={<I.star size={16} />} iconBg="rgba(245,158,11,.1)" iconColor="#f59e0b" title="Success Criteria & OKRs">
        <p style={{ fontSize: 12.5, color: "var(--t2)", marginBottom: 14, lineHeight: 1.6 }}>Define what success looks like. Link project work to measurable outcomes so you're tracking progress toward results, not just outputs.</p>
        {okrs.map((okr, oi) => (
          <div key={okr.id} style={{ marginBottom: 16, padding: 16, borderRadius: "var(--rs)", background: "var(--hover)", border: "1px solid var(--bl)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--txt)" }}>O: {okr.objective}</div>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t3)" }} onClick={() => removeOkr(okr.id)}><I.trash size={13} /></button>
            </div>
            {okr.keyResults.map(kr => {
              const barColor = kr.progress >= 70 ? "#059669" : kr.progress >= 40 ? "#d97706" : "#dc2626";
              return (
                <div key={kr.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderTop: "1px solid var(--bl)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, color: "var(--t2)", marginBottom: 4 }}>{kr.title}</div>
                    <div style={{ height: 5, borderRadius: 3, background: "var(--bl)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 3, width: `${kr.progress}%`, background: barColor, transition: "width .4s ease" }} />
                    </div>
                  </div>
                  <input className="set-input" type="number" min="0" max="100" value={kr.progress} onChange={e => updateKrProgress(okr.id, kr.id, e.target.value)} style={{ width: 56, textAlign: "center", fontSize: 12 }} />
                  <span style={{ fontSize: 11, color: "var(--t3)" }}>%</span>
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t3)" }} onClick={() => removeKr(okr.id, kr.id)}><I.x size={12} /></button>
                </div>
              );
            })}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input className="set-input" style={{ flex: 1 }} value={newKr[okr.id] || ""} onChange={e => setNewKr({ ...newKr, [okr.id]: e.target.value })} placeholder="Add key result" onKeyDown={e => e.key === "Enter" && addKeyResult(okr.id)} />
              <button className="set-save" style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)", fontSize: 11, padding: "5px 12px" }} onClick={() => addKeyResult(okr.id)} disabled={!(newKr[okr.id] || "").trim()}>+ KR</button>
            </div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8 }}>
          <input className="set-input" style={{ flex: 1 }} value={newObj} onChange={e => setNewObj(e.target.value)} placeholder="Add objective (e.g. Increase mobile engagement by 40%)" onKeyDown={e => e.key === "Enter" && addOkr()} />
          <button className="set-save" style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)" }} onClick={addOkr} disabled={!newObj.trim()}>Add OKR</button>
        </div>
      </SectionBox>

      {/* ─── 7. Export & Reporting ─── */}
      <SectionBox icon={<I.download size={16} />} iconBg="rgba(236,72,153,.1)" iconColor="#ec4899" title="Export & Reporting">
        <p style={{ fontSize: 12.5, color: "var(--t2)", marginBottom: 14, lineHeight: 1.6 }}>Download project data for reporting, analysis, or backup. CSV works with Excel and Google Sheets. JSON preserves the full data structure for reimporting.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="add" onClick={exportCSV} style={{ gap: 6 }}><I.download size={13} /> Export CSV</button>
          <button className="add" onClick={exportJSON} style={{ gap: 6 }}><I.download size={13} /> Export JSON backup</button>
          <button className="add" onClick={saveAsTemplate} style={{ gap: 6 }}><I.archive size={13} /> Save as template (clipboard)</button>
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[{ l: "Updates", v: proj.updates.length }, { l: "Decisions", v: proj.decisions.length }, { l: "Actions", v: proj.actions.length }, { l: "Stakeholders", v: proj.stakeholders.length }].map((s, i) => (
              <div key={i} style={{ textAlign: "center", padding: "12px 8px", borderRadius: "var(--rs)", background: "var(--hover)", border: "1px solid var(--bl)" }}>
                <div style={{ fontFamily: "var(--fm)", fontSize: 20, fontWeight: 700, color: pal.primary }}>{s.v}</div>
                <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </SectionBox>

      {/* ─── 8. Integration Settings ─── */}
      <SectionBox icon={<I.globe size={16} />} iconBg="rgba(6,182,212,.1)" iconColor="#06b6d4" title="Integration Settings">
        <Row title="Slack Webhook URL" desc="Auto-post weekly digests to a Slack channel">
          <input className="set-input" value={slackUrl} onChange={e => setSlackUrl(e.target.value)} placeholder="https://hooks.slack.com/services/..." />
        </Row>
        <Row title="Jira Project URL" desc="Link to your Jira board for status sync reference">
          <input className="set-input" value={jiraUrl} onChange={e => setJiraUrl(e.target.value)} placeholder="https://yourteam.atlassian.net/..." />
        </Row>
        <Row title="Google Calendar" desc="Push action item deadlines to Google Calendar">
          <button onClick={() => setGcal(!gcal)} style={{
            padding: "5px 14px", borderRadius: 100, border: `1px solid ${gcal ? "#06b6d4" : "var(--border)"}`,
            background: gcal ? "rgba(6,182,212,.1)" : "transparent",
            color: gcal ? "#06b6d4" : "var(--t3)",
            fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "var(--f)"
          }}>{gcal ? "Enabled" : "Disabled"}</button>
        </Row>
      </SectionBox>

      {/* ─── 9. Archive & Templates ─── */}
      <SectionBox icon={<I.archive size={16} />} iconBg="rgba(244,63,94,.1)" iconColor="#f43f5e" title="Archive & Templates">
        <Row title="Archive project" desc="Hide from active list. Data is preserved and can be restored.">
          <button className="add" onClick={() => onUpdate({ ...proj, archived: !proj.archived })} style={{ gap: 6 }}>
            <I.archive size={13} /> {proj.archived ? "Unarchive" : "Archive"}
          </button>
        </Row>
        <Row title="Save as template" desc="Copy this project's structure (without data) as a reusable starting point.">
          <button className="add" onClick={saveAsTemplate} style={{ gap: 6 }}><I.folder size={13} /> Copy template to clipboard</button>
        </Row>
      </SectionBox>

      {/* ─── Save bar ─── */}
      {hasChanges && (
        <div style={{ position: "sticky", bottom: 16, display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: "var(--r)", background: "var(--card)", border: `1px solid ${pal.primary}40`, boxShadow: "0 -4px 20px rgba(0,0,0,.08)", animation: "fu .25s ease both", zIndex: 10 }}>
          <div style={{ flex: 1, fontSize: 13, color: pal.primary, fontWeight: 500 }}>You have unsaved changes</div>
          <button className="set-save" style={{ background: pal.grad }} onClick={() => saveAll()}>Save all changes</button>
        </div>
      )}
      {saved && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "12px 18px", borderRadius: "var(--r)", background: "rgba(5,150,105,.08)", border: "1px solid rgba(5,150,105,.2)", animation: "fu .25s ease both" }}>
          <I.check size={15} color="#059669" />
          <span style={{ fontSize: 13, color: "#059669", fontWeight: 500 }}>Changes saved</span>
        </div>
      )}

      {/* ─── Danger Zone ─── */}
      <SectionBox icon={<I.alert size={16} />} iconBg="rgba(220,38,38,.1)" iconColor="#dc2626" title="Danger Zone" danger>
        <Row title="Clear all project data" desc="Remove updates, decisions, actions, and stakeholders. Structure is kept.">
          <button className="btn-danger" onClick={() => onUpdate({ ...proj, updates: [], decisions: [], actions: [], stakeholders: [] })}>Clear data</button>
        </Row>
        <Row title="Delete this project" desc="Permanently remove this project. This cannot be undone.">
          <button className="btn-danger" onClick={() => setConfirmDelete(true)}>Delete project</button>
        </Row>
      </SectionBox>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="mod-ov" onClick={() => setConfirmDelete(false)}>
          <div className="mod" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="mod-h">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(220,38,38,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.alert size={18} color="#dc2626" /></div>
                <h3>Delete Project</h3>
              </div>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t3)" }} onClick={() => setConfirmDelete(false)}><I.x size={18} /></button>
            </div>
            <div className="mod-b">
              <p style={{ fontSize: 14, color: "var(--t2)", lineHeight: 1.6, marginBottom: 8 }}>
                Are you sure you want to delete <strong style={{ color: "var(--txt)" }}>{proj.name}</strong>?
              </p>
              <p style={{ fontSize: 13, color: "var(--t3)", lineHeight: 1.5 }}>
                This will permanently remove all {proj.updates?.length || 0} updates, {proj.decisions?.length || 0} decisions, {proj.actions?.length || 0} action items, and {proj.stakeholders?.length || 0} stakeholders. This action cannot be undone.
              </p>
            </div>
            <div className="mod-f">
              <button className="btn-gh" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="btn-danger" style={{ background: "#dc2626", color: "#fff", borderColor: "#dc2626" }} onClick={() => { setConfirmDelete(false); onDelete(proj.id); }}>Delete permanently</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectList({ projects, onSelect, onNew, onHome, dark, toggleDark, user, onLogout }) {
  const [viewMode, setViewMode] = useState("cards"); // cards | report
  const [showArchive, setShowArchive] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");

  const activeProjects = projects.filter(p => !p.archived);
  const archivedProjects = projects.filter(p => p.archived);

  // Collect all unique tags across projects
  const allTags = [...new Set(activeProjects.flatMap(p => p.tags || []))].sort();

  // Filter logic
  const filtered = activeProjects.filter(p => {
    const q = query.toLowerCase().trim();
    const matchesQuery = !q || p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q) || (p.tags || []).some(t => t.toLowerCase().includes(q)) || (p.stakeholders || []).some(s => s.name.toLowerCase().includes(q));
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesTag = tagFilter === "all" || (p.tags || []).includes(tagFilter);
    return matchesQuery && matchesStatus && matchesTag;
  });

  const isFiltering = query.trim() || statusFilter !== "all" || tagFilter !== "all";
  const clearFilters = () => { setQuery(""); setStatusFilter("all"); setTagFilter("all"); };

  const totalActions = projects.reduce((s, p) => s + (p.actions?.length || 0), 0);
  const openActions = projects.reduce((s, p) => s + (p.actions?.filter(a => a.status !== "done").length || 0), 0);
  const overdueActions = projects.reduce((s, p) => s + (p.actions?.filter(a => a.status !== "done" && isOverdue(a.dueDate)).length || 0), 0);
  const totalStakeholders = new Set(projects.flatMap(p => (p.stakeholders || []).map(s => s.name))).size;
  const atRiskCount = projects.filter(p => p.status === "at-risk" || p.status === "blocked").length;

  return (
    <div className="app">
      <header className="hdr">
        <div className="hdr-l"><Logo palette="indigo" size={30} /><span className="logo-t">SyncBase</span></div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {archivedProjects.length > 0 && (
            <button className="dm-tog" onClick={() => setShowArchive(!showArchive)} style={{ position: "relative" }}>
              <I.archive size={14} /> Archive
              <span style={{ background: "#6366f1", color: "#fff", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 100, marginLeft: 2 }}>{archivedProjects.length}</span>
            </button>
          )}
          {user && <UserMenu user={user} onLogout={onLogout} dark={dark} toggleDark={toggleDark} />}
        </div>
      </header>
      <div className="proj-page" style={{ maxWidth: 1060 }}>
        {/* Welcome + actions row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, animation: "fu .4s ease both" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em", color: "var(--txt)" }}>
              {user ? `Welcome, ${user.firstName}` : "Your Projects"}
            </h1>
            <p style={{ fontSize: 13.5, color: "var(--t2)", marginTop: 4 }}>
              {activeProjects.length} active project{activeProjects.length !== 1 ? "s" : ""} · {openActions} open action{openActions !== 1 ? "s" : ""}{overdueActions > 0 ? ` · ${overdueActions} overdue` : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div className="port-toggle">
              <button className={viewMode === "cards" ? "active" : ""} onClick={() => setViewMode("cards")}><I.layout size={12} /> Cards</button>
              <button className={viewMode === "report" ? "active" : ""} onClick={() => setViewMode("report")}><I.bar size={12} /> Report</button>
              <button className={viewMode === "activity" ? "active" : ""} onClick={() => setViewMode("activity")}><I.clock size={12} /> Activity</button>
            </div>
            <button className="add" onClick={onNew}><I.plus size={13} /> New project</button>
          </div>
        </div>

        {/* Portfolio summary */}
        <div className="port-summary" style={{ animation: "fu .4s ease .05s both" }}>
          {[
            { v: activeProjects.length, l: "Active Projects", c: "#6366f1" },
            { v: atRiskCount, l: "At Risk", c: atRiskCount > 0 ? "#d97706" : "#059669" },
            { v: openActions, l: "Open Actions", c: overdueActions > 0 ? "#dc2626" : "#6366f1" },
            { v: overdueActions, l: "Overdue", c: overdueActions > 0 ? "#dc2626" : "#059669" },
            { v: totalStakeholders, l: "Stakeholders", c: "#8b5cf6" },
          ].map((s, i) => (
            <div className="port-stat" key={i}>
              <div className="ps-v" style={{ color: s.c }}>{s.v}</div>
              <div className="ps-l">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="search-wrap">
          <div className="search-bar">
            <I.search size={15} color="var(--t3)" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search projects by name, description, tag, or stakeholder..." />
            {query && <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t3)", padding: 2 }} onClick={() => setQuery("")}><I.x size={14} /></button>}
          </div>
        </div>

        {/* Status filters */}
        <div className="filter-row">
          <span style={{ fontSize: 11, color: "var(--t3)", fontWeight: 500, alignSelf: "center", marginRight: 4 }}>Status:</span>
          {["all", "on-track", "at-risk", "blocked", "not-started", "completed"].map(s => (
            <button key={s} className={`f-chip ${statusFilter === s ? "on" : ""}`} onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}>
              {s !== "all" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLORS[s] || "var(--t3)" }} />}
              {s === "all" ? "All" : s.replace("-", " ")}
            </button>
          ))}
          {allTags.length > 0 && <>
            <span style={{ fontSize: 11, color: "var(--t3)", fontWeight: 500, alignSelf: "center", marginLeft: 8, marginRight: 4 }}>Tags:</span>
            {allTags.map(t => (
              <button key={t} className={`f-chip ${tagFilter === t ? "on" : ""}`} onClick={() => setTagFilter(tagFilter === t ? "all" : t)}>
                <I.tag size={10} /> {t}
              </button>
            ))}
          </>}
          {isFiltering && (
            <button className="f-chip" onClick={clearFilters} style={{ borderColor: "var(--border)", color: "var(--t2)" }}>
              <I.x size={10} /> Clear filters
            </button>
          )}
        </div>

        {/* Result count when filtering */}
        {isFiltering && (
          <div className="search-count">
            Showing {filtered.length} of {activeProjects.length} project{activeProjects.length !== 1 ? "s" : ""}
            {query.trim() && <> matching "<strong style={{ color: "var(--txt)" }}>{query.trim()}</strong>"</>}
          </div>
        )}

        {/* Card view */}
        {viewMode === "cards" && (
          <div className="proj-g" style={{ animation: "fu .35s ease both" }}>
            {filtered.map((p, i) => {
              const pl = PALETTES[p.palette] || PALETTES.indigo;
              const op = (p.actions || []).filter(a => a.status !== "done").length;
              const od = (p.actions || []).filter(a => a.status !== "done" && isOverdue(a.dueDate)).length;
              const pct = p.totalWeeks > 0 ? Math.round((p.currentWeek / p.totalWeeks) * 100) : 0;
              return (
                <div className="pc" key={p.id} onClick={() => onSelect(p.id)} style={{ animation: `fu .4s ease ${i * .06}s both`, borderTop: `3px solid ${pl.primary}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div className="pc-st" style={{ background: `${STATUS_COLORS[p.status]}14`, color: STATUS_COLORS[p.status] }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_COLORS[p.status] }} />{(p.status || "not-started").replace("-", " ")}
                    </div>
                    {od > 0 && <span style={{ fontSize: 10.5, fontWeight: 600, color: "#dc2626", background: "#dc262612", padding: "2px 8px", borderRadius: 100 }}>{od} overdue</span>}
                  </div>
                  <h3>{p.name}</h3>
                  <div className="desc">{p.description}</div>
                  {(p.tags || []).length > 0 && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                      {p.tags.slice(0, 3).map(t => <span key={t} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 100, background: `${pl.primary}12`, color: pl.primary, fontWeight: 500 }}>{t}</span>)}
                    </div>
                  )}
                  <div className="pc-m"><span><I.clock size={11} /> Wk {p.currentWeek}/{p.totalWeeks}</span><span><I.users size={11} /> {(p.stakeholders || []).length}</span><span><I.target size={11} /> {op} open</span></div>
                  <div style={{ height: 4, borderRadius: 2, background: "var(--bl)", marginTop: 12, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 2, width: `${pct}%`, background: pl.grad, transition: "width .5s ease" }} />
                  </div>
                </div>
              );
            })}
            <button className="new-pc" onClick={onNew}><I.plus size={22} color="var(--t3)" /><span>New project</span></button>
            {filtered.length === 0 && isFiltering && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 32, color: "var(--t3)" }}>
                <I.search size={28} color="var(--t3)" />
                <p style={{ marginTop: 8, fontSize: 13 }}>No projects match your filters</p>
                <button className="f-chip" onClick={clearFilters} style={{ marginTop: 8, borderColor: "var(--border)" }}><I.x size={10} /> Clear filters</button>
              </div>
            )}
          </div>
        )}

        {/* Report view */}
        {viewMode === "report" && (
          <div style={{ animation: "fu .35s ease both" }}>
            <table className="rpt-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Timeline</th>
                  <th>Actions</th>
                  <th>Stakeholders</th>
                  <th>Risk Items</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const pl = PALETTES[p.palette] || PALETTES.indigo;
                  const pct = p.totalWeeks > 0 ? Math.round((p.currentWeek / p.totalWeeks) * 100) : 0;
                  const op = (p.actions || []).filter(a => a.status !== "done").length;
                  const dn = (p.actions || []).filter(a => a.status === "done").length;
                  const od = (p.actions || []).filter(a => a.status !== "done" && isOverdue(a.dueDate)).length;
                  const riskUpdates = (p.updates || []).filter(u => u.status === "at-risk" || u.status === "blocked").length;
                  return (
                    <tr key={p.id}>
                      <td>
                        <span className="rpt-name" onClick={() => onSelect(p.id)}>{p.name}</span>
                        {(p.tags || []).length > 0 && <div style={{ display: "flex", gap: 3, marginTop: 4 }}>{p.tags.slice(0, 2).map(t => <span key={t} style={{ fontSize: 9.5, padding: "1px 6px", borderRadius: 100, background: `${pl.primary}12`, color: pl.primary, fontWeight: 500 }}>{t}</span>)}</div>}
                      </td>
                      <td>
                        <span className="rpt-status" style={{ background: `${STATUS_COLORS[p.status]}14`, color: STATUS_COLORS[p.status] }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_COLORS[p.status] }} />
                          {(p.status || "not-started").replace("-", " ")}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="rpt-bar"><div className="rpt-bar-fill" style={{ width: `${pct}%`, background: pl.grad }} /></div>
                          <span style={{ fontSize: 11.5, fontFamily: "var(--fm)", color: "var(--t2)", whiteSpace: "nowrap" }}>{pct}%</span>
                        </div>
                      </td>
                      <td><span style={{ fontSize: 12.5, fontFamily: "var(--fm)" }}>Wk {p.currentWeek}/{p.totalWeeks}</span></td>
                      <td>
                        <span style={{ fontSize: 12.5 }}>{dn}/{dn + op} done</span>
                        {od > 0 && <span style={{ fontSize: 10.5, fontWeight: 600, color: "#dc2626", marginLeft: 6 }}>({od} late)</span>}
                      </td>
                      <td><span style={{ fontSize: 12.5 }}>{(p.stakeholders || []).length}</span></td>
                      <td>
                        {riskUpdates > 0 ? (
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#d97706" }}>{riskUpdates} item{riskUpdates !== 1 ? "s" : ""}</span>
                        ) : (
                          <span style={{ fontSize: 12, color: "#059669" }}>Clear</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="empty" style={{ marginTop: 24 }}><I.search size={28} color="var(--t3)" /><p>{isFiltering ? "No projects match your filters" : "No active projects"}</p>
                {isFiltering && <button className="f-chip" onClick={clearFilters} style={{ marginTop: 8, borderColor: "var(--border)" }}><I.x size={10} /> Clear filters</button>}
              </div>
            )}
          </div>
        )}

        {/* Activity Feed */}
        {viewMode === "activity" && (
          <div>
            {(() => {
              // Collect all events across all active projects
              const events = [];
              activeProjects.forEach(p => {
                const pl = PALETTES[p.palette] || PALETTES.indigo;
                (p.updates || []).forEach(u => events.push({ ...u, projectName: p.name, projectId: p.id, projectColor: pl.primary, eventType: "update", sortDate: u.date }));
                (p.decisions || []).forEach(d => events.push({ ...d, projectName: p.name, projectId: p.id, projectColor: pl.primary, eventType: "decision", sortDate: d.date }));
                (p.actions || []).filter(a => a.status === "done").forEach(a => events.push({ ...a, projectName: p.name, projectId: p.id, projectColor: pl.primary, eventType: "action-done", sortDate: a.dueDate }));
              });
              events.sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));
              const display = events.slice(0, 30);

              if (display.length === 0) return (
                <div className="empty" style={{ padding: 40 }}><I.clock size={28} color="var(--t3)" /><p>No activity yet across your projects</p></div>
              );

              return display.map((ev, i) => (
                <div className="feed-item" key={`${ev.eventType}-${ev.id}-${i}`}>
                  <div className="feed-dot" style={{ background: ev.eventType === "decision" ? "#8b5cf6" : ev.eventType === "action-done" ? "#059669" : STATUS_COLORS[ev.status] || "var(--t3)" }} />
                  <div className="feed-content">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span className="feed-title">{ev.title}</span>
                      <span className="feed-type">{ev.eventType === "decision" ? "Decision" : ev.eventType === "action-done" ? "Completed" : ev.type || "Update"}</span>
                    </div>
                    <div className="feed-meta">
                      <span className="feed-proj" style={{ background: `${ev.projectColor}14`, color: ev.projectColor }} onClick={() => onSelect(ev.projectId)}>{ev.projectName}</span>
                      <span>{ev.author || ev.decidedBy || ev.owner}</span>
                      <span>{fmtFull(ev.sortDate)}</span>
                    </div>
                    {(ev.body || ev.rationale) && <div className="feed-body">{(ev.body || ev.rationale || "").slice(0, 150)}{(ev.body || ev.rationale || "").length > 150 ? "..." : ""}</div>}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {/* Archive panel */}
        {showArchive && (
          <div className="mod-ov" onClick={() => setShowArchive(false)}>
            <div onClick={e => e.stopPropagation()} style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(420px, 90vw)", background: "var(--card)", borderLeft: "1px solid var(--border)", boxShadow: "-8px 0 30px rgba(0,0,0,.1)", animation: "si .25s ease both", display: "flex", flexDirection: "column", zIndex: 200 }}>
              <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <I.archive size={16} color="var(--t2)" />
                  <span style={{ fontWeight: 600, fontSize: 15 }}>Archived Projects</span>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 100, background: "var(--hover)", color: "var(--t3)", fontWeight: 500 }}>{archivedProjects.length}</span>
                </div>
                <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t3)" }} onClick={() => setShowArchive(false)}><I.x size={18} /></button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
                {archivedProjects.length === 0 ? (
                  <div className="empty" style={{ padding: 32 }}><I.archive size={28} color="var(--t3)" /><p>No archived projects</p></div>
                ) : archivedProjects.map((p) => {
                  const pl = PALETTES[p.palette] || PALETTES.indigo;
                  return (
                    <div key={p.id} style={{ padding: 16, borderRadius: "var(--r)", background: "var(--hover)", border: "1px solid var(--bl)", marginBottom: 10, cursor: "pointer", transition: "var(--tr)" }} onClick={() => { setShowArchive(false); onSelect(p.id); }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</h4>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: pl.primary, flexShrink: 0 }} />
                      </div>
                      <p style={{ fontSize: 12, color: "var(--t3)", lineHeight: 1.5, marginBottom: 8 }}>{p.description}</p>
                      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--t3)" }}>
                        <span>{(p.updates || []).length} updates</span>
                        <span>{(p.decisions || []).length} decisions</span>
                        <span>{(p.actions || []).length} actions</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Auth Page ──
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const activePw = mode === "forgot" ? newPassword : password;
  const validate = () => {
    if (!email.trim() || !email.includes("@") || !email.includes(".")) return "Please enter a valid email address.";
    if (mode === "signup") { if (!firstName.trim()) return "First name is required."; return validatePassword(password); }
    if (mode === "login" && !password) return "Please enter your password.";
    if (mode === "forgot") return validatePassword(newPassword);
    return null;
  };

  const pwChecks = [
    { label: "8+ chars", pass: activePw.length >= 8 },
    { label: "Uppercase", pass: /[A-Z]/.test(activePw) },
    { label: "Lowercase", pass: /[a-z]/.test(activePw) },
    { label: "Number", pass: /[0-9]/.test(activePw) },
  ];

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); setSuccess(""); return; }
    setError(""); setSuccess(""); setLoading(true);
    try {
      let users = await loadUsers();
      if (!Array.isArray(users)) users = [];

      if (mode === "signup") {
        if (users.find(u => u.email === email.trim().toLowerCase())) { setError("An account with this email already exists. Try signing in."); setLoading(false); return; }
        const user = { id: uid(), email: email.trim().toLowerCase(), pwHash: hashPw(password), firstName: firstName.trim(), lastName: lastName.trim(), company: company.trim(), avatar: (firstName[0] + (lastName[0] || "")).toUpperCase(), createdAt: new Date().toISOString() };
        await saveUsers([...users, user]);
        await saveAuth({ userId: user.id, loggedIn: true });
        setLoading(false); onAuth(user);
      } else if (mode === "forgot") {
        const idx = users.findIndex(u => u.email === email.trim().toLowerCase());
        if (idx === -1) { setError("No account found with this email."); setLoading(false); return; }
        users[idx].pwHash = hashPw(newPassword);
        await saveUsers(users);
        setSuccess("Password reset successfully. You can now sign in.");
        setLoading(false);
        setTimeout(() => { setMode("login"); setPassword(""); setNewPassword(""); setSuccess(""); }, 2000);
      } else {
        const user = users.find(u => u.email === email.trim().toLowerCase());
        if (!user) { setError("No account found with this email. Try signing up."); setLoading(false); return; }
        if (user.pwHash !== hashPw(password)) { setError("Incorrect password. Please try again."); setLoading(false); return; }
        await saveAuth({ userId: user.id, loggedIn: true });
        setLoading(false); onAuth(user);
      }
    } catch (e) { setError("Something went wrong. Please try again."); setLoading(false); }
  };

  const go = (m) => { setMode(m); setError(""); setSuccess(""); };
  const titles = { login: "Welcome", signup: "Create your account", forgot: "Reset password" };
  const subs = { login: "Sign in to access your projects", signup: "Get started with SyncBase in seconds", forgot: "Enter your email and choose a new password" };

  const PwIndicator = () => activePw.length > 0 ? (
    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
      {pwChecks.map((c, i) => <span key={i} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 100, background: c.pass ? "rgba(16,185,129,.15)" : "rgba(255,255,255,.06)", color: c.pass ? "#34d399" : "rgba(255,255,255,.3)", fontWeight: 500 }}>{c.pass ? "\u2713" : "\u25CB"} {c.label}</span>)}
    </div>
  ) : null;

  return (
    <div className="auth-wrap">
      <div className="orb o1" /><div className="orb o2" />
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-mark" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>S</div>
          <span>SyncBase</span>
        </div>

        {mode === "signup" && (
          <div className="auth-avatar" style={{ background: firstName ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,.08)" }}>
            {firstName ? (firstName[0] + (lastName[0] || "")).toUpperCase() : "?"}
          </div>
        )}

        <h2>{titles[mode]}</h2>
        <p className="auth-sub">{subs[mode]}</p>

        {error && <div className="auth-err">{error}</div>}
        {success && <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(16,185,129,.12)", border: "1px solid rgba(16,185,129,.25)", color: "#34d399", fontSize: 12.5, marginBottom: 16 }}>{success}</div>}

        {mode === "signup" && (
          <>
            <div className="auth-name-row">
              <div className="auth-fld"><label>First name *</label><input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jordan" autoFocus /></div>
              <div className="auth-fld"><label>Last name</label><input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Park" /></div>
            </div>
            <div className="auth-fld"><label>Company / Team</label><input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Inc." /></div>
          </>
        )}

        <div className="auth-fld">
          <label>Email address *</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" autoFocus={mode !== "signup"} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        </div>

        {mode === "login" && (
          <div className="auth-fld">
            <label>Password *</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            <button onClick={() => go("forgot")} style={{ background: "none", border: "none", color: "#818cf8", fontSize: 11.5, fontFamily: "var(--f)", cursor: "pointer", marginTop: 6, padding: 0 }}>Forgot password?</button>
          </div>
        )}

        {mode === "signup" && (
          <div className="auth-fld">
            <label>Password *</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a strong password" onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            <PwIndicator />
          </div>
        )}

        {mode === "forgot" && (
          <div className="auth-fld">
            <label>New password *</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter a new password" onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            <PwIndicator />
          </div>
        )}

        <button className="auth-btn auth-btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Loading..." : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"}
        </button>

        <div className="auth-switch">
          {mode === "login" && <>Don't have an account? <button onClick={() => go("signup")}>Sign up</button></>}
          {mode === "signup" && <>Already have an account? <button onClick={() => go("login")}>Sign in</button></>}
          {mode === "forgot" && <>Remember your password? <button onClick={() => go("login")}>Sign in</button></>}
        </div>
      </div>
    </div>
  );
}

// ── User Menu ──
function UserMenu({ user, onLogout, dark, toggleDark }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="user-btn" onClick={() => setOpen(!open)}>
        <div className="user-av" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>{user.avatar}</div>
        <span className="user-name">{user.firstName}</span>
      </button>
      {open && (
        <div className="user-drop">
          <div style={{ padding: "10px 12px 8px" }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--txt)" }}>{user.firstName} {user.lastName}</div>
            <div style={{ fontSize: 11.5, color: "var(--t3)", marginTop: 1 }}>{user.email}</div>
            {user.company && <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 1 }}>{user.company}</div>}
          </div>
          <div className="user-drop-sep" />
          <button className="user-drop-item" onClick={() => { toggleDark(); setOpen(false); }}>
            {dark ? <I.sun size={14} /> : <I.moon size={14} />}
            {dark ? "Light mode" : "Dark mode"}
          </button>
          <div className="user-drop-sep" />
          <button className="user-drop-item danger" onClick={() => { setOpen(false); onLogout(); }}>
            <I.arrow size={14} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function Landing({ onEnter, dark, toggleDark, user, onLogout }) {
  return (
    <div className="land">
      <div className="hero">
        <div style={{ position: "absolute", top: 16, right: 20, zIndex: 10 }}>
          {user ? (
            <UserMenu user={user} onLogout={onLogout} dark={dark} toggleDark={toggleDark} />
          ) : (
            <button className="dm-tog" onClick={toggleDark} style={{ borderColor: "rgba(255,255,255,.15)", background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.6)" }}>
              {dark ? <I.sun size={14} /> : <I.moon size={14} />} {dark ? "Light" : "Dark"}
            </button>
          )}
        </div>
        <div className="hero-grid" />
        <div className="orb o1" /><div className="orb o2" /><div className="orb o3" />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="badge"><span className="badge-dot" /> Built for PMs who ship</div>
          <h1>Stop chasing updates.<br /><em>Start shipping.</em></h1>
          <p className="sub">SyncBase keeps stakeholders aligned, decisions documented, and action items tracked — so you can focus on building great products.</p>
          <div className="ctas">
            <button className="btn-p" onClick={onEnter}><I.zap size={15} /> Get started free</button>
            <button className="btn-s" onClick={onEnter}><I.layout size={15} /> See live demo</button>
          </div>
          <div className="stats">
            <div className="stat"><div className="stat-n">10+</div><div className="stat-l">Hours saved / week</div></div>
            <div className="stat"><div className="stat-n">30%</div><div className="stat-l">Fewer sync meetings</div></div>
            <div className="stat"><div className="stat-n">80%</div><div className="stat-l">Stakeholder satisfaction</div></div>
          </div>
        </div>
      </div>
      <div className="feat-sec">
        <div className="feat-in">
          <div className="feat-tag">Why SyncBase</div>
          <h2 className="feat-h2">Everything your team needs to stay aligned</h2>
          <div className="feat-g">
            {[
              { i: <I.bar size={20} />, bg: "rgba(99,102,241,.1)", c: "#6366f1", t: "Live Dashboard", d: "At-a-glance project health. Timeline, blockers, and action status — no digging." },
              { i: <I.file size={20} />, bg: "rgba(16,185,129,.1)", c: "#10b981", t: "Decision Log", d: "Never re-litigate. Full context on what was decided, why, and what alternatives existed." },
              { i: <I.target size={20} />, bg: "rgba(244,63,94,.1)", c: "#f43f5e", t: "Action Tracker", d: "Who's doing what by when. Overdue items surface automatically." },
              { i: <I.users size={20} />, bg: "rgba(245,158,11,.1)", c: "#f59e0b", t: "Stakeholder Views", d: "Each person sees what matters to them. No more irrelevant CC'd threads." },
              { i: <I.msg size={20} />, bg: "rgba(139,92,246,.1)", c: "#8b5cf6", t: "Update Timeline", d: "Chronological project narrative. Status, milestones, blockers in one feed." },
              { i: <I.folder size={20} />, bg: "rgba(6,182,212,.1)", c: "#06b6d4", t: "Multi-Project", d: "All initiatives in one hub. Each gets its own dashboard, timeline, and team." },
            ].map((f, i) => (
              <div className="feat-c" key={i} style={{ animation: `fu .4s ease ${i * .07}s both` }}>
                <div className="feat-i" style={{ background: f.bg, color: f.c }}>{f.i}</div>
                <h3>{f.t}</h3><p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="cta-sec">
        <h2>Ready to align your team?</h2>
        <p>Create your first project in 30 seconds. No signup required.</p>
        <button className="btn-d" onClick={onEnter}><I.zap size={15} /> Start your first project</button>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState("landing");
  const [projects, setProjects] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [modal, setModal] = useState(null);
  const [dark, setDark] = useState(false);
  const init = useRef(false);

  // ── Boot: check auth, then load projects ──
  useEffect(() => {
    if (init.current) return; init.current = true;
    (async () => {
      try { const dm = await window.storage.get("syncbase-dark"); if (dm?.value === "true") setDark(true); } catch {}
      try {
        const auth = await loadAuth();
        if (auth?.loggedIn && auth?.userId) {
          const users = await loadUsers();
          const u = users.find(x => x.id === auth.userId);
          if (u) { setUser(u); }
        }
      } catch {}
      setAuthReady(true);
    })();
  }, []);

  // Load projects once user is set
  useEffect(() => {
    if (!user || projects) return;
    (async () => {
      const d = await load();
      if (d?.projects?.length) { setProjects(d.projects); }
      else setProjects([SAMPLE]);
      setView("list");
    })();
  }, [user]);

  useEffect(() => { if (projects) save({ projects }); }, [projects]);
  useEffect(() => { try { window.storage.set("syncbase-dark", String(dark)); } catch {} }, [dark]);

  const toggleDark = () => setDark(d => !d);

  const handleAuth = (u) => { setUser(u); setProjects(null); setView("list"); };
  const handleLogout = async () => {
    await saveAuth({ loggedIn: false, userId: null });
    setUser(null); setProjects(null); setActiveId(null); setView("auth");
  };

  const goHome = () => { setActiveId(null); setView("list"); };
  const enter = () => setView("auth");
  const openP = (id) => { setActiveId(id); setView("project"); };
  const back = () => { setActiveId(null); setView("list"); };
  const createP = (f) => {
    const p = { id: uid(), name: f.name, description: f.description, palette: f.palette, status: "not-started", startDate: new Date().toISOString().split("T")[0], endDate: daysFromNow(f.totalWeeks * 7), currentWeek: 1, totalWeeks: f.totalWeeks, stakeholders: [], updates: [], decisions: [], actions: [], tags: [], archived: false, sprintConfig: { type: "sprint", length: 2, currentSprint: 1, phases: [] }, okrs: [], integrations: { slack: "", jira: "", gcal: false } };
    setProjects((prev) => [...prev, p]); setModal(null); openP(p.id);
  };
  const updateP = (u) => setProjects((prev) => prev.map((p) => p.id === u.id ? u : p));
  const deleteP = (id) => { setProjects((prev) => prev.filter((p) => p.id !== id)); back(); };

  // ── Loading state ──
  if (!authReady) return (
    <div className={dark ? "dark" : ""} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#0f172a" }}>
      <style>{css}</style>
      <div style={{ animation: "pulse 1.5s ease infinite", fontSize: 13, color: "rgba(255,255,255,.4)" }}>Loading SyncBase...</div>
    </div>
  );

  // ── Not logged in: show auth ──
  if (!user) {
    return (
      <div className={dark ? "dark" : ""}>
        <style>{css}</style>
        <AuthPage onAuth={(u) => { handleAuth(u); }} />
      </div>
    );
  }

  // ── Logged in but projects not loaded yet ──
  if (!projects) return (
    <div className={dark ? "dark" : ""} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "var(--f)", background: "var(--bg)" }}>
      <style>{css}</style>
      <div style={{ animation: "pulse 1.5s ease infinite", fontSize: 13, color: "var(--t3)" }}>Loading projects...</div>
    </div>
  );

  const active = projects.find((p) => p.id === activeId);

  return (
    <div className={dark ? "dark" : ""}>
      <style>{css}</style>
      {view === "list" && <ProjectList projects={projects} onSelect={openP} onNew={() => setModal("new")} onHome={goHome} dark={dark} toggleDark={toggleDark} user={user} onLogout={handleLogout} />}
      {view === "project" && active && <Dashboard project={active} onBack={back} onUpdate={updateP} onDelete={deleteP} dark={dark} toggleDark={toggleDark} user={user} onLogout={handleLogout} />}
      {modal === "new" && <NewProjectModal onClose={() => setModal(null)} onSave={createP} />}
    </div>
  );
}
