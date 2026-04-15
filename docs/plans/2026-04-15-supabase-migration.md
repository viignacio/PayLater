# Supabase Migration Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Completely replace Supabase with Neon, Clerk, and Uploadthing.

**Architecture:** Use Drizzle ORM for Neon DB access, Clerk for Auth, and Uploadthing for Storage. Remove all Supabase-related hooks and clients.

**Tech Stack:** Next.js, Clerk, Neon, Drizzle ORM, Uploadthing.

---

### Task 1: Setup Dependencies
**Files:**
- Modify: `package.json`

**Step 1: Install dependencies**
Run: `npm install @clerk/nextjs drizzle-orm @neondatabase/serverless uploadthing @uploadthing/react`
Run: `npm install -D drizzle-kit`

**Step 2: Commit**
Run: `git add package.json package-lock.json && git commit -m "chore: add neon, clerk, and uploadthing dependencies"`

### Task 2: Drizzle Connection & Configuration
**Files:**
- Create: `drizzle.config.ts`
- Create: `src/lib/db/index.ts`

**Step 1: Create drizzle config**
```typescript
import { defineConfig } from 'drizzle-kit'
export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
```

**Step 2: Initialize DB client**
```typescript
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

**Step 3: Commit**
Run: `git add drizzle.config.ts src/lib/db/index.ts && git commit -m "feat: setup drizzle configuration"`

### Task 3: Define Schema
**Files:**
- Create: `src/lib/db/schema.ts`

**Step 1: Define tables in Drizzle**
(Translate the SQL migrations to Drizzle syntax, specifically changing UUIDs to TEXT for Clerk compatibility).

**Step 2: Commit**
Run: `git add src/lib/db/schema.ts && git commit -m "feat: define database schema in drizzle"`

### Task 4: Integrate Clerk Auth
**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/middleware.ts` (overwrite existing)
- Modify: `src/lib/supabase/server.ts` (remove)
- Create: `src/lib/auth.ts`

**Step 1: Add ClerkProvider to layout**
Wrap `{children}` with `<ClerkProvider>`.

**Step 2: Configure middleware**
Use `clerkMiddleware()` from `@clerk/nextjs`.

**Step 3: Commit**
Run: `git add src/app/layout.tsx src/middleware.ts && git commit -m "feat: integrate clerk authentication"`

### Task 5: Refactor API Routes
**Files:**
- Modify: `src/app/api/trips/route.ts`
- Modify: `src/app/api/expenses/route.ts`
- Modify: `src/app/api/settlements/route.ts`

**Step 1: Rewrite GET/POST routes using Drizzle**
Replace `supabase.auth.getUser()` with `auth()` from Clerk.
Replace `supabase.from()...` with `db.select()...` or `db.insert()...`.

**Step 2: Commit**
Run: `git commit -m "refactor: api routes to use drizzle and clerk"`

### Task 6: Uploadthing Integration
**Files:**
- Create: `src/app/api/uploadthing/core.ts`
- Create: `src/app/api/uploadthing/route.ts`
- Modify: `src/components/user/user-profile-modal.tsx`

**Step 1: Define File Router**
Setup the `qrCode` endpoint.

**Step 2: Update Profile Modal UI**
Replace the Supabase storage upload logic with Uploadthing's `useUploadThing` hook or `<UploadButton />`.

**Step 3: Commit**
Run: `git commit -m "feat: replace supabase storage with uploadthing"`

### Task 7: Final Cleanup
**Files:**
- Delete: `src/lib/supabase/`
- Modify: `package.json`

**Step 1: Remove Supabase code**
Delete all `.ts` files in `src/lib/supabase/`.

**Step 2: Uninstall packages**
Run: `npm uninstall @supabase/ssr @supabase/supabase-js`

**Step 3: Final Commit**
Run: `git commit -m "cleanup: remove supabase dependencies"`
