// Runs on GradeItRight pages. Copies the Supabase session cookie into
// chrome.storage so the popup can authenticate sync requests. The web app
// itself is untouched — this script just reads what login already set.
(() => {
  const chunks = document.cookie
    .split("; ")
    .map((c) => /^(sb-.+-auth-token(?:\.(\d+))?)=(.*)$/.exec(c))
    .filter(Boolean)
    .sort((a, b) => Number(a[2] ?? 0) - Number(b[2] ?? 0));
  if (chunks.length === 0) return;

  try {
    let raw = decodeURIComponent(chunks.map((m) => m[3]).join(""));
    if (raw.startsWith("base64-")) {
      raw = atob(raw.slice(7).replace(/-/g, "+").replace(/_/g, "/"));
    }
    const session = JSON.parse(raw);
    if (session.access_token) {
      chrome.storage.local.set({
        session: {
          access_token: session.access_token,
          expires_at: session.expires_at,
          email: session.user?.email,
        },
      });
    }
  } catch {
    // Unrecognized cookie format — leave any stored session as-is.
  }
})();
