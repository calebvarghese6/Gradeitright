-- Prevent users from granting themselves premium: the self-update RLS policy
-- on profiles covers every column, so restrict UPDATE privileges to the only
-- column users may legitimately change themselves (onboarding_completed).
-- is_premium changes must come from privileged (service-role) contexts.

revoke update on table public.profiles from authenticated;
grant update (onboarding_completed) on table public.profiles to authenticated;
