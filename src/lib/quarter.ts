import type { ClassRow, Quarter } from "~/lib/supabase/types";

export const QUARTER_ORDER: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

export type QuarterStatus = "completed" | "current" | "upcoming";

/**
 * Maps a calendar date to a school-year quarter using the spec's default
 * ranges (Q1 Aug-Oct, Q2 Nov-Jan, Q3 Feb-Mar, Q4 Apr-Jun). July falls in the
 * summer gap between quarters and maps to the upcoming Q1.
 */
export function getCurrentQuarterByDate(date: Date): Quarter {
  const month = date.getMonth(); // 0-11
  if (month >= 7 && month <= 9) return "Q1"; // Aug-Oct
  if (month === 10 || month === 11 || month === 0) return "Q2"; // Nov-Jan
  if (month === 1 || month === 2) return "Q3"; // Feb-Mar
  if (month >= 3 && month <= 5) return "Q4"; // Apr-Jun
  return "Q1"; // July
}

export function getEffectiveQuarter(
  cls: Pick<ClassRow, "current_quarter_override">,
  now: Date,
): Quarter {
  return cls.current_quarter_override ?? getCurrentQuarterByDate(now);
}

export function getQuarterStatus(
  quarter: Quarter,
  effectiveQuarter: Quarter,
): QuarterStatus {
  const idx = QUARTER_ORDER.indexOf(quarter);
  const currentIdx = QUARTER_ORDER.indexOf(effectiveQuarter);
  if (idx < currentIdx) return "completed";
  if (idx === currentIdx) return "current";
  return "upcoming";
}
