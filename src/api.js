// Frontend API client — points at the Express backend.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function registerUser({ email, fullName, password, clientMeta }) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, fullName, password, clientMeta }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Error");
  }
  return data;
}

export async function fetchRecord(token) {
  const res = await fetch(`${API_URL}/api/records/${encodeURIComponent(token)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Not found");
  return data;
}

export async function deleteRecord(token) {
  // sendBeacon-friendly: keepalive ensures delivery during pagehide/unload
  try {
    const res = await fetch(`${API_URL}/api/records/${encodeURIComponent(token)}`, {
      method: "DELETE",
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}
