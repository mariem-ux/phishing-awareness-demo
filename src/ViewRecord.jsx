import React, { useEffect, useState } from "react";
import { fetchRecord, deleteRecord } from "./api.js";
import { tr } from "./i18n.js";

const TUNIS_TZ = "Africa/Tunis";

// ---------- helpers: return null when the data wasn't actually captured ----------

function formatDateTunis(iso, lang) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const locale = lang === "fr" ? "fr-FR" : "en-GB";
    const s = new Intl.DateTimeFormat(locale, {
      timeZone: TUNIS_TZ,
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(d);
    return lang === "fr" ? `${s} (heure de Tunis)` : `${s} (Tunis time)`;
  } catch {
    return null;
  }
}

function formatTimeTunis(iso, lang) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-GB", {
      timeZone: TUNIS_TZ,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(d);
  } catch {
    return null;
  }
}

function formatIP(ip) {
  if (!ip) return null;
  const clean = String(ip).replace(/^::ffff:/, "");
  if (clean === "::1" || clean === "127.0.0.1") return `${clean} (this device, local network)`;
  return clean;
}

function browserName(ua = "") {
  if (!ua) return null;
  let m;
  if ((m = ua.match(/Edg\/(\d+)/))) return `Microsoft Edge ${m[1]}`;
  if ((m = ua.match(/OPR\/(\d+)/))) return `Opera ${m[1]}`;
  if ((m = ua.match(/Chrome\/(\d+)/))) return `Google Chrome ${m[1]}`;
  if ((m = ua.match(/Firefox\/(\d+)/))) return `Firefox ${m[1]}`;
  if ((m = ua.match(/Version\/([\d.]+).*Safari/))) return `Safari ${m[1]}`;
  return null; // don't invent a name if we can't parse it
}

function osName(clientMeta, serverUA, hints) {
  // Best source first: structured client hints (real OS version), then UA fallback.
  if (hints?.platform) {
    const ver = hints.platformVersion ? ` ${hints.platformVersion}` : "";
    const arch = hints.architecture || (hints.bitness ? `${hints.bitness}-bit` : "");
    return `${hints.platform}${ver}${arch ? ` (${arch})` : ""}`;
  }
  const platform = clientMeta?.platform || "";
  const ua = clientMeta?.userAgent || serverUA || "";
  const s = `${platform} ${ua}`;
  if (/Android/i.test(s)) return "Android";
  if (/iPhone|iPad|iPod/i.test(s)) return "iOS";
  if (/Windows/i.test(s)) return /Win64|x64/i.test(s) ? "Windows (64-bit)" : "Windows";
  if (/Macintosh|Mac OS/i.test(s)) return "macOS";
  if (/Linux/i.test(s)) return "Linux";
  return platform || null;
}

function langName(code, uiLang) {
  if (!code) return null;
  try {
    const base = String(code).split(",")[0].split(";")[0].trim();
    if (!base) return null;
    return new Intl.DisplayNames([uiLang === "fr" ? "fr" : "en"], { type: "language" }).of(base);
  } catch {
    return null;
  }
}

function langList(langs, uiLang) {
  if (!Array.isArray(langs) || !langs.length) return null;
  try {
    const dn = new Intl.DisplayNames([uiLang === "fr" ? "fr" : "en"], { type: "language" });
    return langs.map((c) => { try { return dn.of(c); } catch { return null; } }).filter(Boolean).join(", ") || null;
  } catch {
    return null;
  }
}

function tzLabel(tz, offsetMin) {
  if (!tz) return null;
  const city = String(tz).split("/").pop().replace(/_/g, " ");
  if (typeof offsetMin === "number") {
    const hrs = -offsetMin / 60;
    const sign = hrs >= 0 ? "+" : "−";
    return `${city} (${tz}, UTC${sign}${Math.abs(hrs)})`;
  }
  return `${city} (${tz})`;
}

function screenText(cm) {
  const w = cm?.screen?.width;
  const h = cm?.screen?.height;
  if (!w || !h) return null;
  const depth = cm.screen.colorDepth ? `, ${cm.screen.colorDepth}-bit colour` : "";
  return `${w} × ${h}px${depth}`;
}

