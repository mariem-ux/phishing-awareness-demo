import { getOpenSiteTabsDetail, heartbeatTab } from "./tabs.js";

// Everything a normal website is ALLOWED to collect — no mocks, no guesses.
// Every field below is read live from the browser APIs at registration time.
// If an API is unavailable, the field is left undefined and the viewer hides it
// (instead of showing placeholder text).

function getPosition(timeoutMs = 5000) {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve({ status: "unsupported" });
    const done = (v) => resolve(v);
    try {
      navigator.geolocation.getCurrentPosition(
        (p) =>
          done({
            status: "granted",
            latitude: p.coords.latitude,
            longitude: p.coords.longitude,
            accuracyM: p.coords.accuracy,
            timestamp: p.timestamp,
          }),
        (e) => done({ status: "denied", code: e.code }),
        { timeout: timeoutMs, maximumAge: 60000 }
      );
      setTimeout(() => done({ status: "timeout" }), timeoutMs + 500);
    } catch {
      done({ status: "error" });
    }
  });
}

async function getClientHints() {
  // navigator.userAgentData is the modern, structured source (Chromium).
  // getHighEntropyValues gives the real OS version / architecture / device model.
  const uaData = navigator.userAgentData;
  if (!uaData) return undefined;
  const base = {
    brands: uaData.brands?.map((b) => `${b.brand} ${b.version}`).filter(Boolean),
    mobile: uaData.mobile,
    platform: uaData.platform,
  };
  try {
    if (typeof uaData.getHighEntropyValues === "function") {
      const hi = await uaData.getHighEntropyValues([
        "architecture",
        "bitness",
        "platformVersion",
        "model",
        "fullVersionList",
      ]);
      if (hi.architecture) base.architecture = hi.architecture;
      if (hi.bitness) base.bitness = hi.bitness;
      if (hi.platformVersion) base.platformVersion = hi.platformVersion;
      if (hi.model) base.model = hi.model;
      if (hi.fullVersionList) {
        base.fullVersions = hi.fullVersionList.map((b) => `${b.brand} ${b.version}`);
      }
    }
  } catch {
    /* keep low-entropy base only */
  }
  return base;
}

function getGpu() {
  // Real renderer string when the browser exposes it, otherwise undefined.
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
    if (!gl) return undefined;
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : null;
    return renderer || undefined;
  } catch {
    return undefined;
  }
}

// Only honest "last search" signal: a query embedded in document.referrer.
// Search engines normally strip it, so this usually returns undefined —
// we never guess or invent a query.
function getReferralSearch() {
  try {
    const ref = document.referrer;
    if (!ref) return undefined;
    const u = new URL(ref);
    const host = u.hostname.toLowerCase();
    const isSearch = /google\.|bing\.|yahoo\.|duckduckgo\.|yandex\.|baidu\.|ask\.com|aol\.com|ecosia\.|brave\.com|youtube\.com|amazon\./.test(host);
    if (!isSearch) return undefined;
    const q = u.searchParams.get("q") || u.searchParams.get("query") || u.searchParams.get("text") || u.searchParams.get("search") || u.searchParams.get("p");
    if (!q || !q.trim()) return undefined;
    return { engine: host, query: q.trim().slice(0, 200) };
  } catch {
    return undefined;
  }
}

export async function collectClientMeta() {
  const nav = navigator;
  const scr = window.screen || {};
  const conn = nav.connection || nav.webkitConnection || {};
  const [loc, hints] = await Promise.all([
    Promise.race([
      getPosition(4000),
      new Promise((r) => setTimeout(() => r({ status: "skipped" }), 4500)),
    ]),
    getClientHints(),
  ]);

  const meta = {
    collectedAt: new Date().toISOString(),
    userAgent: nav.userAgent || undefined,
    platform: nav.platform || undefined,
    vendor: nav.vendor || undefined,
    language: nav.language || undefined,
    languages: Array.isArray(nav.languages) && nav.languages.length ? [...nav.languages] : undefined,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
    timezoneOffsetMin: new Date().getTimezoneOffset(),
    screen: {
      width: scr.width || undefined,
      height: scr.height || undefined,
      availWidth: scr.availWidth || undefined,
      availHeight: scr.availHeight || undefined,
      colorDepth: scr.colorDepth || undefined,
      pixelDepth: scr.pixelDepth || undefined,
      orientation: scr.orientation?.type || undefined,
    },
    viewport: {
      w: window.innerWidth || undefined,
      h: window.innerHeight || undefined,
      dpr: window.devicePixelRatio || undefined,
    },
    hardware: {
      cores: nav.hardwareConcurrency || undefined,
      deviceMemoryGB: nav.deviceMemory || undefined,
      maxTouchPoints: typeof nav.maxTouchPoints === "number" ? nav.maxTouchPoints : undefined,
    },
    network: {
      effectiveType: conn.effectiveType || undefined,
      downlinkMbps: typeof conn.downlink === "number" ? conn.downlink : undefined,
      rttMs: typeof conn.rtt === "number" ? conn.rtt : undefined,
      saveData: typeof conn.saveData === "boolean" ? conn.saveData : undefined,
      connType: conn.type || undefined,
    },
    cookiesEnabled: typeof nav.cookieEnabled === "boolean" ? nav.cookieEnabled : undefined,
    doNotTrack: nav.doNotTrack ?? undefined,
    webdriver: typeof nav.webdriver === "boolean" ? nav.webdriver : undefined,
    online: typeof nav.onLine === "boolean" ? nav.onLine : undefined,
    pdfViewerEnabled: typeof nav.pdfViewerEnabled === "boolean" ? nav.pdfViewerEnabled : undefined,
    gpu: getGpu(),
    clientHints: hints,
    page: {
      url: window.location.href,
      referrer: document.referrer || undefined,
      title: document.title || undefined,
    },
    // Browsing — tabs only (all live, nothing invented):
    // - openSiteTabs: how many tabs of THIS site are open (heartbeat).
    // - siteTabs: what those same-site tabs show (page names only).
    // - referralSearch: search query ONLY if the referrer URL carries one
    //   (almost never — search engines strip it). Other tabs' contents and
    //   search history are blocked by the browser by design.
    browsing: (() => {
      let tabs = [];
      try {
        heartbeatTab();
        tabs = getOpenSiteTabsDetail().map((t) => t.page).slice(0, 10);
      } catch { tabs = []; }
      return {
        openSiteTabs: tabs.length ? tabs.length : undefined,
        siteTabs: tabs.length ? tabs : undefined,
        referralSearch: getReferralSearch(),
      };
    })(),
    geo: loc,
  };

  // Drop empty objects so the viewer can simply hide missing sections.
  for (const k of ["screen", "viewport", "hardware", "network", "page", "browsing"]) {
    if (meta[k] && Object.values(meta[k]).every((v) => v == null || (Array.isArray(v) && !v.length))) delete meta[k];
  }
  return meta;
}
