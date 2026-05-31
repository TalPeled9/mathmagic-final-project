# AI Service Handoff Guide

## Purpose

This document explains the current AI implementation in MathMagic, what is already wired, what is still missing, and how to integrate the full server-driven adventure flow in a clean way.

Audience: teammate implementing the adventure backend and Story Chat integration.

---

## Current State (As Of March 2026)

### What exists now

- AI text generation service is implemented.
- AI image generation service is implemented.
- AI content filtering/sanitization is implemented.
- Avatar generation for child profiles is implemented.
- Adventure router exists and has AI rate limiting applied.

### What is not implemented yet

- No adventure controller yet.
- No adventure endpoints implemented (router is scaffold only).
- No persistence model for live adventure sessions/state.
- No server endpoint currently returning story segments (with imageUrl) to Story Chat.
- Story chat UI is still placeholder and does not consume segment payloads.

---

## Key Files and Responsibilities

### Routing

- `server/src/routes/index.ts`
  - Mounts all API routers.
  - Includes `/api/adventures` route.

- `server/src/routes/adventures.ts`
  - Adventure route scaffold.
  - Applies `aiRateLimit` middleware to all adventure endpoints.
  - No handlers yet.

### AI Services

- `server/src/services/ai/llmService.ts`
  - Main orchestrator for all story modes.
  - Modes: `story_step`, `math_question`, `hint`, `end_story`.
  - Uses per-mode schema + prompt builder.
  - Calls Gemini via `GeminiJsonClient`.
  - Sanitizes and validates all text content.
  - Includes fallback responses when unsafe output is blocked.

- `server/src/services/ai/geminiClient.ts`
  - Generic JSON client for Gemini.
  - Uses response schema + JSON response MIME.
  - Handles CJS/ESM interop via dynamic `import('@google/genai')`.

- `server/src/services/ai/imageGenerationService.ts`
  - Generates image from `imageDescription` + child avatar image reference.
  - Returns image as Base64 data URL.
  - Handles SVG avatar fallback case.

- `server/src/services/ai/storyContextBuilder.ts`
  - Converts `AdventureState` into per-mode LLM context.
  - Builds concise story summary from recent events and choices.

- `server/src/services/ai/contentFilter.ts`
  - Sanitizes text (strips simple HTML tags).
  - Blocks unsafe patterns.
  - Recursively validates all string fields in LLM response objects.

### Prompt Layer

- `server/src/services/ai/prompts/systemInstructions.ts`
- `server/src/services/ai/prompts/startAdventure.ts`
- `server/src/services/ai/prompts/mathQuestion.ts`
- `server/src/services/ai/prompts/hint.ts`
- `server/src/services/ai/prompts/endStory.ts`

These files encode behavioral constraints, schema expectations, and story-world rules at prompt level.

### Middleware

- `server/src/middleware/rateLimit.ts`
  - Exports `aiRateLimit` using `express-rate-limit`.
  - Current settings: 1 minute window, max 15 requests.

### Shared Types

- `shared/types/src/adventure.ts`
  - API request/response shapes for adventure flow.
  - `StorySegment` includes optional `imageUrl` for immediate display.

- `shared/types/src/ai.ts`
- `shared/types/dist/ai.d.ts`
  - Current source and dist contracts are not fully aligned.
  - Server compiles against dist output from `@mathmagic/types` package.

---

## Existing Non-Adventure AI Endpoint

Although adventure endpoints are not built yet, AI is currently used in parent profile flow:

- `POST /api/parent/children`
  - Calls `generateAvatar(...)` in `avatarService`.
  - Stores avatar as Base64 data URL.

- `POST /api/parent/children/:childId/avatar`
  - Regenerates avatar via AI.

This proves service + Gemini integration already works in production path.

---

## Required Future API Endpoints (Recommended)

Implement inside `server/src/routes/adventures.ts` and a new `server/src/controllers/adventureController.ts`:

1. `POST /api/adventures/start`
2. `POST /api/adventures/:adventureId/continue`
3. `POST /api/adventures/:adventureId/answer`
4. `POST /api/adventures/:adventureId/hint`
5. `POST /api/adventures/:adventureId/complete`

All of these should remain behind `aiRateLimit`.

---

## Server-Driven Orchestration Contract

The server must decide mode transitions. The client should never choose LLM mode directly.

### Decision flow (high level)