function windowText(cm) {
  const w = cm?.viewport?.w;
  const h = cm?.viewport?.h;
  if (!w || !h) return null;
  const dpr = cm.viewport.dpr ? `, zoom ${Math.round(cm.viewport.dpr * 100)}%` : "";
  return `${w} × ${h}px${dpr}`;
}

function perfText(hw, uiLang) {
  if (!hw) return null;
  const parts = [];
  if (hw.cores) parts.push(uiLang === "fr" ? `${hw.cores} cœurs` : `${hw.cores} cores`);
  if (hw.deviceMemoryGB) parts.push(uiLang === "fr" ? `~${hw.deviceMemoryGB} Go RAM` : `~${hw.deviceMemoryGB} GB RAM`);
  return parts.length ? parts.join(" · ") : null;
}

function networkText(net) {
  if (!net) return null;
  const parts = [];
  if (net.effectiveType) parts.push(String(net.effectiveType).toUpperCase());
  if (typeof net.downlinkMbps === "number" && net.downlinkMbps > 0) parts.push(`≈ ${net.downlinkMbps} Mbps`);
  if (typeof net.rttMs === "number" && net.rttMs >= 0) parts.push(`~${net.rttMs} ms`);
  return parts.length ? parts.join(" · ") : null;
}

function hostOf(url) {
  if (!url) return null;
  try {
    return new URL(url).hostname || null;
  } catch {
    return null;
  }
}

// Real place name from coordinates (live reverse-geocode, no key).
async function reverseGeocode(lat, lon, uiLang) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&localityLanguage=${uiLang === "fr" ? "fr" : "en"}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    const d = await res.json();
    const label = [d.city || d.locality, d.principalSubdivision, d.countryName].filter(Boolean).join(", ");
    return label || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ---------- presentation: rows with no data are omitted entirely ----------

