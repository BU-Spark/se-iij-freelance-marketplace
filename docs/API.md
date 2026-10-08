# API Specification (Milestone 1)

Base path: `/api`. All request and response bodies use JSON. These routes return in-memory mock data and do not persist changes.

## `GET /api/users/{id}`

Returns a public freelancer profile.

**Path parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | User identifier |

**Request body:** None

**`200 OK` response**

```json
{
  "id": "user_001",
  "firstName": "Alex",
  "lastName": "Morgan",
  "role": "FREELANCER",
  "verificationStatus": "VERIFIED",
  "headline": "Full-stack developer",
  "skills": ["Next.js", "TypeScript"]
}
```

**`404 Not Found` response**

```json
{ "error": "User not found" }
```

## `GET /api/gigs`

Returns the current mock gig listings. Optional `q` searches titles and descriptions.

**Query parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `q` | string | No | Case-insensitive search text |

**Request body:** None

**`200 OK` response**

```json
{
  "gigs": [
    {
      "id": "gig_001",
      "title": "Build a marketplace landing page",
      "description": "Create a responsive landing page in Next.js.",
      "budget": 1200,
      "currency": "USD",
      "clientId": "user_002",
      "status": "OPEN"
    }
  ],
  "total": 1
}
```

## `POST /api/verification`

Submits document metadata for a user's identity verification. The mock route validates required fields and returns a simulated submission; it does not accept or store actual file uploads.

**Request body**

```json
{
  "userId": "user_001",
  "documents": [
    { "type": "GOVERNMENT_ID", "fileName": "id-front.jpg" }
  ]
}
```

`userId` is a non-empty string. `documents` must contain at least one item; each item requires a non-empty `type` and `fileName`.

**`201 Created` response**

```json
{
  "success": true,
  "requestId": "verification_mock_001",
  "status": "PENDING"
}
```

**`400 Bad Request` response**

```json
{ "error": "userId and at least one valid document are required" }
```

## `POST /api/proposals`

Creates a mock proposal from a freelancer for an open gig.

**Request body**

```json
{
  "gigId": "gig_001",
  "freelancerId": "user_001",
  "coverLetter": "I can build this responsive page.",
  "proposedBudget": 1100
}
```

All fields are required; `proposedBudget` must be a positive number.

**`201 Created` response**

```json
{
  "id": "proposal_mock_001",
  "gigId": "gig_001",
  "freelancerId": "user_001",
  "coverLetter": "I can build this responsive page.",
  "proposedBudget": 1100,
  "status": "SUBMITTED"
}
```

**`400 Bad Request` response**

```json
{ "error": "gigId, freelancerId, coverLetter, and a positive proposedBudget are required" }
```

## Mock implementation notes

- Routes are under the Next.js App Router at `app/api/`.
- IDs and records are fixtures for frontend integration. POST routes do not persist data.
- Authentication, authorization, file storage, pagination, and database behavior are outside this Milestone 1 contract and need agreement before production implementation.