1. Load adventure state from DB.
2. Apply incoming user action (choice, answer, hint request).
3. Decide next mode based on server logic:
   - new adventure -> `story_step`
   - after choice -> `math_question`
   - wrong answer and attempts remaining -> `hint`
   - adventure completed -> `end_story`
4. Build context from state (`storyContextBuilder`).
5. Request LLM content (`llmService`).
6. Generate scene image using returned `imageDescription` + child avatar (`imageGenerationService`).
7. Map result into shared `StorySegment` shape and include `imageUrl`.
8. Persist updated state and response metadata.
9. Return response to client.

---

## Response Mapping Rules

LLM mode responses should be mapped to app-level `StorySegment` consistently.

- `narrative`: from LLM narrative/adventure narrative field.
- `wizzyDialogue`: from LLM.
- `choices`: from `storyChoices` where relevant.
- `challenge`: create challenge object only for math/hint contexts.
- `imageDescription`: from LLM.
- `imageUrl`: from image generation service (Base64 URL for immediate rendering).
- `isLastStep`: derived from mode/flow state.

Always return valid `StorySegment` shape from `shared/types/src/adventure.ts`.

---

## Data Persistence Needed

Create a dedicated adventure model (example: `AdventureSession`) with at least:

- `adventureId`
- `childId`
- `mode`
- `currentStepIndex`
- `totalSteps`
- `storyWorld`
- `mathTopic`
- `selectedChoices[]`
- `recentEvents[]`
- `lastProblemText`
- `correctAnswer`
- `lastChildAnswer`
- `attemptCount`
- `hintUsed`
- `storySummary`
- timestamps

This should map cleanly into `AdventureState` before each LLM call.

---

## Safety and Reliability Layers (Already Present)

1. Prompt constraints (behavior + content rules)
2. JSON schema constraints at Gemini response level
3. Runtime JSON parsing and validation
4. Output sanitization + blocked-pattern filtering
5. Safe fallback response when unsafe content is detected
6. Route-level rate limiting on adventure endpoints

These layers should stay enabled in production.

---

## Type Contract Risk and Fix

Important: `shared/types/src/ai.ts` and `shared/types/dist/ai.d.ts` are currently out of sync.

### Why this matters

- Server uses package `@mathmagic/types` and compiles against dist declarations.
- If src and dist disagree, runtime mapping and TypeScript expectations drift.

### Required fix

1. Decide the final AI response contract in `shared/types/src/ai.ts`.
2. Rebuild shared types package.
3. Verify server typecheck uses the updated dist contract.
4. Remove compatibility casts once contracts are aligned.

---

## Client Integration Plan (Story Chat)

Target file: `client/src/pages/child/StoryChat.tsx`

1. On load, call `POST /api/adventures/start` with selected child + world/topic.
2. Render returned `segment` immediately.
3. Display `segment.imageUrl` in chat panel as soon as response arrives.
4. On user choice, call `POST /api/adventures/:adventureId/continue`.
5. On answer submit, call `POST /api/adventures/:adventureId/answer`.
6. If server indicates hint needed/available, call `POST /api/adventures/:adventureId/hint`.
7. On completion, call `POST /api/adventures/:adventureId/complete`.

Client responsibility should stay limited to rendering and sending user actions.

---

## Suggested Implementation Order for Teammate

1. Align shared type contracts (src vs dist).
2. Create adventure session model.
3. Implement `adventureController.ts` with mode decision logic.
4. Add endpoint schemas/validators for adventure routes.
5. Wire routes in `adventures.ts`.
6. Map LLM responses into `StorySegment`.
7. Attach generated `imageUrl` before returning.
8. Integrate Story Chat UI calls.
9. Add integration tests for full flow.

---

## Minimal Integration Test Cases

1. Start adventure returns `adventureId` and `segment`.
2. Continue with choice updates state and returns next segment.
3. Wrong answer triggers hint path with safe content.
4. End story returns last step with celebration content.
5. Response includes `imageUrl` when image generation succeeds.
6. Fallback behavior works when content filter blocks output.
7. Rate limit returns expected friendly error message.

---

## Quick Checklist Before Shipping

- [ ] Adventure endpoints implemented and protected by auth + rate limit
- [ ] Server-only mode transitions (no client mode control)
- [ ] AI contracts aligned in shared types src + dist
- [ ] Story segment mapper covered by tests
- [ ] Image URL returned in story segment for immediate display
- [ ] Error handling and safe fallback verified
- [ ] Monitoring/logging added for blocked content and image failures
