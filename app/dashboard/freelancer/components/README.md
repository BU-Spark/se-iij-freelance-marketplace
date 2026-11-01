# Freelancer dashboard components

Import components and Props types as named exports from `./components`.
Internal component imports use direct sibling paths to avoid barrel cycles.

- `TaskCard` / `TaskCardProps`: assignment content and freelancer-relative status.
- `TaskSummary` / `TaskSummaryProps`: counts and links that select a task status.
- `ActiveAssignments` / `ActiveAssignmentsProps`: ongoing work, independent of feed filters.
- `TaskFilters` / `TaskFiltersProps`: controlled search, status, category and location inputs.
- `TaskPagination` / `TaskPaginationProps`: controlled page navigation.

`FreelancerDashboard` retains filter/page state and task ownership selection. Its existing default export remains compatible with callers; `FreelancerDashboardProps` is exported.
`freelancer.utils.ts` owns shared feed status types, labels, page size and status derivation.