function CleanSection({ title, rows }) {
  const visible = (rows || []).filter((r) => r && r.value != null && r.value !== "");
  if (!visible.length) return null;
  return (
    <section className="view-sec">
      <h2>{title}</h2>
      <dl>
        {visible.map((r, i) => (
          <div className="kv clean" key={`${r.label}-${i}`}>
            <dt>{r.label}</dt>
            <dd>
              {r.href ? (
                <a href={r.href} target="_blank" rel="noreferrer">{r.value}</a>
              ) : (
                String(r.value)
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function ViewRecord({ token, lang, onClose }) {
  const t = (k, vars) => tr(lang, k, vars);
  const uiLang = lang === "fr" ? "fr" : "en";
  const fr = uiLang === "fr";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [deleted, setDeleted] = useState(false);
  const [place, setPlace] = useState(null);
  const [placeLoading, setPlaceLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchRecord(token)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message));
    const onHide = () => deleteRecord(token).catch(() => {});
    window.addEventListener("pagehide", onHide);
    return () => {
      alive = false;
      window.removeEventListener("pagehide", onHide);
      onHide();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const geo = data?.clientMeta?.geo;
  const hasCoords =
    geo?.status === "granted" && typeof geo.latitude === "number" && typeof geo.longitude === "number";
  const lat = hasCoords ? geo.latitude : null;
  const lon = hasCoords ? geo.longitude : null;

  useEffect(() => {
    if (!hasCoords) return;
    let alive = true;
    setPlaceLoading(true);
    reverseGeocode(lat, lon, uiLang)
      .then((p) => alive && setPlace(p))
      .finally(() => alive && setPlaceLoading(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon, uiLang]);

  const destroy = async () => {
    await deleteRecord(token);
    setDeleted(true);
  };

  if (!data && !error) {
    return (
      <div className="register">
        <div className="register-top">
          <img src="/logo1.png" alt="Logo" style={{ height: "40px" }} />
          <button className="icon-btn close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="register-body"><p>{t("view.loading")}</p></div>
      </div>
    );
  }

  const cm = data?.clientMeta || {};
  const sm = data?.serverMeta || {};
  const hints = cm.clientHints;

  const ip = formatIP(sm.ip);
  const os = data ? osName(cm, sm.userAgent, hints) : null;
  const browser = browserName(cm.userAgent || sm.userAgent);
  const coords = hasCoords ? `${Number(lat).toFixed(4)}, ${Number(lon).toFixed(4)}` : null;
  const accuracy = hasCoords && geo.accuracyM != null ? `±${Math.round(geo.accuracyM)} m` : null;
  const placeLabel = hasCoords ? place || (!placeLoading ? coords : null) : null;

  // Summary shows only values we truly have.
  const summaryRows = [
    ip && { label: fr ? "Adresse IP" : "IP address", value: ip },
    (placeLabel || cm.timezone) && {
      label: fr ? "Localisation" : "Location",
      value: placeLabel || tzLabel(cm.timezone, cm.timezoneOffsetMin),
    },
    (os || screenText(cm)) && {
      label: fr ? "Appareil" : "Device",
      value: [os, screenText(cm)].filter(Boolean).join(" · "),
    },
    browser && { label: fr ? "Navigateur" : "Browser", value: browser },
  ].filter(Boolean);

  const refHost = hostOf(sm.referer) || hostOf(cm.page?.referrer);

  // Browsing — tabs only. Everything else (other sites' tabs, their
  // contents, search history) is blocked by the browser by design.
  const br = cm.browsing || {};
  const openTabs = typeof br.openSiteTabs === "number" ? br.openSiteTabs : null;
  const tabPages = Array.isArray(br.siteTabs) ? br.siteTabs : [];
  const pageName = (p) =>
    p === "landing" ? (fr ? "Accueil" : "Home")
    : p === "register" ? (fr ? "Inscription" : "Sign up")
    : p === "view" ? (fr ? "Rapport" : "Report")
    : String(p || "");
  const tabsContain = tabPages.length ? tabPages.map(pageName).filter(Boolean).join(" · ") || null : null;
  const lastSearch = br.referralSearch?.query || null;
  const lastSearchEngine = br.referralSearch?.engine || null;

  return (
    <div className="register">
      <div className="register-top">
        <img src="/logo1.png" alt="Logo" style={{ height: "40px" }} />
        <button className="icon-btn close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="register-body">
        <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "4px", marginTop: 0 }}>Opps you&apos;re hacked by Securinets</h1>
        <p className="sub" style={{ marginTop: 0 }}>Digital Footprint Report — professional security audit (educational demo)</p>
        {error && !deleted && <p className="error api">{error}</p>}
        {(deleted || error) && (
          <div>
            <p className="sub">{t("view.deleted")}</p>
            <button className="btn-primary" onClick={onClose}>{t("view.close")}</button>
          </div>
        )}
        {data && !deleted && (
          <>
            <div className="report-summary">
              {summaryRows.map((r, i) => (
                <p className="report-line" key={i}><strong>{r.label} : </strong>{r.value}</p>
              ))}
              {hasCoords && (
                <p className="report-line small">
                  <a href={`https://www.google.com/maps?q=${lat},${lon}`} target="_blank" rel="noreferrer">
                    {fr ? "Ouvrir dans Google Maps" : "Open in Google Maps"}
                  </a>
                  {" · "}
                  <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=13/${lat}/${lon}`} target="_blank" rel="noreferrer">
                    OpenStreetMap
                  </a>
                </p>
              )}
            </div>

            <CleanSection
              title={fr ? "Compte" : "Account"}
              rows={[
                data.email && { label: "Email", value: data.email },
                data.fullName && { label: fr ? "Nom complet" : "Full name", value: data.fullName },
                formatDateTunis(data.createdAt, uiLang) && { label: fr ? "Créé le" : "Registered on", value: formatDateTunis(data.createdAt, uiLang) },
              ]}
            />

            <CleanSection
              title={fr ? "Localisation" : "Location"}
              rows={[
                placeLabel && { label: fr ? "Lieu" : "Place", value: placeLabel },
                accuracy && { label: "GPS", value: accuracy },
                tzLabel(cm.timezone, cm.timezoneOffsetMin) && { label: fr ? "Fuseau horaire" : "Time zone", value: tzLabel(cm.timezone, cm.timezoneOffsetMin) },
                formatDateTunis(sm.receivedAt, uiLang) && { label: fr ? "Enregistré le" : "Recorded on", value: formatDateTunis(sm.receivedAt, uiLang) },
              ]}
            />

            <CleanSection
              title={fr ? "Appareil" : "Device"}
              rows={[
                os && { label: fr ? "Système" : "OS", value: os },
                hints?.model && { label: fr ? "Modèle" : "Model", value: hints.model },
                screenText(cm) && { label: fr ? "Écran" : "Screen", value: screenText(cm) },
                windowText(cm) && { label: fr ? "Fenêtre" : "Window", value: windowText(cm) },
                cm.screen?.orientation && { label: "Orientation", value: cm.screen.orientation },
                perfText(cm.hardware, uiLang) && { label: "CPU / RAM", value: perfText(cm.hardware, uiLang) },
                typeof cm.hardware?.maxTouchPoints === "number" && {
                  label: fr ? "Tactile" : "Touch",
                  value: cm.hardware.maxTouchPoints > 0 ? (fr ? `Oui (${cm.hardware.maxTouchPoints} pts)` : `Yes (${cm.hardware.maxTouchPoints} pts)`) : (fr ? "Non" : "No"),
                },
                cm.gpu && { label: "GPU", value: cm.gpu },
              ]}
            />

            <CleanSection
              title={fr ? "Navigateur et réseau" : "Browser & network"}
              rows={[
                browser && { label: fr ? "Navigateur" : "Browser", value: browser },
                cm.vendor && { label: "Vendor", value: cm.vendor },
                langName(cm.language, uiLang) && { label: fr ? "Langue" : "Language", value: langName(cm.language, uiLang) },
                langList(cm.languages, uiLang) && cm.languages?.length > 1 && { label: fr ? "Autres langues" : "Other languages", value: langList(cm.languages, uiLang) },
                networkText(cm.network) && { label: fr ? "Connexion" : "Connection", value: networkText(cm.network) },
                typeof cm.network?.saveData === "boolean" && { label: "Data saver", value: cm.network.saveData ? "On" : "Off" },
                typeof cm.online === "boolean" && { label: "Online", value: cm.online ? (fr ? "Oui" : "Yes") : "No" },
                refHost && { label: fr ? "Venu de" : "Came from", value: refHost },
                ip && { label: "IP", value: ip },
              ]}
            />

            <CleanSection
              title={fr ? "Confidentialité" : "Privacy"}
              rows={[
                typeof cm.cookiesEnabled === "boolean" && { label: "Cookies", value: cm.cookiesEnabled ? (fr ? "Autorisés" : "Allowed") : (fr ? "Bloqués" : "Blocked") },
                cm.doNotTrack != null && cm.doNotTrack !== "" && { label: "Do Not Track", value: String(cm.doNotTrack) },
                typeof cm.webdriver === "boolean" && { label: "WebDriver", value: cm.webdriver ? (fr ? "Oui (automatisé)" : "Yes (automated)") : "No" },
                typeof cm.pdfViewerEnabled === "boolean" && { label: "PDF viewer", value: cm.pdfViewerEnabled ? (fr ? "Oui" : "Yes") : "No" },
              ]}
            />

            <CleanSection
              title={fr ? "Navigation" : "Browsing"}
              rows={[
                openTabs != null && {
                  label: fr ? "Onglets ouverts" : "Open tabs",
                  value: fr
                    ? `${openTabs} onglet(s) de ce site — les autres onglets sont invisibles par conception`
                    : `${openTabs} tab(s) of this site — other tabs are invisible by design`,
                },
                tabsContain && {
                  label: fr ? "Contenu des onglets" : "Tabs contain",
                  value: fr
                    ? `${tabsContain} (ce site uniquement — les autres sites sont masqués par le navigateur)`
                    : `${tabsContain} (this site only — other sites are hidden by the browser)`,
                },
                {
                  label: fr ? "Dernière recherche" : "Last search",
                  value: lastSearch
                    ? `${lastSearch}${lastSearchEngine ? ` (${lastSearchEngine})` : ""}`
                    : fr
                      ? "Non accessible — l'historique de recherche est masqué par le navigateur"
                      : "Not accessible — search history is hidden by the browser",
                },
              ]}
            />

            <button className="btn-primary" onClick={destroy}>{t("view.deleteNow")}</button>

            <div style={{ background: "#fef9c3", border: "2px solid #eab308", borderRadius: "12px", padding: "16px", marginTop: "16px", marginBottom: "24px", color: "#422006", lineHeight: 1.6, fontSize: "0.95rem", overflowWrap: "break-word" }}>
              <p style={{ fontWeight: 800, fontSize: "1.05rem", margin: "0 0 10px" }}>{t("view.lessonTitle")}</p>
              {t("view.lessonBody").split("\n\n").map((para, i) => (
                <p key={i} style={{ margin: "0 0 10px" }}>{para}</p>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
