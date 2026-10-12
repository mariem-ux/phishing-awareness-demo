// Tracks pages visited on THIS demo site during the current tab session.
// This is the only browsing history a website can legitimately know:
// its own pages, recorded by its own code. Global browser history
// (other sites, other tabs) is blocked by the browser by design.
const KEY = "demo-site-visits";
const TOTAL_KEY = "demo-site-total-visits";

export function recordVisit(page) {
  try {
    const raw = sessionStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const last = arr[arr.length - 1];
    // Avoid double-counting re-renders of the same page.
    if (last && last.page === page) return arr;
    arr.push({ page, at: new Date().toISOString() });
    sessionStorage.setItem(KEY, JSON.stringify(arr.slice(-50)));
    return arr;
  } catch {
    return [];
  }
}

export function getVisits() {
  try {
    const raw = sessionStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// Persistent (cross-session, same browser+origin) page-view counter for THIS
// site only. This is the closest honest equivalent to "browser history":
// we can count visits to our own pages, never other sites' URLs.
export function bumpTotalSiteVisits() {
  try {
    const n = parseInt(localStorage.getItem(TOTAL_KEY) || "0", 10) || 0;
    const next = n + 1;
    localStorage.setItem(TOTAL_KEY, String(next));
    return next;
  } catch {
    return undefined;
  }
}

export function getTotalSiteVisits() {
  try {
    const n = parseInt(localStorage.getItem(TOTAL_KEY) || "0", 10) || 0;
    return n || undefined;
  } catch {
    return undefined;
  }
}
