// Popup logic: pick a state (signed out / not on IC / ready / done),
// and run the one-click sync against the active tab.

const show = (id) => document.getElementById(id).classList.remove("hidden");

init();

async function init() {
  const { session } = await chrome.storage.local.get("session");
  const expired = (session?.expires_at ?? 0) * 1000 < Date.now() + 60_000;
  if (!session?.access_token || expired) {
    show("signed-out");
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!/infinitecampus\.(com|org)/.test(tab?.url ?? "")) {
    show("not-ic");
    return;
  }

  show("ready");
  document
    .getElementById("sync")
    .addEventListener("click", () => runSync(tab.id, session.access_token));
}

async function runSync(tabId, token) {
  const button = document.getElementById("sync");
  const error = document.getElementById("sync-error");
  button.disabled = true;
  button.textContent = "Syncing…";
  error.classList.add("hidden");

  const fail = (message) => {
    error.textContent = message;
    error.classList.remove("hidden");
    button.disabled = false;
    button.textContent = "Sync Now";
  };

  let data;
  try {
    // Inject in case the tab predates the extension install, then ask for grades.
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content-script-ic.js"],
    });
    data = await chrome.tabs.sendMessage(tabId, { type: "collect-grades" });
  } catch {
    return fail("Couldn't read this page. Reload the tab and try again.");
  }
  if (!data?.classes?.length) {
    return fail("No grades found on this page. Open your gradebook view.");
  }

  const result = await sendGrades(token, data.classes, data.selectedQuarter);
  if (!result.ok) return fail(result.message);

  document.getElementById("ready").classList.add("hidden");
  const createdCount = result.classesCreated + result.assignmentsCreated;
  document.getElementById("done-message").textContent =
    `Grades synced successfully — ${result.recordsUpdated} updated` +
    (createdCount
      ? `, ${createdCount} new item${createdCount === 1 ? "" : "s"} added`
      : "") +
    ". View your dashboard.";
  show("done");
}

document
  .getElementById("open-login")
  .addEventListener("click", () =>
    chrome.tabs.create({ url: `${APP_URL}/login` }),
  );
document.getElementById("open-ic").addEventListener("click", () =>
  chrome.tabs.create({
    url: "https://www.infinitecampus.com/audience/parents-students",
  }),
);
document
  .getElementById("open-dashboard")
  .addEventListener("click", () =>
    chrome.tabs.create({ url: `${APP_URL}/dashboard` }),
  );
