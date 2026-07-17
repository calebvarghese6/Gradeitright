// Sends scraped grade data to the GradeItRight backend.
// Loaded by popup.html before popup.js.

const APP_URL = "http://localhost:3000"; // swap to production URL before publishing

// biome-ignore lint/correctness/noUnusedVariables: called from popup.js
async function sendGrades(token, classes) {
  try {
    const response = await fetch(`${APP_URL}/api/extension-sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ source: "infinite_campus", classes }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        message: body.message ?? body.error ?? "Sync failed. Try again.",
      };
    }
    return {
      ok: true,
      recordsUpdated: body.recordsUpdated,
      classesCreated: body.classesCreated ?? 0,
      assignmentsCreated: body.assignmentsCreated ?? 0,
    };
  } catch {
    return {
      ok: false,
      message: "Couldn't reach GradeItRight. Is it running?",
    };
  }
}
