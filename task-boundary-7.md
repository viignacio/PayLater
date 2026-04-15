task_boundary:
  description: "Implement Phase 4: Clean up remaining Supabase dependencies"
  prompt: |
    ## Task Description
    Refactor or remove the remaining files that use Supabase.
    
    1. `src/app/api/users/active/route.ts`: Update to use Clerk's `auth()` and Drizzle (`db`).
    2. `src/app/api/trips/[id]/members/route.ts`: Update to use Clerk and Drizzle.
    3. `src/app/api/trips/[id]/members/[userId]/route.ts`: Update to use Clerk and Drizzle.
    4. Remove `src/contexts/AuthContext.tsx` (we use ClerkProvider now).
    5. Remove `src/components/auth/LoginPage.tsx` (we use Clerk's UI now).
    6. Remove `src/app/auth/callback/route.ts` (Clerk handles its own callbacks).
    7. Remove `src/lib/supabase/` entirely.

    ## Context
    We are finalizing the migration from Supabase to Clerk+Neon.

    ## Constraints
    - Verify that no auth context is imported anywhere else in the app.
