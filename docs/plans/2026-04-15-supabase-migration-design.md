# Design Doc: Migration to Neon, Clerk, and Uploadthing

## Goal
Migrate the PayLater application away from Supabase to a more stable, non-pausing serverless stack using Neon (Database), Clerk (Authentication), and Uploadthing (Storage).

## Architecture
- **Database**: Neon (Serverless Postgres)
- **Auth**: Clerk (Next.js SDK)
- **Storage**: Uploadthing
- **ORM**: Drizzle ORM

## Proposed Changes

### Database & Schema
- Define schema in `src/lib/db/schema.ts` using Drizzle.
- Update `profiles.id` and all related foreign keys from `UUID` to `TEXT` to accommodate Clerk's user IDs.
- Deploy schema to Neon.

### Authentication
- Replace `@supabase/ssr` with `@clerk/nextjs`.
- Remove `AuthContext.tsx`.
- Update middleware to use Clerk's `clerkMiddleware`.
- Replace `supabase.auth.getUser()` with Clerk's `auth()` helper in server components/routes.

### Storage
- Setup Uploadthing File Router in `src/app/api/uploadthing/core.ts`.
- Replace Supabase Storage upload logic in `UserProfileModal.tsx` with Uploadthing's hooks or components.

### Data Access
- Remove `supabase-js` and helper files in `src/lib/supabase/`.
- Initialize Drizzle client in `src/lib/db/index.ts`.
- Refactor all API routes in `src/app/api/` to use Drizzle for queries.

## Open Questions
- None. User has approved a fresh database start.

## Implementation Phases
1. **Setup**: Install dependencies and configure environment variables.
2. **Database**: Implement Drizzle schema and push to Neon.
3. **Auth**: Integrate Clerk and refactor middleware/context.
4. **Data Refactor**: Update API routes to use Drizzle.
5. **Storage**: Integrate Uploadthing and update profile modal.
6. **Cleanup**: Remove all remaining Supabase code and dependencies.
