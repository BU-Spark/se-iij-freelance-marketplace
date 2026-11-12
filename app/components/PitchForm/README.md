# Freelancer pitch components

Import public components and their Props with named imports from `app/components/PitchForm`.
The Next.js route remains a default export.

- `PitchComposer`: account-scoped local draft container (auto-saves on every change) and send validation.
- `PitchForm` / `PitchFormProps`: controlled form; accepts `draft`, `errors`, `onChange`, `onSend`, and an optional footer `notice`.
- `CompensationFields` / `CompensationFieldsProps`: controlled USD amount field.
- `PitchDraft`, `PitchCompensation`, `PitchFormErrors`: exported shared types from `app/types/pitchForm.types.ts`.

Example:

```tsx
import { PitchForm } from './components/PitchForm';
import type { PitchDraft, PitchFormProps } from './components/PitchForm';
```

## Persistence and backend handoff

Drafts are saved automatically under `iij:pitch-draft:<Clerk user ID>` in localStorage.
Partial drafts are kept. Send pitch requires valid fields, but nothing is sent to editors or collaborators
until an authenticated submission API is supplied (see the TODO in `PitchComposer`).

The generated slug is derived from the title and is not guaranteed unique; the server must resolve uniqueness.
Compensation amount stays a string while editing to preserve decimal input. Validate and normalize it at the API boundary.
Optional invites currently mean collaborator email addresses; confirm the recipient model before integration.
Use the authenticated server identity rather than trusting a user ID in a future request payload.
