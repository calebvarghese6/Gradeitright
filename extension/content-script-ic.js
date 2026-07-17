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

  function countAssignments(entry) {
    return (entry.categories ?? []).reduce(
      (s, c) => s + (c.assignments?.length ?? 0),
      0,
    );
  }

  // Among a section's grading-task entries (one per term, plus exam/final
  // composites), pick whichever has the richest assignment list — that's
  // the student's actual current gradebook view, not a summary task.
  // Only used as a fallback when no entries carry a quarter label.
  function pickPrimaryEntry(details) {
    let best = null;
    let bestCount = 0;
    for (const entry of details ?? []) {
      const count = countAssignments(entry);
      if (count > bestCount) {
        best = entry;
        bestCount = count;
      }
    }
    return best;
  }

  // Map an IC grading-task entry to the school quarter it belongs to, from
  // its term name ("Q1", "Qtr 2", "Quarter 3", "23-24 Q4"). Composite tasks
  // (Semester Grade, Final Grade) carry no quarter number and return null,
  // which also keeps their duplicated assignments out of the sync.
  function quarterFromEntry(entry) {
    for (const label of [entry.task?.termName, entry.task?.taskName]) {
      if (!label) continue;
      const m = /q(?:uarter|tr)?\s*0?([1-4])\b/i.exec(label);
      if (m) return `Q${m[1]}`;
    }
    return null;
  }

  // Which term the student has highlighted in the Campus Student UI right
  // now. IC marks the chosen term tab/option as selected or active; its
  // label carries the quarter number ("Q3", "Qtr 3 (01/06 - 03/13)"). This
  // is what drives GradeItRight's current quarter — the student's own view,
  // not a guess from dates or from which term has the most data.
  function selectedQuarterFromDom() {
    const candidates = document.querySelectorAll(
      "[aria-selected='true'], [aria-current], [class*='selected' i], [class*='active' i]",
    );
    for (const el of candidates) {
      const text = el.textContent.trim().replace(/\s+/g, " ");
      // A term label is short; long text means we matched a container.
      if (!text || text.length > 30) continue;
      const m = /(?:^|\b)(?:q|qtr|quarter)\s*0?([1-4])\b/i.exec(text);
      if (m) return `Q${m[1]}`;
    }
    return null;
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

    // Preferred path: IC returns one grading-task entry per term. Keep every
    // quarter-labeled entry (the richest one per quarter — schools often add
    // empty "progress" tasks for the same term) and tag each assignment with
    // its quarter, so Q1 work lands in Q1 and Q2 work in Q2 instead of
    // everything collapsing into whichever term happened to look "primary".
    const byQuarter = new Map();
    for (const candidate of detail?.details ?? []) {
      const quarter = quarterFromEntry(candidate);
      if (!quarter || countAssignments(candidate) === 0) continue;
      const prev = byQuarter.get(quarter);
      if (!prev || countAssignments(prev) < countAssignments(candidate)) {
        byQuarter.set(quarter, candidate);
      }
    }

    if (byQuarter.size > 0) {
      const assignments = [];
      const categoriesByName = new Map();
      let isWeighted = false;
      for (const [quarter, entry] of byQuarter) {
        const entryWeighted = entry.task.groupWeighted === true;
        if (entryWeighted) isWeighted = true;
        for (const cat of entry.categories ?? []) {
          // Category weights are the same class setup every term; merge by
          // name across quarters instead of duplicating.
          if (entryWeighted && !categoriesByName.has(cat.name)) {
            categoriesByName.set(cat.name, {
              name: cat.name,
              weightPercentage: cat.weight,
            });
          }
          for (const a of cat.assignments ?? []) {
            if (a.active === false) continue;
            const parsed = toAssignment(
              a,
              entryWeighted ? cat.name : undefined,
            );
            if (validAssignment(parsed))
              assignments.push({ ...parsed, quarter });
          }
        }
      }
      return {
        name: course.courseName,
        gradingMode: isWeighted ? "weighted" : "points",
        ...(isWeighted ? { categories: [...categoriesByName.values()] } : {}),
        assignments,
      };
    }

    // No quarter-labeled terms found: fall back to the single richest entry,
    // untagged — the server files untagged assignments into the class's
    // current quarter.
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
        const selectedQuarter = selectedQuarterFromDom();
        console.log("[GradeItRight] scraped", { selectedQuarter, classes });
        sendResponse({ classes, selectedQuarter });
      });
    return true; // async response
  });
})();
