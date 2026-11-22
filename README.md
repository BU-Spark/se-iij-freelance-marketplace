This is a template for Spark! DS 519 projects. It has pre-configured eslint.config.mjs - ([`ESLint`](https://eslint.org/)) and .prettierrc - ([`Prettier`](https://prettier.io/)) to reflect industry standard development guidelines.

## Setting Up Your Developer Experience

To get the most out of ESLint and Prettier, It is recommended to make the changes to you IDE:

#### Add this code to your _.vscode/settings.json_

```json
{
  "editor.formatOnSave": true,
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

#### Download these VSCode extensions:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Getting Started

This template uses Next.js. If you havent used Next before or need more information, take a look here:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

To run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result. Do not use Microsoft Edge 🤮

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Testing Your Application

This template comes pre-configured with a robust testing setup to help you ensure code quality and maintainability. We use [Jest](https://jestjs.io/) as the testing framework and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for testing React components.

<details>
  <summary><strong>Key Testing Features & Configuration</strong></summary>

#### Integrated Tools

- **Jest:** A delightful JavaScript Testing Framework with a focus on simplicity. It works out of the box for most Next.js projects.
- **React Testing Library (RTL):** Provides light-weight utility functions on top of `react-dom` and `react-dom/test-utils`, in a way that encourages better testing practices. Its primary guiding principle is: _"The more your tests resemble the way your software is used, the more confidence they can give you."_
- **`@testing-library/jest-dom`:** Custom Jest matchers to extend Jest with useful assertions for DOM states (e.g., `toBeInTheDocument()`, `toHaveClass()`).

#### Configuration Files

- **`jest.config.ts`:** The main configuration file for Jest. It defines how Jest discovers and runs your tests, what environment to use (e.g., `jsdom` for browser-like environment), and any transformations needed (e.g., using `ts-node` for TypeScript).
- **`jest.setup.ts`:** This file is run before each test suite. It's used for global test setup, such as importing `@testing-library/jest-dom` to make its matchers available in all tests, or for setting up global mocks (like the `window.matchMedia` mock included in this template).

#### Test File Location

- Tests are co-located with the components or modules they are testing. For example, tests for `MyComponent.tsx` would typically be in a file named `MyComponent.test.tsx` within the same directory. This makes it easy to find and manage tests alongside the code they cover. Our `jest.config.ts` is set up to discover these `*.test.tsx` (and `*.test.ts`) files.

</details>

<details>
  <summary><strong>Running Tests</strong></summary>

You can run your tests using the following npm scripts:

- **`npm test`**: Runs all tests once. This is also the command used by the automated pre-commit and pre-push hooks.
  ```bash
  npm test
  ```
- **`npm run test:watch`**: Runs tests in watch mode. Jest will re-run tests related to changed files, which is very useful during development.
  ```bash
  npm run test:watch
  ```
- **`npm run test:coverage`**: Runs all tests and generates a code coverage report. This helps you see what percentage of your codebase is covered by tests. The report will be generated in a `coverage/` directory.
  ```bash
  npm run test:coverage
  ```
  </details>

<details>
  <summary><strong>Automated Testing with Husky</strong></summary>

To maintain code quality and prevent regressions, this template uses [Husky](https://typicode.github.io/husky/) to manage Git hooks. The following hooks are configured:

- **`pre-commit`**: Before any commit is finalized, this hook runs:
  1.  `npx lint-staged`: Lints and formats staged files (`*.{js,jsx,ts,tsx}`) using ESLint and Prettier.
  2.  `npm test`: Runs the entire test suite.
      If either linting/formatting fails or any test fails, the commit will be aborted, allowing you to fix the issues before committing.

- **`pre-push`**: Before any push to a remote repository, this hook runs:
  1.  `npm test`: Runs the entire test suite.
      If any test fails, the push will be aborted.

This ensures that your codebase remains well-formatted, lint-free, and that all tests are passing before changes are shared or integrated.

</details>

<details>
  <summary><strong>Testing Philosophy</strong></summary>

- **Focus on User Behavior:** Write tests that verify the functionality of your components from a user's perspective. React Testing Library encourages this by providing utilities to query and interact with the DOM in a way similar to how a user would.
- **Unit & Integration Tests:** Aim for a healthy mix of unit tests (testing individual functions or components in isolation) and integration tests (testing how multiple components work together).
- **Confidence, Not Coverage Alone:** While code coverage is a useful metric, the primary goal of testing is to give you confidence that your application works as expected. Prioritize tests that cover critical user flows and complex logic.
- **Readable and Maintainable Tests:** Write clear, concise, and well-structured tests. Like your application code, test code should also be maintainable.
</details>

## Managing Environment Variables

Properly managing environment variables is crucial for security and for configuring your application differently across various environments (development, testing, production). Next.js has built-in support for environment variables.

- **Key File: `.env.local`**: Use this for your local development. It **must** be added to `.gitignore` to protect sensitive information like API keys.
- **Client-Side Variables**: To expose a variable to the browser, prefix it with `NEXT_PUBLIC_` (e.g., `NEXT_PUBLIC_ANALYTICS_ID`). These are accessible via `process.env.NEXT_PUBLIC_YOUR_VARIABLE`. **Never store secrets in `NEXT_PUBLIC_` variables.**
- **Server-Side Variables**: Variables without the `NEXT_PUBLIC_` prefix (e.g., `DATABASE_URL`) are only available server-side via `process.env.YOUR_VARIABLE`.
- **Best Practice: `.env.example`**: Create an `.env.example` file in your project root. This file should list all environment variables your application needs, with placeholder values. It **should be committed to version control** as a template for other developers.

For more comprehensive details, refer to the [official Next.js documentation on environment variables](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables).

## Adding Additional Tech

Most projects will require the use of other technologies. Below are a few guides and recommedations for integrating commonly used software into your Next.js project.

- [Next.js Setup w/ Prisma](https://www.dhiwise.com/post/the-ultimate-guide-to-next-js-prisma-setup)
- [Emotion & Next.js](https://www.dhiwise.com/post/implementing-nextjs-emotions-in-your-project) - Emotion is the default CSS-in JS library for all new Spark! projects. Use Emotion instead of styled-components, as styled-components is not as easily compatible with Server Side Rendering, or Typed CSS variables. Emotion is also more readily compatible with a wide array of component libraries.
- [Clerk Setup w/ Next.js](https://clerk.com/docs/quickstarts/nextjs) - Clerk will be the default user authentication software for all new Spark! projects. Please reach out to Omar for creating and retrieving API keys for your project. Do NOT use firebase/auth even if your project uses Firestore.
- ### Component Libraries
  All new projects will be required to use a [design system](https://www.figma.com/blog/design-systems-101-what-is-a-design-system/) You will receive designs from your DS488 design team which will utilize a design kit. Use the corresponding component library to implement those designs on the front end of your project.

## Database setup

Onboarding profiles are saved through `POST /api/onboarding` to PostgreSQL using the
server-only `DATABASE_URL`. Apply [`db/schema.sql`](./db/schema.sql) to the configured
database before running the app. The endpoint links each record to the authenticated
Clerk user and updates the profile if onboarding is submitted again. The onboarding
tables are `users`, `editors`, and `freelancers`, matching the domain models in
`app/types/user.types.ts`.

Editors publish assignments through `POST /api/assignments`, which stores them in the
`assignments` table. The `/dashboard/assignments` discovery page reads the open rows
directly from that table on the server and is rendered dynamically, so a newly posted
assignment appears on the next request. The editor dashboard and the freelancer task feed
load the same rows, so what people see is exactly what an organization posted — there is no
sample data to fall back on, and an empty desk simply says nothing is open.

Onboarding lets a user pick one role or both. Each selected role gets a profile and
a preferences step, so the flow is three steps for one role and five for both, and
the shared account fields (name, email, location) are collected once on the first
profile step. `users.roles` holds the set, with one row per role in `editors` and
`freelancers`; a role that is unticked later keeps its row. `db/schema.sql` is
idempotent, so re-running `npm run db:migrate` migrates a `users.role` column into
`users.roles` on an existing database.

From a Railway service shell, run:

```bash
npm run db:migrate
```

Set the app service's `DATABASE_URL` to the PostgreSQL service reference
(`${{Postgres.DATABASE_URL}}`, replacing `Postgres` with the exact Railway service
name). The private hostname is available from Railway services, not from a local
computer.

## Beats

Freelancers pick the beats they cover during onboarding. That list is data, not a constant: the
Story Match team adds and removes beats from the **Beats** tab in the admin area, and the onboarding
picker reads [`GET /api/beats`](./app/api/beats/route.ts) when it opens, so a change is live on the
next visit.

Removing a beat only stops it being offered. Profiles store the names people picked directly, so
anyone who already chose it keeps it; nothing is rewritten. `Other/Not listed here` is not part of
the managed list — it is the chip that reveals the free-text field, and it is always offered.

`npm run db:migrate` creates the `beats` table and seeds it once from the built-in list in
[`app/onboarding/constants.ts`](./app/onboarding/constants.ts). The seed is skipped when the table
already has rows, so a beat the team removes is not brought back by the next migration.

## Work (business) email verification

An editor's work email is proven through Clerk instead of being taken at face value, and Clerk
refuses to attach one email address to two accounts, so the same work email can never verify
twice:

1. The editor step calls `user.createEmailAddress({ email })` then
   `emailAddress.prepareVerification({ strategy: 'email_code' })`, so Clerk emails the one-time
   code. An address already verified on the account (for example the sign-up email) is accepted
   straight away.
2. **Verify** calls `emailAddress.attemptVerification({ code })`, and only a `verified` address
   completes the step. Consumer inboxes (Gmail, Outlook, Yahoo, …) are refused in the form
   because they don't prove a newsroom.
3. `POST /api/onboarding` re-checks the submitted address against the account's verified Clerk
   addresses (`currentUser()` in [`app/api/onboarding/route.ts`](./app/api/onboarding/route.ts)),
   so the flow cannot be bypassed from the client. Editing the work email clears the flag, so a
   new address has to be proven again.

No extra configuration is needed — Clerk sends the code. Adjust the email copy in the Clerk
Dashboard under Customization → Emails → Verification code.

## Age verification

Onboarding asks for a date of birth on the step after the role picker and refuses anyone under
`MINIMUM_AGE` (18) in [`app/utils/validation.utils.ts`](./app/utils/validation.utils.ts).

The date of birth is **never stored and never sent anywhere**:

- it lives only in the onboarding form state (`ProfileData.dateOfBirth`), which is not part of the
  payload `POST /api/onboarding` accepts and is not written to any table;
- the age check runs in the browser (`ageFrom` / `validateAge`), so the value never reaches the
  server, the logs or the database;
- reopening onboarding to add a role skips the step, because that person already completed it.

Because a self-reported date cannot be independently confirmed, the gate is a policy and UX
control rather than a security boundary. If it needs to be stricter later, compare the date on the
server and discard it without writing it.

## Profile photo uploads

Onboarding collects an optional profile photo on the first profile step. The browser
posts the file to `POST /api/uploads/photo`, which validates it (JPEG, PNG or WebP,
5 MB maximum, and the bytes must match the declared type) and stores it in the
project's S3 bucket. Only the object key is saved, in `users.photo_key`; because the
bucket is private, `lib/s3.ts` signs a short-lived GET URL whenever a photo is shown.

Photos are uploaded to a Railway bucket (`user-images`). Wire its S3-compatible
credentials to the app service:

```bash
eval "$(railway bucket credentials --bucket user-images)"   # prints the AWS_* values
railway variable set \
  AWS_ENDPOINT_URL="$AWS_ENDPOINT_URL" \
  AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
  AWS_S3_BUCKET_NAME="$AWS_S3_BUCKET_NAME" \
  AWS_DEFAULT_REGION="$AWS_DEFAULT_REGION" \
  --service se-iij-freelance-marketplace
```

The code reads the same names Railway's bucket credentials use, so any S3-compatible
host works. Optional knobs:

| Variable | Default | Purpose |
|---|---|---|
| `S3_PHOTO_PREFIX` | `photos` | Key prefix; objects live under `<prefix>/<clerk user id>/` |
| `S3_PHOTO_URL_TTL_SECONDS` | `3600` | Lifetime of a signed GET URL |
| `S3_FORCE_PATH_STYLE` | unset | Set to `true` for MinIO/LocalStack |

Without `AWS_S3_BUCKET_NAME` photo storage reports itself as unconfigured and uploads
are rejected, so the rest of the app keeps working. Run `npm run db:migrate` to add
the `users.photo_key` column. Replacing a photo writes a new object; the previous one
is left in the bucket.

## Reporting accounts, assignments and pitches

Every signed-in person can raise a flag on a person's account, an assignment or a pitch: the
small flag on talent and roster cards, on assignment cards and in the assignment drawer, and in
the editor's pitch inbox opens a short reason form. [`POST /api/flags`](./app/api/flags/route.ts)
takes the reporter from the session and reads the target's current name or title from the
database, so the queue cannot be filled with a false label from the browser. A person cannot
flag their own content, and a second flag on the same target while one is still open is
acknowledged without being stored twice.

Flags land in `/admin` beside account appeals. The team can mark one in review, resolve it or
dismiss it, and every decision stays in the Done tab where it can be changed or reopened.
[`PATCH /api/admin/flags/[id]`](<./app/api/admin/flags/[id]/route.ts>) is admin-only. Run
`npm run db:migrate` to add the `content_flags` table.

## Rosters and favorites

An editor's roster is a saved shortlist, not a membership request. Saving someone from
[Find talent](./app/dashboard/talent/page.tsx) or the [roster page](./app/dashboard/roster/page.tsx)
adds them straight away, so they appear on the desk and can be assigned without waiting for an
answer. Roster membership is not checked when a freelancer pitches an editor either.

The optional "Notify them" checkbox in the add dialog is the only part that reaches the freelancer.
They see the editor under "Saved by editors" and can accept or decline, but the answer only tells
the editor whether they are interested — it never changes the roster. A silent favorite starts as
`accepted` with `notified = false`, so it stays private; a notified one starts as `pending` with
`notified = true`.

Saving is one row in `roster_invites`; removing someone deletes it. Inviting people who are not on
StoryMatch yet is planned for later. Run `npm run db:migrate` to add the `roster_invites.notified`
column.

## Free right now timer

The "I'm free right now" switch on the profile card and in the settings availability
form sets `users.available_now` and, from this release, stores when it should stop in
`users.available_until`. Switching the flag on starts at the end of the person's local
day; the picker under the switch offers 30 minutes, 1 hour, 2 hours, "until end of day"
or a hand-picked time up to three days out. Switching it off clears the timer too.

Nothing sweeps the table: every read treats a flag whose timer has passed as off. The
roster, the talent search (including its "available now" filter and ordering) and the
profile and availability APIs all check the timestamp, and the roster note reads
"Free until 3:30 PM" while a timer is running. A row saved before this change has no
timer and stays free until the person switches it off.

Run `npm run db:migrate` to add the `users.available_until` column.
