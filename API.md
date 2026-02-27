# RepForge API Reference

All API routes require authentication via session cookie unless noted otherwise.
All responses are JSON. Error responses use `{ "error": "..." }`.

---

## Authentication

### `POST /api/auth/register`
Create a new user account. Rate limited to **10 requests per 15 minutes per IP**.

**Body**
```json
{
  "email": "user@example.com",
  "name": "Jane Doe",
  "password": "min6chars"
}
```

**Response** `201`
```json
{ "user": { "id": "...", "email": "...", "name": "..." } }
```

---

### `POST /api/auth/[...nextauth]`
NextAuth.js sign-in/sign-out (handled automatically by NextAuth).

---

## Dashboard

### `GET /api/dashboard/stats`
Returns aggregate stats for the logged-in user.

**Response**
```json
{
  "stats": {
    "currentWeight": 80.5,
    "weightUnit": "kg",
    "weightChange": -1.2,
    "workoutsThisWeek": 3,
    "workoutsThisMonth": 12,
    "totalVolume": 42000,
    "activeSplit": { "name": "PPL", "daysCount": 6 },
    "totalPRs": 24,
    "streak": 5
  },
  "recentPRs": [...],
  "recentSessions": [...],
  "weightHistory": [...]
}
```

---

## Workout Sessions

### `GET /api/sessions`
List all workout sessions for the authenticated user.

| Query param | Type | Description |
|---|---|---|
| `limit` | number | Max results (1–500) |

**Response** `200 { sessions: WorkoutSession[] }`

### `POST /api/sessions`
Start a new workout session. Rate limited to **60 per minute per user**.

**Body**
```json
{
  "name": "Morning Push",
  "splitDayId": "optional-split-day-id",
  "mood": "good",
  "energyLevel": 8
}
```
**Response** `201 { session: WorkoutSession }`

### `PATCH /api/sessions`
Update or complete a session.

| Query param | Type | Description |
|---|---|---|
| `id` | string | Session ID |
| `complete` | boolean | Set to `true` to complete the session |

**Response** `200 { session: WorkoutSession, xpResults: XpResults }`

### `DELETE /api/sessions`
Delete a session.

| Query param | Type | Description |
|---|---|---|
| `id` | string | Session ID |

**Response** `200 { success: true }`

---

## Exercise Sets

### `GET /api/sessions/[id]/sets`
Get all sets for a specific session.

**Response** `200 { sets: ExerciseSet[] }`

### `POST /api/sessions/[id]/sets`
Add a set to a session. Automatically checks for PRs and awards XP.
Sends PR and level-up notifications if applicable.

**Body**
```json
{
  "exerciseId": "cuid...",
  "setNumber": 1,
  "weight": 80,
  "reps": 10,
  "rpe": 8,
  "restTime": 90,
  "isWarmup": false,
  "notes": ""
}
```
**Response** `201 { set: ExerciseSet, prResults: PRResults, xpResults: XpResults }`

### `DELETE /api/sessions/[id]/sets`
Delete a set.

| Query param | Type | Description |
|---|---|---|
| `setId` | string | Set ID to delete |

**Response** `200 { success: true }`

---

## Exercises

### `GET /api/exercises`
List exercises. Returns system + user exercises.

| Query param | Type | Description |
|---|---|---|
| `search` | string | Filter by name (case-insensitive contains) |
| `muscleGroup` | string | Filter by muscle group |
| `category` | string | Filter by category |

**Response** `200 { exercises: Exercise[] }`

### `POST /api/exercises`
Create a custom exercise.

**Body**
```json
{
  "name": "Romanian Deadlift",
  "muscleGroups": ["Hamstrings", "Glutes"],
  "equipment": "Barbell",
  "difficulty": "intermediate"
}
```
**Response** `201 { exercise: Exercise }`

### `PATCH /api/exercises`
Update an exercise (ownership required).

| Query param | Type | Description |
|---|---|---|
| `id` | string | Exercise ID |

### `GET /api/exercises/[id]/stats`
Get training history and stats for a specific exercise.

**Response** `200 { personalRecords, bestSets, recentSessions, progressData }`

### `GET /api/exercises/[id]/suggestion`
Get progressive overload suggestion for an exercise.

**Response** `200 { suggestion: OverloadSuggestion }`

### `POST /api/exercises/[id]/favorite`
Toggle favorite status.

**Response** `200 { isFavorite: boolean }`

---

## Personal Records

### `GET /api/prs`
Get all PRs for the user.

| Query param | Type | Description |
|---|---|---|
| `exerciseId` | string | Filter by exercise |

**Response** `200 { prs: PersonalRecord[] }`

### `POST /api/prs`
Manually create or update a PR.

**Body**
```json
{
  "exerciseId": "cuid...",
  "recordType": "one_rep_max",
  "value": 120.5,
  "notes": "Felt strong today"
}
```
`recordType` values: `one_rep_max` | `max_volume` | `max_reps`

---

## Analytics

### `GET /api/analytics`
Core analytics (last 90 days): consistency, muscle distribution, volume trends.

