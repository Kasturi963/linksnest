import { useState, useEffect, useCallback } from "react";

const CATEGORY_COLORS = {
  "Video": { bg: "#1a1a2e", accent: "#e94560", icon: "▶" },
  "Audio": { bg: "#0f3460", accent: "#16213e", icon: "♪" },
  "Document": { bg: "#1b262c", accent: "#0f4c75", icon: "📄" },
  "Article": { bg: "#162447", accent: "#1f4068", icon: "✦" },
  "Social": { bg: "#1a1a2e", accent: "#533483", icon: "◈" },
  "Tool": { bg: "#0d2137", accent: "#1565c0", icon: "⚙" },
  "Course": { bg: "#1b1b2f", accent: "#e43f5a", icon: "◉" },
  "Other": { bg: "#1c1c1c", accent: "#444", icon: "○" },
};

const ACCENT = "#f5c542";
const BG = "#0e0e13";
const SURFACE = "#16161e";
const SURFACE2 = "#1e1e28";
const TEXT = "#eaeaf0";
const MUTED = "#7a7a8c";
const BORDER = "#2a2a38";

function detectType(url) {
  try {
    const u = url.toLowerCase();
    if (u.includes("youtube.com") || u.includes("youtu.be") || u.includes("vimeo.com") || u.includes("dailymotion")) return "Video";
    if (u.includes("spotify.com") || u.includes("soundcloud.com") || u.includes("podcasts.apple.com") || u.includes("anchor.fm") || u.match(/\.(mp3|wav|ogg|flac)(\?|$)/)) return "Audio";
    if (u.match(/\.(pdf|docx?|xlsx?|pptx?|txt|csv)(\?|$)/) || u.includes("docs.google.com") || u.includes("drive.google.com")) return "Document";
    if (u.includes("twitter.com") || u.includes("x.com") || u.includes("instagram.com") || u.includes("linkedin.com") || u.includes("reddit.com") || u.includes("facebook.com")) return "Social";
    if (u.includes("github.com") || u.includes("figma.com") || u.includes("notion.so") || u.includes("codepen.io") || u.includes("replit.com")) return "Tool";
    if (u.includes("coursera.org") || u.includes("udemy.com") || u.includes("edx.org") || u.includes("skillshare.com") || u.includes("pluralsight.com")) return "Course";
    if (u.includes("medium.com") || u.includes("substack.com") || u.includes("dev.to") || u.includes("hashnode") || u.includes("blog") || u.includes("article")) return "Article";
    return "Other";
  } catch {
    return "Other";
  }
}

function extractDomain(url) {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

function getFavicon(url) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; } catch { return null; }
}

function getYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    return u.searchParams.get("v");
  } catch { return null; }
}

async function fetchAISummary(url, type) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `You are a smart link analyzer. Given a URL, infer what this link is about from the URL itself (domain, path, query params, slugs).
        
URL: ${url}
Detected Type: ${type}

Respond ONLY with a JSON object (no markdown, no backticks):
{
  "title": "A clean, readable title for this link (inferred from URL structure, max 8 words)",
  "summary": "2-3 sentence summary of what this content is likely about, based on the URL. Be specific and insightful.",
  "category": "One of: Video, Audio, Document, Article, Social, Tool, Course, Other",
  "tags": ["tag1", "tag2", "tag3"]
}`
      }]
    })
  });
  const data = await response.json();
  const text = data.content?.find(b => b.type === "text")?.text || "{}";
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return { title: extractDomain(url), summary: "Unable to generate summary.", category: type, tags: [] };
  }
}

