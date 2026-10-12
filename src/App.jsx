import React, { useEffect, useState } from "react";
import Landing from "./Landing.jsx";
import Register from "./Register.jsx";
import ViewRecord from "./ViewRecord.jsx";
import { detectLang } from "./i18n.js";
import { recordVisit, bumpTotalSiteVisits } from "./visits.js";
import { startTabHeartbeat, heartbeatTab } from "./tabs.js";

function route() {
  const h = window.location.hash || "#";
  if (h.startsWith("#view/")) return { page: "view", token: h.slice(6) };
  if (h === "#register") return { page: "register" };
  return { page: "landing" };
}

export default function App() {
  const [r, setR] = useState(route());
  const [lang, setLang] = useState(detectLang());

  const go = (hash) => {
    window.history.pushState(null, "", hash);
    setR(route());
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const onPop = () => setR(route());
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onPop);
    document.documentElement.lang = lang;
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onPop);
    };
  }, [lang]);

  // Record our own pages for this tab session (the only history we can know).
  // Also heartbeat this tab so collect.js can count open tabs of this site,
  // and bump the persistent same-site page-view counter.
  useEffect(() => {
    const stop = startTabHeartbeat();
    return stop;
  }, []);
  useEffect(() => {
    recordVisit(r.page);
    bumpTotalSiteVisits();
    heartbeatTab();
  }, [r.page]);

  const setLangPersist = (l) => {
    localStorage.setItem("app-lang", l);
    setLang(l === "auto" ? detectLang() : l);
  };

  return (
    <div className="phone">
      <div className="langbar">
        <label htmlFor="lang">🌐 {lang === "fr" ? "Langue" : "Language"}</label>
        <select
          id="lang"
          value={localStorage.getItem("app-lang") || "auto"}
          onChange={(e) => setLangPersist(e.target.value)}
        >
          <option value="auto">Auto ({(navigator.language || "en").split("-")[0]})</option>
          <option value="en">English</option>
          <option value="fr">Français</option>
        </select>
      </div>
      {r.page === "landing" && <Landing lang={lang} onRegister={() => go("#register")} />}
      {r.page === "register" && <Register lang={lang} onClose={() => go("#")} />}
      {r.page === "view" && <ViewRecord lang={lang} token={r.token} onClose={() => go("#")} />}
    </div>
  );
}