**Response**
```json
{
  "weeklyAverage": 3.5,
  "consistencyRate": 70,
  "currentStreak": 5,
  "totalPRs": 12,
  "frequencyData": [{ "date": "2025-01-15", "count": 1 }],
  "muscleGroupData": [{ "name": "Chest", "value": 42 }],
  "volumeData": [{ "week": 1, "volume": 15000 }],
  "dayDistribution": [{ "day": "Mon", "count": 8 }],
  "topExercises": [...],
  "insights": ["..."]
}
```

### `GET /api/analytics/progress`
XP/level progression, achievements, milestones, body composition trend.

**Response**
```json
{
  "level": { "current": 5, "xp": 450, "xpInCurrentLevel": 50, "xpToNextLevel": 50, "levelProgress": 50 },
  "xpBySource": { "workout_complete": 300, "personal_record": 200 },
  "xpHistory": [{ "date": "2025-01-15", "xp": 450, "gained": 50 }],
  "achievements": [...],
  "milestones": { "totalSessions": 25, "nextSessionMilestone": 50, "currentStreak": 5 },
  "recentPRs": [...],
  "bodyComposition": [{ "date": "2025-01-15", "weight": 80, "bodyFat": 15 }],
  "weeklyVolumeTrend": [{ "weekStart": "2025-01-13", "sessions": 3, "volume": 12000 }]
}
```

### `GET /api/analytics/strength`
Per-exercise strength trends, estimated 1RM over time, muscle volume breakdown.

| Query param | Type | Description |
|---|---|---|
| `period` | string | `90d` (default) \| `180d` \| `1y` \| `all` |
| `exerciseId` | string | Focus on a single exercise |

**Response**
```json
{
  "period": "90d",
  "topExercises": [{ "id": "...", "name": "Bench Press", "allTimeBest": { "max1RM": 120, "maxWeight": 110 }, "improvement1RMPercent": 8 }],
  "exerciseTrends": [{ "id": "...", "trend": [{ "date": "...", "max1RM": 120, "maxWeight": 110 }] }],
  "mostImproved": [...],
  "muscleVolumeTotal": [{ "muscle": "Chest", "totalVolume": 45000 }]
}
```

---

## Suggestions (Smart AI-Like Recommendations)

### `GET /api/suggestions/workout`
Recovery-aware workout suggestion based on active split and muscle recovery.

**Response**
```json
{
  "suggestedFocus": ["Chest", "Triceps"],
  "suggestedSplitDay": "Push Day",
  "shouldRest": false,
  "reason": "Follow your 'Push Day' split day — all target muscles are recovered.",
  "recoveryStatus": { "Chest": { "lastTrained": "2025-01-13", "hoursAgo": 48, "recovered": true } },
  "suggestedExercises": [{ "id": "...", "name": "Bench Press", "muscleGroups": ["Chest", "Triceps"] }],
  "trainedToday": false
}
```

### `GET /api/suggestions/exercises`
Ranked exercise suggestions by muscle group (variety-boosted).

| Query param | Type | Description |
|---|---|---|
| `muscleGroup` | string | Target muscle (e.g. "Chest") |
| `difficulty` | string | `beginner` \| `intermediate` \| `advanced` |
| `equipment` | string | Equipment filter |
| `limit` | number | Max results (1–30, default 10) |
| `exclude` | string | Comma-separated exercise IDs to exclude |

**Response** `200 { exercises: Exercise[], total: number }`

---

## Workout Templates

### `GET /api/templates`
List templates. Supports search and filtering.

| Query param | Type | Description |
|---|---|---|
| `public` | boolean | If `true`, show public templates library |
| `search` | string | Filter by name (contains) |
| `category` | string | Filter by category |
| `difficulty` | string | Filter by difficulty |
| `limit` | number | Max results (1–100) |

Public listing includes `isSaved` flag showing if user already has a copy.

### `POST /api/templates`
Create a new template.

**Body**
```json
{
  "name": "Full Body Strength",
  "description": "...",
  "category": "strength",
  "difficulty": "intermediate",
  "duration": 60,
  "isPublic": false,
  "exercises": [
    { "exerciseId": "cuid...", "sets": 4, "reps": "6-8", "restTime": 180, "order": 0 }
  ]
}
```
`exercises` must have at least 1 item.

### `GET /api/templates/[id]`
Get a single template (own or public).

### `PUT /api/templates/[id]`
Update a template (ownership required).

### `DELETE /api/templates/[id]`
Delete a template (ownership required).

### `POST /api/templates/[id]/copy`
Fork a public template into your personal collection. Creates a private copy.

**Response** `201 { template: WorkoutTemplate, message: "..." }`

### `POST /api/templates/start`
Start a workout from a template (creates a session pre-populated with split day).

**Body** `{ "templateId": "cuid..." }`

**Response** `200 { sessionId: "..." }`

---

## Workout Splits

### `GET /api/splits`
Get all splits for the user.

### `POST /api/splits`
Create a new workout split/program.

**Body**
```json
{
  "name": "PPL",
  "description": "Push Pull Legs 6-day",
  "days": [
    { "name": "Push", "dayOfWeek": 0, "exercises": [{ "exerciseId": "...", "order": 0 }] }
  ]
}
```