const styles = {
  root: { fontFamily: "'DM Serif Display', Georgia, serif", background: BG, minHeight: "100vh", color: TEXT, padding: "0 0 80px 0" },
  header: { background: `linear-gradient(135deg, ${SURFACE} 0%, #111118 100%)`, borderBottom: `1px solid ${BORDER}`, padding: "28px 40px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)" },
  logo: { fontSize: "26px", fontWeight: "700", letterSpacing: "-0.5px", color: TEXT, display: "flex", alignItems: "center", gap: "10px" },
  logoAccent: { color: ACCENT },
  subtitle: { fontSize: "12px", fontFamily: "'DM Sans', sans-serif", color: MUTED, letterSpacing: "2px", textTransform: "uppercase", marginTop: "2px" },
  statsRow: { display: "flex", gap: "24px" },
  stat: { textAlign: "center" },
  statNum: { fontSize: "20px", fontWeight: "700", color: ACCENT },
  statLabel: { fontSize: "11px", color: MUTED, fontFamily: "'DM Sans', sans-serif", letterSpacing: "1px" },
  main: { maxWidth: "1200px", margin: "0 auto", padding: "40px 24px 0" },
  inputSection: { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "28px 32px", marginBottom: "36px", position: "relative", overflow: "hidden" },
  inputGlow: { position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` },
  inputLabel: { fontSize: "12px", color: MUTED, fontFamily: "'DM Sans', sans-serif", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "14px" },
  inputRow: { display: "flex", gap: "12px", alignItems: "stretch" },
  input: { flex: 1, background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "14px 18px", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", color: TEXT, outline: "none", transition: "border-color 0.2s" },
  addBtn: { background: ACCENT, color: "#0e0e13", border: "none", borderRadius: "10px", padding: "14px 28px", fontSize: "13px", fontWeight: "700", fontFamily: "'DM Sans', sans-serif", cursor: "pointer", letterSpacing: "1px", textTransform: "uppercase", whiteSpace: "nowrap", transition: "opacity 0.2s" },
  filterRow: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "32px", alignItems: "center" },
  filterChip: { fontFamily: "'DM Sans', sans-serif", fontSize: "12px", padding: "6px 14px", borderRadius: "20px", border: `1px solid ${BORDER}`, background: SURFACE, color: MUTED, cursor: "pointer", transition: "all 0.2s", letterSpacing: "0.5px" },
  filterChipActive: { background: ACCENT, color: "#0e0e13", border: `1px solid ${ACCENT}`, fontWeight: "700" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" },
  card: { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "14px", overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s", cursor: "default" },
  cardTop: { height: "4px" },
  cardBody: { padding: "20px" },
  cardMeta: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" },
  favicon: { width: "16px", height: "16px", borderRadius: "3px" },
  domain: { fontSize: "11px", color: MUTED, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.5px" },
  categoryBadge: { marginLeft: "auto", fontSize: "10px", fontFamily: "'DM Sans', sans-serif", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", padding: "3px 8px", borderRadius: "20px" },
  cardTitle: { fontSize: "16px", fontWeight: "700", lineHeight: "1.35", marginBottom: "10px", color: TEXT },
  cardSummary: { fontSize: "13px", lineHeight: "1.6", color: "#a0a0b4", fontFamily: "'DM Sans', sans-serif", marginBottom: "14px" },
  tagsRow: { display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" },
  tag: { fontSize: "10px", fontFamily: "'DM Sans', sans-serif", padding: "3px 8px", borderRadius: "4px", background: SURFACE2, color: MUTED, border: `1px solid ${BORDER}` },
  cardFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "14px", borderTop: `1px solid ${BORDER}` },
  linkBtn: { fontSize: "12px", fontFamily: "'DM Sans', sans-serif", color: ACCENT, textDecoration: "none", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "4px" },
  deleteBtn: { background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: "16px", padding: "0 4px", transition: "color 0.2s" },
  thumb: { width: "100%", height: "180px", objectFit: "cover", display: "block" },
  loadingCard: { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "28px 24px", display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", justifyContent: "center" },
  pulse: { width: "100%", height: "12px", borderRadius: "6px", background: SURFACE2, animation: "pulse 1.5s ease-in-out infinite" },
  emptyState: { gridColumn: "1 / -1", textAlign: "center", padding: "80px 20px", color: MUTED },
  emptyIcon: { fontSize: "56px", marginBottom: "16px", opacity: 0.4 },
  emptyTitle: { fontSize: "22px", fontWeight: "700", color: TEXT, marginBottom: "8px" },
  emptyDesc: { fontSize: "14px", fontFamily: "'DM Sans', sans-serif", lineHeight: "1.6" },
  toast: { position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "12px 24px", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", color: TEXT, zIndex: 999, display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" },
  searchInput: { background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 14px", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", color: TEXT, outline: "none", width: "220px" },
  sortSelect: { background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 14px", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", color: TEXT, outline: "none", cursor: "pointer" },
};

export default function LinkNest() {
  const [links, setLinks] = useState([]);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [toast, setToast] = useState(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = "https://fonts.googleapis.com";
    document.head.appendChild(link);
    const link2 = document.createElement("link");
    link2.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;700&display=swap";
    link2.rel = "stylesheet";
    document.head.appendChild(link2);
    const style = document.createElement("style");
    style.textContent = `@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} @keyframes spin{to{transform:rotate(360deg)}} * {box-sizing:border-box;margin:0;padding:0;} ::-webkit-scrollbar{width:6px;} ::-webkit-scrollbar-track{background:${BG};} ::-webkit-scrollbar-thumb{background:${BORDER};border-radius:3px;}`;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("linknest_links");
        if (res?.value) setLinks(JSON.parse(res.value));
      } catch {}
    })();
  }, []);

  const saveLinks = useCallback(async (newLinks) => {
    try { await window.storage.set("linknest_links", JSON.stringify(newLinks)); } catch {}
  }, []);

  const showToast = (msg, icon = "✓") => {
    setToast({ msg, icon });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = async () => {
    if (!url.trim()) return;
    let fullUrl = url.trim();
    if (!fullUrl.startsWith("http")) fullUrl = "https://" + fullUrl;

    const tempId = Date.now().toString();
    setLoadingId(tempId);
    setLoading(true);
    setUrl("");

    const type = detectType(fullUrl);
    const tempCard = { id: tempId, url: fullUrl, type, title: extractDomain(fullUrl), summary: "", tags: [], category: type, addedAt: Date.now(), loading: true };
    const updated = [tempCard, ...links];
    setLinks(updated);

    try {
      const ai = await fetchAISummary(fullUrl, type);
      const finalCard = { ...tempCard, title: ai.title || extractDomain(fullUrl), summary: ai.summary || "", tags: ai.tags || [], category: ai.category || type, loading: false };
      const finalLinks = updated.map(l => l.id === tempId ? finalCard : l);
      setLinks(finalLinks);
      saveLinks(finalLinks);
      showToast("Link saved & summarized", "✦");
    } catch {
      const fallback = { ...tempCard, loading: false };
      const fallbackLinks = updated.map(l => l.id === tempId ? fallback : l);
      setLinks(fallbackLinks);
      saveLinks(fallbackLinks);
      showToast("Link saved", "○");
    }
    setLoading(false);
    setLoadingId(null);
  };

  const handleDelete = (id) => {
    const updated = links.filter(l => l.id !== id);
    setLinks(updated);
    saveLinks(updated);
    showToast("Removed", "×");
  };

  const categories = ["All", ...Object.keys(CATEGORY_COLORS)].filter(c => c === "All" || links.some(l => l.category === c));

  const filtered = links.filter(l => {
    const matchCat = activeFilter === "All" || l.category === activeFilter;
    const matchSearch = !search || l.title?.toLowerCase().includes(search.toLowerCase()) || l.url?.toLowerCase().includes(search.toLowerCase()) || l.summary?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }).sort((a, b) => sortBy === "newest" ? b.addedAt - a.addedAt : sortBy === "oldest" ? a.addedAt - b.addedAt : a.title?.localeCompare(b.title));

  const counts = Object.fromEntries(Object.keys(CATEGORY_COLORS).map(c => [c, links.filter(l => l.category === c).length]));

  return (
    <div style={styles.root}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <div style={styles.logo}>
            <span style={{ fontSize: "28px" }}>⬡</span>
            <span>Links<span style={styles.logoAccent}>Nest</span></span>
          </div>
          <div style={styles.subtitle}>Your intelligent link library</div>
        </div>
        <div style={styles.statsRow}>
          {[["Total", links.length], ["Videos", counts.Video || 0], ["Docs", counts.Document || 0], ["Articles", counts.Article || 0]].map(([label, num]) => (
            <div key={label} style={styles.stat}>
              <div style={styles.statNum}>{num}</div>
              <div style={styles.statLabel}>{label}</div>
            </div>
          ))}
        </div>
      </header>

      <main style={styles.main}>
        {/* Input */}
        <div style={styles.inputSection}>
          <div style={styles.inputGlow} />
          <div style={styles.inputLabel}>Add a new link</div>
          <div style={styles.inputRow}>
            <input
              style={{ ...styles.input, borderColor: inputFocused ? ACCENT : BORDER }}
              value={url}
              onChange={e => setUrl(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              placeholder="Paste any URL — video, podcast, article, doc, tool..."
            />
            <button style={{ ...styles.addBtn, opacity: loading ? 0.6 : 1 }} onClick={handleAdd} disabled={loading}>
              {loading ? "Saving..." : "+ Save Link"}
            </button>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
          <div style={styles.filterRow}>
            {categories.map(c => (
              <button key={c} style={activeFilter === c ? { ...styles.filterChip, ...styles.filterChipActive } : styles.filterChip} onClick={() => setActiveFilter(c)}>
                {c !== "All" && CATEGORY_COLORS[c]?.icon + " "}{c}
                {c !== "All" && <span style={{ marginLeft: "5px", opacity: 0.7 }}>{counts[c] || 0}</span>}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <input style={styles.searchInput} placeholder="Search links..." value={search} onChange={e => setSearch(e.target.value)} />
            <select style={styles.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="alpha">A–Z</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        <div style={styles.grid}>
          {filtered.length === 0 && !loading && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>⬡</div>
              <div style={styles.emptyTitle}>Your nest is empty</div>
              <div style={styles.emptyDesc}>Paste any URL above to save and auto-summarize it.<br />Videos, podcasts, articles, docs — everything in one place.</div>
            </div>
          )}
          {filtered.map(link => {
            const cat = CATEGORY_COLORS[link.category] || CATEGORY_COLORS.Other;
            const ytId = getYouTubeId(link.url);
            return (
              <div key={link.id} style={{ ...styles.card }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.4)`; }} onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ ...styles.cardTop, background: cat.accent }} />
                {ytId && !link.loading && (
                  <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
                    <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt={link.title} style={styles.thumb} />
                  </a>
                )}
                <div style={styles.cardBody}>
                  {link.loading ? (
                    <>
                      <div style={{ ...styles.pulse, width: "60%", marginBottom: "10px" }} />
                      <div style={{ ...styles.pulse, width: "100%", marginBottom: "8px" }} />
                      <div style={{ ...styles.pulse, width: "85%" }} />
                      <div style={{ marginTop: "12px", fontSize: "12px", fontFamily: "'DM Sans',sans-serif", color: MUTED }}>✦ Generating AI summary...</div>
                    </>
                  ) : (
                    <>
                      <div style={styles.cardMeta}>
                        {getFavicon(link.url) && <img src={getFavicon(link.url)} alt="" style={styles.favicon} onError={e => e.target.style.display = "none"} />}
                        <span style={styles.domain}>{extractDomain(link.url)}</span>
                        <span style={{ ...styles.categoryBadge, background: cat.accent + "33", color: cat.accent }}>
                          {cat.icon} {link.category}
                        </span>
                      </div>
                      <div style={styles.cardTitle}>{link.title}</div>
                      {link.summary && <div style={styles.cardSummary}>{link.summary}</div>}
                      {link.tags?.length > 0 && (
                        <div style={styles.tagsRow}>
                          {link.tags.map(t => <span key={t} style={styles.tag}>#{t}</span>)}
                        </div>
                      )}
                      <div style={styles.cardFooter}>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" style={styles.linkBtn}>
                          Open link ↗
                        </a>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ fontSize: "11px", color: MUTED, fontFamily: "'DM Sans',sans-serif" }}>{new Date(link.addedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                          <button style={styles.deleteBtn} onClick={() => handleDelete(link.id)} title="Remove" onMouseEnter={e => e.target.style.color = "#e94560"} onMouseLeave={e => e.target.style.color = MUTED}>✕</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {toast && (
        <div style={styles.toast}>
          <span style={{ color: ACCENT }}>{toast.icon}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
