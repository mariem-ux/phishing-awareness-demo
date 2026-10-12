import React, { useState } from "react";
import { BRAND } from "./data.js";
import { Close, Pencil, Eye, EyeOff, Google, Facebook, Apple } from "./icons.jsx";
import { registerUser } from "./api.js";
import { collectClientMeta } from "./collect.js";
import { tr } from "./i18n.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Register({ onClose, lang }) {
  const t = (k, vars) => tr(lang, k, { brand: BRAND, ...vars });
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [done, setDone] = useState(false);

  const vEmail = (v) => {
    const value = v.trim();
    if (!value) return t("err.emailRequired");
    if (value.length > 254 || !EMAIL_RE.test(value)) return t("err.email");
    return "";
  };
  const vName = (v) => {
    const value = v.trim();
    if (value.length < 2 || value.length > 100) return t("err.name");
    if (!/^[\p{L}][\p{L}\s'’.-]*$/u.test(value)) return t("err.name");
    return "";
  };
  const vPwd = (v) => (!v || v.length < 8 || v.length > 72 ? t("err.pwd") : "");
  const validators = { email: vEmail, fullName: vName, password: vPwd };
  const values = { email, fullName, password };

  const check = (field, value) => {
    const msg = validators[field](value);
    setErrors((e) => ({ ...e, [field]: msg }));
    return msg;
  };
  const blur = (f) => { setTouched((x) => ({ ...x, [f]: true })); check(f, values[f]); };
  const change = (f, setter) => (e) => {
    setter(e.target.value);
    if (touched[f]) check(f, e.target.value);
  };

  const submitStep1 = (e) => {
    e.preventDefault();
    setTouched((x) => ({ ...x, email: true }));
    if (check("email", email)) return;
    setStep(2);
  };

  const submitStep2 = async (e) => {
    e.preventDefault();
    setTouched((x) => ({ ...x, fullName: true, password: true }));
    const bad = [check("fullName", fullName), check("password", password)].some(Boolean);
    if (bad) return;
    setLoading(true);
    setApiError("");
    try {
      const clientMeta = await collectClientMeta();
      await registerUser({ email: email.trim(), fullName: fullName.trim(), password, clientMeta });
      setDone(true);
    } catch (err) {
      setApiError(err.message || t("err.generic"));
    } finally {
      setLoading(false);
    }
  };

  const social = (provider) => {
    window.location.href = `https://api.example.com/auth/${provider}`;
  };

  return (
    <div className="register" role="dialog" aria-modal="true">
      <div className="register-top">
        <img src="/logo1.png" alt="Logo" style={{ height: '40px' }} />
        <button className="icon-btn close" onClick={onClose} aria-label="Fermer"><Close /></button>
      </div>

      <div className="register-body">
        {step === 1 && (
          <form onSubmit={submitStep1} noValidate>
            <h1>{t("reg.step1.title")}</h1>
            <p className="sub">{t("reg.step1.sub")}</p>

            <label className="label" htmlFor="email">{t("reg.email")} <span className="req">*</span></label>
            <input id="email" type="email" inputMode="email" autoComplete="email" placeholder={t("reg.emailPh")}
              className={`input ${touched.email && errors.email ? "invalid" : ""}`}
              value={email} onChange={change("email", setEmail)} onBlur={() => blur("email")} />
            {touched.email && errors.email && <p className="error">{errors.email}</p>}

            <button type="submit" className="btn-primary">{t("reg.continue")}</button>

            <div className="or">{t("reg.or")}</div>

            <button type="button" className="btn-social" onClick={() => social("google")}><Google /> {t("reg.google")}</button>
            <button type="button" className="btn-social" onClick={() => social("facebook")}><Facebook /> {t("reg.facebook")}</button>
            <button type="button" className="btn-social" onClick={() => social("apple")}><Apple /> {t("reg.apple")}</button>

            <a href="#" className="org-link">{t("reg.org")}</a>
            <p className="terms">{t("reg.terms")}</p>
            <p className="terms consent">{t("reg.consent")}</p>
            <p className="terms">{t("reg.recaptcha")}</p>
          </form>
        )}

        {step === 2 && !done && (
          <form onSubmit={submitStep2} noValidate>
            <h1>{t("reg.step2.title")}</h1>
            <p className="sub">{t("reg.step1.sub")}</p>

            <label className="label" htmlFor="email2">{t("reg.email")} <span className="req">*</span></label>
            <div className="input-group">
              <input id="email2" className="input prefilled" value={email} readOnly />
              <button type="button" className="edit-btn" onClick={() => setStep(1)} aria-label={t("reg.editEmail")}><Pencil /></button>
            </div>

            <label className="label" htmlFor="name">{t("reg.name")} <span className="req">*</span></label>
            <input id="name" autoComplete="name" placeholder={t("reg.namePh")} autoFocus
              className={`input ${touched.fullName && errors.fullName ? "invalid" : ""}`}
              value={fullName} onChange={change("fullName", setFullName)} onBlur={() => blur("fullName")} />
            {touched.fullName && errors.fullName && <p className="error">{errors.fullName}</p>}

            <label className="label" htmlFor="pwd">{t("reg.pwd")} <span className="req">*</span></label>
            <p className="hint">{t("reg.pwdHint")}</p>
            <div className="input-group">
              <input id="pwd" type={showPwd ? "text" : "password"} autoComplete="new-password" placeholder={t("reg.pwdPh")} maxLength={80}
                className={`input pwd ${touched.password && errors.password ? "invalid" : ""}`}
                value={password} onChange={change("password", setPassword)} onBlur={() => blur("password")} />
              <button type="button" className="eye-btn" onClick={() => setShowPwd((s) => !s)} aria-label={showPwd ? t("reg.hide") : t("reg.show")}>
                {showPwd ? <Eye /> : <EyeOff />}
              </button>
            </div>
            {touched.password && errors.password && <p className="error">{errors.password}</p>}

            {apiError && <p className="error api">{apiError}</p>}
            <p className="terms consent">{t("reg.consent")}</p>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? t("reg.sending") : t("reg.submit")}
            </button>

            <p className="already">{t("reg.already")} <a href="#">{t("reg.login")}</a></p>
            <hr />
            <a href="#" className="org-link">{t("reg.org")}</a>
            <p className="terms">{t("reg.terms")}</p>
            <p className="terms">{t("reg.recaptcha")}</p>
          </form>
        )}

        {done && (
          <div>
            <h1>{t("reg.done")}</h1>
            <p className="sub">{t("reg.doneText")}</p>
            <button className="btn-primary" onClick={onClose}>{t("reg.close")}</button>
          </div>
        )}
      </div>
    </div>
  );
}
