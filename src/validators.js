const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(v) {
  const value = v.trim();
  if (!value) return "L'adresse e-mail est obligatoire.";
  if (value.length > 254 || !EMAIL_RE.test(value)) return "Saisissez une adresse e-mail valide.";
  return "";
}

export function validateName(v) {
  const value = v.trim();
  if (!value) return "Le nom complet est obligatoire.";
  if (value.length < 2) return "Le nom doit contenir au moins 2 caractères.";
  if (value.length > 100) return "Le nom est trop long.";
  if (!/^[\p{L}][\p{L}\s'’.-]*$/u.test(value)) return "Le nom ne peut contenir que des lettres.";
  return "";
}

export function validatePassword(v) {
  if (!v) return "Le mot de passe est obligatoire.";
  if (v.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (v.length > 72) return "Le mot de passe ne peut pas dépasser 72 caractères.";
  return "";
}
