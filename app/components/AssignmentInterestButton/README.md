# AssignmentInterestButton

Frontend-only, controlled interest action. This PR does not connect assignment cards, persistence, API routes, or database changes.

Use named imports from the component directory:

```tsx
import { AssignmentInterestButton } from './components/AssignmentInterestButton';
import type { AssignmentInterestButtonProps, AssignmentInterestState } from './components/AssignmentInterestButton';
```

## Props

- `assignmentTitle: string`: identifies the task in the accessible button name.
- `state: AssignmentInterestState`: discriminated union: `idle`, `submitting`, `interested`, or `error` with `message`.
- `onExpressInterest: () => void`: parent callback for the initial request or retry. Bind the assignment ID in the parent.
- `disabled?: boolean`: parent restriction, e.g. assignment closed or user not eligible.
- `className?: string`: additional wrapper styles.

The parent owns all state transitions. Clicking never sets success automatically. Mark `interested` only after a confirmed server response or confirmed initial server state. Do not treat a mock callback as real submission.

`submitting`, `interested`, and external `disabled` block interaction. An error enables retry unless externally disabled. Loading uses `aria-busy`; feedback uses a unique described-by ID and a live region.

The next PR will supply a parent controller to synchronously guard duplicate requests, bind the assignment ID, and preserve per-task state through filtering. This button alone does not deduplicate asynchronous requests, perform auth checks, or provide server idempotency.
