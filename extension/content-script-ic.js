// Runs on Infinite Campus pages. Reads grades via IC's own portal JSON API
// (same-origin, uses the student's existing login) when the popup asks.
// Falls back to scraping visible tables on legacy portals.
(() => {
  if (window.__gradeitrightLoaded) return;
  window.__gradeitrightLoaded = true;

  async function fetchJson(url) {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`${response.status}`);
    return response.json();
  }

  function toAssignment(a, categoryName) {
    const pointsEarned =
      a.notGraded || a.scorePoints == null ? null : Number(a.scorePoints);
    return {
      name: a.assignmentName,
      pointsEarned,
      pointsPossible: Number(a.totalPoints),
      date: a.dueDate ? a.dueDate.slice(0, 10) : null,
      isRemaining: a.notGraded || a.scorePoints == null,
      ...(categoryName ? { categoryName } : {}),
    };
  }

  function validAssignment(a) {
    return (
      a.name &&
      Number.isFinite(a.pointsPossible) &&
      a.pointsPossible > 0 &&
      (a.pointsEarned === null || Number.isFinite(a.pointsEarned))
    );
  }

  // Among a section's grading-task entries (one per term, plus exam/final
  // composites), pick whichever has the richest assignment list — that's
  // the student's actual current gradebook view, not a summary task.
  function pickPrimaryEntry(details) {
    let best = null;
    let bestCount = 0;
    for (const entry of details ?? []) {
      const count = (entry.categories ?? []).reduce(
        (s, c) => s + (c.assignments?.length ?? 0),
        0,
      );
      if (count > bestCount) {
        best = entry;
        bestCount = count;
      }
    }
    return best;
  }

  // Campus Student SPA: enrollments -> sections -> weighted category detail
  // (falls back to a flat per-section assignment list on failure).
  async function collectFromApi() {
    const enrollments = await fetchJson("/campus/resources/portal/grades");
    const seen = new Set();
    const classes = [];

    for (const enrollment of enrollments) {
      for (const course of enrollment.courses ?? []) {
        if (course.dropped || !course.sectionID || seen.has(course.sectionID))
          continue;
        seen.add(course.sectionID);

        const cls = await collectSection(course).catch(() => null);
        if (cls?.assignments.length) classes.push(cls);
      }
    }
    return classes;
  }

  async function collectSection(course) {
    const detail = await fetchJson(
      `/campus/resources/portal/grades/detail/${course.sectionID}`,
    ).catch(() => null);
    const entry = detail ? pickPrimaryEntry(detail.details) : null;

    if (entry) {
      const isWeighted = entry.task.groupWeighted === true;
      const assignments = [];
      const categories = [];
      for (const cat of entry.categories ?? []) {
        if (isWeighted)
          categories.push({ name: cat.name, weightPercentage: cat.weight });
        for (const a of cat.assignments ?? []) {
          if (a.active === false) continue;
          const parsed = toAssignment(a, isWeighted ? cat.name : undefined);
          if (validAssignment(parsed)) assignments.push(parsed);
        }
      }
      return {
        name: course.courseName,
        gradingMode: isWeighted ? "weighted" : "points",
        ...(isWeighted ? { categories } : {}),
        assignments,
      };
    }

    // Fallback: flat per-assignment list, no category/weight breakdown.
    const list = await fetchJson(
      `/campus/api/portal/assignment/listView?sectionID=${course.sectionID}`,
    ).catch(() => []);
    const assignments = list
      .filter((a) => a.active !== false)
      .map((a) => toAssignment(a))
      .filter(validAssignment);
    return { name: course.courseName, gradingMode: "points", assignments };
  }

  // Legacy portal fallback: tables with "45/50"-style score cells.
  function collectFromTables() {
    const SCORE = /^(\d+(?:\.\d+)?|[-—*]?)\s*\/\s*(\d+(?:\.\d+)?)$/;
    const classes = [];
    for (const table of document.querySelectorAll("table")) {
      const assignments = [];
      for (const row of table.querySelectorAll("tr")) {
        let name = null;
        let earned = null;
        let possible = null;
        for (const cell of row.querySelectorAll("td")) {
          const text = cell.textContent.trim().replace(/\s+/g, " ");
          const score = SCORE.exec(text);
          if (score && possible === null) {
            earned = /^\d/.test(score[1]) ? Number(score[1]) : null;
            possible = Number(score[2]);
          } else if (
            !name &&
            text.length > 1 &&
            !/^\d+(\.\d+)?%?$/.test(text)
          ) {
            name = text;
          }
        }
        if (name && possible > 0) {
          assignments.push({
            name,
            pointsEarned: earned,
            pointsPossible: possible,
            date: null,
            isRemaining: earned === null,
          });
        }
      }
      if (assignments.length > 0) {
        const heading = table.closest("div")?.querySelector("h1,h2,h3,h4");
        classes.push({
          name: heading?.textContent.trim() ?? document.title.trim(),
          gradingMode: "points",
          assignments,
        });
      }
    }
    return classes;
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "collect-grades") return false;
    collectFromApi()
      .catch(() => [])
      .then((classes) => {
        if (classes.length === 0) classes = collectFromTables();
        console.log("[GradeItRight] scraped", classes);
        sendResponse({ classes });
      });
    return true; // async response
  });
})();
