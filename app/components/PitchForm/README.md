# Freelancer pitch components

Import public components and their Props with named imports from `app/components/PitchForm`.
The Next.js route remains a default export.

- `PitchComposer`: account-scoped local draft container, validation and review state.
- `PitchForm` / `PitchFormProps`: controlled form; accepts `draft`, `errors`, `onChange`, `onReview`, `onSaveDraft`.
- `CompensationFields` / `CompensationFieldsProps`: controlled amount, currency and rate basis fields.
- `PitchPreview` / `PitchPreviewProps`: read-only review with edit and draft-save callbacks.
- `PitchDraft`, `PitchCompensation`, `PitchFormErrors`: exported shared types from `app/types/pitchForm.types.ts`.

Example:

```tsx
import { PitchForm } from './components/PitchForm';
import type { PitchDraft, PitchFormProps } from './components/PitchForm';
```

## Persistence and backend handoff

Drafts are saved explicitly under `iij:pitch-draft:<Clerk user ID>` in localStorage.
Partial drafts can be saved. Review requires valid fields. Nothing is sent to editors or collaborators.
The submit button remains disabled until an authenticated submission API is supplied.

The generated slug is derived from the title and is not guaranteed unique; the server must resolve uniqueness.
Compensation amount stays a string while editing to preserve decimal input. Validate and normalize it at the API boundary.
Optional invites currently mean collaborator email addresses; confirm the recipient model before integration.
Use the authenticated server identity rather than trusting a user ID in a future request payload.
