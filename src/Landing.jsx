import React, { useState } from "react";
import { BRAND, partners, tabs, courses, lists, footer } from "./data.js";
import { Menu, Search, Sparkle, Arrow, Social } from "./icons.jsx";
import { tr } from "./i18n.js";

const Img = ({ className = "", label = "" }) => (
  <div className={`img-ph ${className}`} role="img" aria-label="image placeholder">{label}</div>
);

const LinkList = ({ items }) => (
  <ul className="link-list">
    {items.map((i) => (<li key={i}><a href="#">{i}</a></li>))}
  </ul>
);

export default function Landing({ onRegister, lang }) {
  const t = (k, vars) => tr(lang, k, { brand: BRAND, ...vars });
  const [tab, setTab] = useState(0);

  return (
    <>
      <header className="header">
        <button className="icon-btn" aria-label="Menu"><Menu /></button>
        <img src="/logo1.png" alt="Logo" style={{ height: '80px' }} />
        <button className="icon-btn" aria-label="Assistant"><Sparkle /></button>
        <button className="icon-btn" aria-label="Rechercher"><Search /></button>
        <button className="btn-outline header-cta" onClick={onRegister}>{t("landing.signup")}</button>
      </header>

      <main>
        <section className="hero">
          <h1>{t("landing.title")}</h1>
          <p>{t("landing.subtitle")}</p>
          <button className="btn-white" onClick={onRegister}>{t("landing.cta")}</button>
          <p className="hero-small">{t("landing.ctaYear")}</p>
          <div className="hero-visual">
            <div className="hero-shape" />
            <img src="/image1.jpg" alt="Hero" className="hero-img" />
          </div>
        </section>

        <section className="section pad">
          <h2 className="h-sm">{t("landing.partners")}</h2>
          <div className="chips-scroll">
            <span className="partner-chip">
              <img src="/google.jpg" alt="Google" style={{ height: '20px', objectFit: 'contain', marginRight: '8px' }} />
              Google
            </span>
            <span className="partner-chip">
              <img src="/duke.png" alt="Duke" style={{ height: '20px', objectFit: 'contain', marginRight: '8px' }} />
              Duke University
            </span>
            <span className="partner-chip">
              <img src="/ibm.jpg" alt="IBM" style={{ height: '20px', objectFit: 'contain', marginRight: '8px' }} />
              IBM
            </span>
            <span className="partner-chip">
              <img src="/michigan.png" alt="Michigan" style={{ height: '20px', objectFit: 'contain', marginRight: '8px' }} />
              University of Michigan
            </span>
            <span className="partner-chip">
              <img src="/stanford.png" alt="Stanford" style={{ height: '20px', objectFit: 'contain', marginRight: '8px' }} />
              Stanford
            </span>
          </div>
        </section>

        <section className="skills-card">
          <h2 className="h-md">{t("landing.skills")}</h2>
          <p>{t("landing.skillsText")}</p>
          <a href="#" className="link-blue" onClick={(e) => { e.preventDefault(); onRegister(); }}>{t("landing.trialLink")} <Arrow /></a>

          <div className="tabs">
            {tabs.map((x, i) => (
              <button key={x} className={`tab ${i === tab ? "active" : ""}`} onClick={() => setTab(i)}>{x}</button>
            ))}
          </div>

          <div className="course-list">
            {courses.map((c) => (
              <a href="#" className="course" key={c.title}>
                <img 
                  src={
                    c.title.includes('Data') ? '/data_sc.png' : 
                    c.title.includes('Excel') ? '/exel.jpg' : 
                    '/cert1.png'
                  } 
                  alt={c.title} 
                  className="course-img" 
                  style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                />
                <div className="course-body">
                  <div className="course-by">
                    <img 
                      src={
                        c.by.includes('IBM') ? '/ibm.jpg' : 
                        c.by.includes('Google') ? '/google.jpg' : 
                        c.by.includes('Stanford') ? '/stanford.png' : 
                        '/duke.png'
                      } 
                      alt={c.by} 
                      style={{ height: '16px', width: 'auto', marginRight: '6px', objectFit: 'contain' }} 
                    />
                    {c.by}
                  </div>
                  <h3>{c.title}</h3>
                  <div className="course-meta">★ {c.rating} ({c.reviews}) · {c.level}</div>
                  <div className="badges">
                    {c.tags.map((tg) => (<span key={tg.t} className={`badge ${tg.c}`}>{tg.t}</span>))}
                  </div>
                </div>
              </a>
            ))}
          </div>
          <button className="btn-outline wide">{t("landing.showMore")}</button>
        </section>

        <section className="feature pad">
          <img 
            src="/cert1.png" 
            alt="Certificats" 
            className="feature-img" 
            style={{ opacity: 1, filter: 'none', width: '100%', height: 'auto' }} 
          />
          <h2 className="h-sm">{t("landing.proof")}</h2>
          <p>{t("landing.proofText")}</p>
        </section>

        <section className="feature pad">
          <img 
            src="/cert2.png" 
            alt="Progression" 
            className="feature-img" 
            style={{ opacity: 1, filter: 'none', width: '100%', height: 'auto' }} 
          />
          <h2 className="h-sm">{t("landing.progress")}</h2>
          <p>{t("landing.progressText")}</p>
        </section>

        <footer className="footer pad">
          <div className="footer-cols">
            <div>
              {footer.col1.map((b) => (
                <div className="footer-block" key={b.title}>
                  <h4>{b.title}</h4>
                  <LinkList items={b.items} />
                </div>
              ))}
            </div>
            <div>
              <div className="footer-block">
                <h4>Communauté</h4>
                <LinkList items={footer.community} />
              </div>
            </div>
          </div>

          <div className="footer-block">
            <h4>Plus</h4>
            <LinkList items={footer.more} />
          </div>

          <div className="footer-block">
            <h4 className="h-plain">Apprendre partout</h4>
            <div className="stores">
              <a href="#" className="store"><span>Télécharger dans</span><b>l'App Store</b></a>
              <a href="#" className="store"><span>DISPONIBLE SUR</span><b>Google Play</b></a>
            </div>
            <div className="socials">
              {["facebook", "linkedin", "twitter", "youtube", "instagram", "tiktok"].map((n) => (
                <a href="#" key={n} aria-label={n}><Social name={n} /></a>
              ))}
            </div>
            <p className="copy">© {new Date().getFullYear()} {BRAND}. Tous droits réservés.</p>
          </div>
        </footer>
      </main>

      <div className="sticky-cta">
        <button onClick={onRegister}>{t("landing.cta")}</button>
      </div>
    </>
  );
}
