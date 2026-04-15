task_boundary:
  description: "Implement Task 6.3: Refactor UserProfileModal to use Uploadthing"
  prompt: |
    ## Task Description
    Refactor `src/components/user/user-profile-modal.tsx` to upload files using Uploadthing instead of Supabase Storage.
    Remove all Supabase imports and logic related to storage.
    Since Uploadthing returns absolute URLs, the previous logic for generating signed URLs is no longer needed.
    
    ## Context
    We've replaced Supabase with Uploadthing (`src/app/api/uploadthing/core.ts`).
    Frontend helpers are in `src/lib/uploadthing.ts`.

    ## Constraints
    - Only modify `src/components/user/user-profile-modal.tsx`.
    - Use `useUploadThing("qrCode")` from `@/lib/uploadthing`.
    - Remove `createClient` from `@/lib/supabase/client`.
