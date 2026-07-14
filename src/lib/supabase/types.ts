export type GradingMode = "points" | "weighted";

export interface CategoryRow {
  id: string;
  class_id: string;
  name: string;
  weight_percentage: number;
  created_at: string;
}

export interface AssignmentRow {
  id: string;
  class_id: string;
  category_id: string | null;
  name: string;
  points_earned: number | null;
  points_possible: number;
  is_remaining: boolean;
  created_at: string;
}

export interface TargetGradeRow {
  id: string;
  class_id: string;
  target_percentage: number;
  created_at: string;
}

export interface ClassRow {
  id: string;
  user_id: string;
  name: string;
  grading_mode: GradingMode;
  created_at: string;
}

export interface ClassWithDetails extends ClassRow {
  categories: CategoryRow[];
  assignments: AssignmentRow[];
  target_grade: TargetGradeRow | null;
}

export interface AdminClassSummary {
  id: string;
  name: string;
  grading_mode: GradingMode;
  created_at: string;
  assignment_count: number;
}

export interface AdminUserOverview {
  user_id: string;
  email: string;
  user_created_at: string;
  classes: AdminClassSummary[];
}

export interface ProfileRow {
  user_id: string;
  onboarding_completed: boolean;
  created_at: string;
}
