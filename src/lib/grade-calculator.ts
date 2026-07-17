import type {
  AssignmentRow,
  CategoryRow,
  ClassWithDetails,
  Quarter,
} from "~/lib/supabase/types";

export type GradeStatus = "green" | "yellow" | "red" | "none";

export interface GradeResult {
  currentGrade: number | null;
  targetPercentage: number | null;
  targetLabel: string | null;
  requiredScore: number | null;
  highestAchievable: number | null;
  status: GradeStatus;
  summary: string;
}

export const GRADE_LETTER_PRESETS: Record<string, number> = {
  A: 90,
  B: 80,
  C: 70,
};

interface RawResult {
  currentGrade: number | null;
  requiredScore: number | null;
  highestAchievable: number | null;
  status: GradeStatus;
  hasRemainingWork: boolean;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function finalGradeResult(finalGrade: number, target: number): RawResult {
  return {
    currentGrade: finalGrade,
    requiredScore: null,
    highestAchievable: finalGrade,
    status: finalGrade >= target ? "green" : "red",
    hasRemainingWork: false,
  };
}

function statusFor(required: number, currentGrade: number | null): GradeStatus {
  if (required > 100) return "red";
  const effectiveCurrent = currentGrade ?? 0;
  return required <= 0 || required <= effectiveCurrent ? "green" : "yellow";
}

function calculatePoints(
  assignments: AssignmentRow[],
  target: number | null,
): RawResult {
  const completed = assignments.filter((a) => !a.is_remaining);
  const remaining = assignments.filter((a) => a.is_remaining);

  const earned = completed.reduce((s, a) => s + (a.points_earned ?? 0), 0);
  const possible = completed.reduce((s, a) => s + a.points_possible, 0);
  const remainingPossible = remaining.reduce(
    (s, a) => s + a.points_possible,
    0,
  );

  const currentGrade = possible > 0 ? (earned / possible) * 100 : null;

  if (target == null) {
    return {
      currentGrade,
      requiredScore: null,
      highestAchievable: null,
      status: "none",
      hasRemainingWork: remainingPossible > 0,
    };
  }

  if (remainingPossible === 0) {
    if (currentGrade == null) {
      return {
        currentGrade: null,
        requiredScore: null,
        highestAchievable: null,
        status: "none",
        hasRemainingWork: false,
      };
    }
    return finalGradeResult(currentGrade, target);
  }

  const totalPossible = possible + remainingPossible;
  const required =
    ((target / 100) * totalPossible - earned) / remainingPossible;
  const requiredPercent = required * 100;
  const highestAchievable =
    ((earned + remainingPossible) / totalPossible) * 100;
  const status = statusFor(requiredPercent, currentGrade);

  return {
    currentGrade,
    hasRemainingWork: true,
    requiredScore: status === "red" ? null : Math.max(requiredPercent, 0),
    highestAchievable: status === "red" ? highestAchievable : null,
    status,
  };
}

function calculateWeighted(
  categories: CategoryRow[],
  assignments: AssignmentRow[],
  target: number | null,
): RawResult {
  const perCategory = categories.map((cat) => {
    const catAssignments = assignments.filter((a) => a.category_id === cat.id);
    const completed = catAssignments.filter((a) => !a.is_remaining);
    const remaining = catAssignments.filter((a) => a.is_remaining);
    const earned = completed.reduce((s, a) => s + (a.points_earned ?? 0), 0);
    const possible = completed.reduce((s, a) => s + a.points_possible, 0);
    const remainingPossible = remaining.reduce(
      (s, a) => s + a.points_possible,
      0,
    );
    return {
      weight: cat.weight_percentage / 100,
      earned,
      possible,
      remainingPossible,
      totalPossible: possible + remainingPossible,
    };
  });

  // Categories with no assignments recorded yet (e.g. a final exam that
  // hasn't happened) must still hold their full weight as "remaining" —
  // dropping them would let their entire weight vanish from the grade.
  const currentCategories = perCategory.filter((c) => c.possible > 0);
  const currentWeightSum = currentCategories.reduce((s, c) => s + c.weight, 0);
  const currentGrade =
    currentWeightSum > 0
      ? (currentCategories.reduce(
          (s, c) => s + c.weight * (c.earned / c.possible),
          0,
        ) /
          currentWeightSum) *
        100
      : null;

  const totalWeight = perCategory.reduce((s, c) => s + c.weight, 0);

  if (target == null || perCategory.length === 0 || totalWeight === 0) {
    return {
      currentGrade: target == null ? currentGrade : null,
      requiredScore: null,
      highestAchievable: null,
      status: "none",
      hasRemainingWork: perCategory.some(
        (c) => c.remainingPossible > 0 || c.totalPossible === 0,
      ),
    };
  }

  const banked = perCategory.reduce((s, c) => {
    const bankedFraction = c.totalPossible > 0 ? c.earned / c.totalPossible : 0;
    return s + (c.weight / totalWeight) * bankedFraction;
  }, 0);
  const remainingCoefficient = perCategory.reduce((s, c) => {
    const remainingFraction =
      c.totalPossible > 0 ? c.remainingPossible / c.totalPossible : 1;
    return s + (c.weight / totalWeight) * remainingFraction;
  }, 0);

  if (remainingCoefficient === 0) {
    return finalGradeResult(banked * 100, target);
  }

  const required = (target / 100 - banked) / remainingCoefficient;
  const requiredPercent = required * 100;
  const highestAchievable = (banked + remainingCoefficient) * 100;
  const status = statusFor(requiredPercent, currentGrade);

  return {
    currentGrade,
    hasRemainingWork: true,
    requiredScore: status === "red" ? null : Math.max(requiredPercent, 0),
    highestAchievable: status === "red" ? highestAchievable : null,
    status,
  };
}

export function toLetterGrade(pct: number): string {
  if (pct >= 97) return "A+";
  if (pct >= 93) return "A";
  if (pct >= 90) return "A-";
  if (pct >= 87) return "B+";
  if (pct >= 83) return "B";
  if (pct >= 80) return "B-";
  if (pct >= 77) return "C+";
  if (pct >= 73) return "C";
  if (pct >= 70) return "C-";
  if (pct >= 67) return "D+";
  if (pct >= 63) return "D";
  if (pct >= 60) return "D-";
  return "F";
}

function targetLabelFor(target: number): string {
  for (const [letter, cutoff] of Object.entries(GRADE_LETTER_PRESETS)) {
    if (target === cutoff) return letter;
  }
  return `${round1(target)}%`;
}

function buildSummary(params: {
  className: string;
  label: string;
  remainingName: string | null;
  result: RawResult;
}): string {
  const { className, label, remainingName, result } = params;
  const {
    status,
    currentGrade,
    requiredScore,
    highestAchievable,
    hasRemainingWork,
  } = result;

  if (status === "none") {
    return label === ""
      ? "Add a target grade to see what you need on what's left."
      : `Add assignments to see what you need for a ${label} in ${className}.`;
  }

  if (!hasRemainingWork) {
    const grade = round1(currentGrade ?? 0);
    return status === "green"
      ? `${className} is done — you finished with a ${grade}%, hitting your ${label} target.`
      : `${className} is done — you finished with a ${grade}%, short of your ${label} target.`;
  }

  if (status === "red") {
    return `Even a perfect score on everything left in ${className} tops out at ${round1(highestAchievable ?? 0)}% — short of your ${label} target.`;
  }

  if (requiredScore != null && requiredScore <= 0) {
    return `You're already on track for at least a ${label} in ${className}, even with a 0% on everything remaining.`;
  }

  const scoreText = Math.round(requiredScore ?? 0);
  const target = remainingName
    ? `on your ${remainingName}`
    : "on your remaining assignments";
  return `You need a ${scoreText}% ${target} to finish ${className} with a ${label}.`;
}

export function calculateClassGrade(
  cls: ClassWithDetails,
  quarter: Quarter,
): GradeResult {
  const assignments = cls.assignments.filter((a) => a.quarter === quarter);
  const target =
    cls.target_grades.find((t) => t.quarter === quarter)?.target_percentage ??
    null;

  const result =
    cls.grading_mode === "weighted"
      ? calculateWeighted(cls.categories, assignments, target)
      : calculatePoints(assignments, target);

  const remaining = assignments.filter((a) => a.is_remaining);
  const remainingName = remaining.length === 1 ? remaining[0].name : null;
  const label = target != null ? targetLabelFor(target) : null;

  const summary = buildSummary({
    className: cls.name,
    label: label ?? "",
    remainingName,
    result,
  });

  return {
    currentGrade:
      result.currentGrade != null ? round1(result.currentGrade) : null,
    targetPercentage: target,
    targetLabel: label,
    requiredScore:
      result.requiredScore != null ? round1(result.requiredScore) : null,
    highestAchievable:
      result.highestAchievable != null
        ? round1(result.highestAchievable)
        : null,
    status: result.status,
    summary,
  };
}