### `PATCH /api/splits`
Update a split (ownership required; returns 403 for others' splits).

### `DELETE /api/splits`
Delete a split (ownership required).

### `GET /api/splits/[id]/exercises`
Get exercises for a specific split day.

### `PUT /api/splits/exercises/[id]`
Update a split day exercise.

---

## Weight & Body Composition

### `GET /api/weight`
Get weight history.

### `POST /api/weight`
Log weight entry.

**Body**
```json
{ "weight": 80.5, "unit": "kg", "bodyFat": 15.0, "muscleMass": 38.5, "notes": "..." }
```

### `GET /api/weight/goal`
Get weight goal.

### `POST /api/weight/goal`
Set weight goal.

---

## Journal

### `GET /api/journal`
Get journal entries. Returns `{ entries: JournalEntry[] }`.

### `POST /api/journal`
Create a journal entry.

**Body**
```json
{
  "title": "Heavy leg day",
  "content": "...",
  "mood": "great",
  "energyLevel": 9,
  "sleepQuality": 7,
  "bodyWeight": 80.2,
  "notes": "..."
}
```

### `DELETE /api/journal/[id]`
Delete a journal entry (ownership required).

---

## Calendar

### `GET /api/calendar`
Get workout events for a date range.

| Query param | Type | Description |
|---|---|---|
| `start` | ISO date | Range start |
| `end` | ISO date | Range end |

---

## Notifications

### `GET /api/notifications`
Get user notifications with pagination.

| Query param | Type | Description |
|---|---|---|
| `unread` | boolean | If `true`, only unread |
| `limit` | number | Max results (1–100, default 20) |
| `cursor` | string | Pagination cursor (last notification ID) |

**Response** `200 { notifications, unreadCount, hasMore, nextCursor }`

### `PATCH /api/notifications`
Mark notifications as read.

**Body (option A):** `{ "all": true }` — mark all as read  
**Body (option B):** `{ "ids": ["id1", "id2"] }` — mark specific as read

### `DELETE /api/notifications`
Delete notifications.

**Body (option A):** `{ "all": true }` — delete all  
**Body (option B):** `{ "all": true, "readOnly": true }` — delete only read ones  
**Body (option C):** `{ "ids": ["id1", "id2"] }` — delete specific

---

## Social

### `GET /api/social/feed`
Get public workout shares feed.

### `POST /api/social/shares`
Share a workout session publicly.

### `POST /api/social/shares/[id]/like`
Like a shared workout. Sends a notification to the owner.

### `DELETE /api/social/shares/[id]/like`
Unlike a shared workout.

### `GET /api/social/following`
Get users the authenticated user follows (with workout counts and follower counts).

### `POST /api/social/follow/[id]`
Follow a user. Sends a follow notification to the target.

### `DELETE /api/social/follow/[id]`
Unfollow a user.

### `GET /api/social/suggestions`
"Who to follow" suggestions.

### `GET /api/social/leaderboard`
Fitness leaderboard.

### `GET /api/social/achievements`
Get achievements for the authenticated user.

---

## Progress & XP

### `GET /api/progress`
Get XP, level, and progress data.

### `POST /api/progress`
Award XP manually (admin use).

---

## Settings

### `GET /api/settings`
Get user settings (units, theme, notifications).

### `PATCH /api/settings`
Update settings.

### `GET /api/settings/export`
Export all user data as JSON.

---

## HealthKit Integration

### `POST /api/healthkit/sync`
Sync Apple Watch / HealthKit workout data. Rate limited to **30 per hour per user**.

**Body**: `HealthKitSyncPayload` (workouts, heartRateSamples, activeEnergy, restingEnergy, stepCount)

### `GET /api/healthkit/heartrate`
Get heart rate samples with optional date range.

| Query param | Type | Description |
|---|---|---|
| `period` | string | `day` \| `week` \| `month` |
| `startDate` | ISO date | Manual range start |
| `endDate` | ISO date | Manual range end |

### `POST /api/healthkit/heartrate`
Manually add heart rate samples.

---

## Error Codes

| Code | Meaning |
|---|---|
| `400` | Bad Request — validation failure (details in `error` field) |
| `401` | Unauthorized — missing or invalid session |
| `403` | Forbidden — resource exists but belongs to another user |
| `404` | Not Found |
| `409` | Conflict — e.g. duplicate entry |
| `413` | Request Entity Too Large — body exceeds 2 MB |
| `429` | Too Many Requests — rate limit exceeded (see `Retry-After` header) |
| `500` | Internal Server Error |

---

## Rate Limits

| Endpoint group | Limit |
|---|---|
| `POST /api/auth/register` | 10 per 15 minutes per IP |
| `POST /api/sessions` | 60 per minute per user |
| `POST /api/healthkit/sync` | 30 per hour per user |
| Template copy | 60 per minute per user |

Rate-limited responses include:
- `Retry-After` header (seconds until reset)
- `X-RateLimit-Remaining` header (requests remaining)

---

## Security Headers

All API responses include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`
