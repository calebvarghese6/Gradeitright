export type GradingMode = "points" | "weighted";

export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

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
  quarter: Quarter;
  created_at: string;
}

export interface TargetGradeRow {
  id: string;
  class_id: string;
  target_percentage: number;
  quarter: Quarter;
  created_at: string;
}

export interface ClassRow {
  id: string;
  user_id: string;
  name: string;
  grading_mode: GradingMode;
  current_quarter_override: Quarter | null;
  created_at: string;
}

export interface ClassWithDetails extends ClassRow {
  categories: CategoryRow[];
  assignments: AssignmentRow[];
  target_grades: TargetGradeRow[];
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
  is_premium: boolean;
  created_at: string;
}

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused";

export interface SubscriptionRow {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  price_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export type SyncSource = "infinite_campus" | "google_classroom";

export interface SyncRow {
  id: string;
  user_id: string;
  synced_at: string;
  source: SyncSource;
  records_updated: number;
}
