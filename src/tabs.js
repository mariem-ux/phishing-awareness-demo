// Honest "how many tabs are open" counter — same-origin only.
//
// A website can NEVER know the browser's total tab count, other tabs' URLs,
// or search history: no browser API exposes that (privacy sandbox).
// Any code claiming otherwise is faking it.
//
// What IS possible: coordinate tabs of OUR OWN origin via localStorage.
// Every tab heartbeats { timestamp + current page } under a unique id,
// so we can count open tabs of this site AND list what those same-site
// tabs are showing (landing / register / report). Other sites' tabs
// and search queries stay invisible by design.

const KEY = "demo-open-tabs";
const STALE_MS = 15000;

function getTabId() {
  try {
    let id = sessionStorage.getItem("demo-tab-id");
    if (!id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem("demo-tab-id", id);
    }
    return id;
  } catch {
    return "single-tab";
  }
}

function currentPage() {
  try {
    const h = window.location.hash || "#";
    if (h.startsWith("#view/")) return "view";
    if (h === "#register") return "register";
    return "landing";
  } catch {
    return "landing";
  }
}

function readMap() {
  try {
    const raw = localStorage.getItem(KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

function writeMap(map) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* private mode — ignore */
  }
}

function entryTime(e) {
  if (typeof e === "number") return e; // legacy format
  if (e && typeof e.ts === "number") return e.ts;
  return 0;
}

function prune(map, now) {
  const out = {};
  for (const [id, e] of Object.entries(map)) {
    if (now - entryTime(e) < STALE_MS) out[id] = e;
  }
  return out;
}

export function heartbeatTab() {
  try {
    const now = Date.now();
    const map = prune(readMap(), now);
    map[getTabId()] = { ts: now, page: currentPage() };
    writeMap(map);
    return Object.keys(map).length;
  } catch {
    return 1;
  }
}

// Live list of this site's open tabs: [{ page, mine }]. No URLs, no tokens.
export function getOpenSiteTabsDetail() {
  try {
    const now = Date.now();
    const map = prune(readMap(), now);
    const me = getTabId();
    if (!map[me]) {
      map[me] = { ts: now, page: currentPage() };
      writeMap(map);
    }
    return Object.entries(map).map(([id, e]) => ({
      page: e && typeof e.page === "string" ? e.page : "landing",
      mine: id === me,
    }));
  } catch {
    return [{ page: currentPage(), mine: true }];
  }
}

export function countOpenSiteTabs() {
  try {
    return getOpenSiteTabsDetail().length || 1;
  } catch {
    return 1;
  }
}

export function startTabHeartbeat() {
  heartbeatTab();
  const iv = setInterval(heartbeatTab, 5000);
  const remove = () => {
    try {
      const map = readMap();
      delete map[getTabId()];
      writeMap(map);
    } catch {
      /* ignore */
    }
  };
  window.addEventListener("pagehide", remove);
  return () => {
    clearInterval(iv);
    window.removeEventListener("pagehide", remove);
    remove();
  };
}
