# Multi-Provider LLM with Gemini → Ollama Fallback

**Date:** 2026-04-07  
**Branch:** feature/ai  
**Status:** Approved

## Problem

The app currently uses `gemini-2.5-flash` exclusively, which has a 500 req/day free tier. A single
full adventure session fires ~8 LLM calls, so the daily quota is exhausted quickly during testing
and will not scale to multiple concurrent users in production. There is also no fallback — if
Gemini is unavailable, the app breaks.

## Goals

- Triple the free daily Gemini quota by switching to `gemini-2.0-flash` (1,500 req/day).
- Add the college Ollama server (`llama3.1:8b`) as an automatic fallback when Gemini fails or is
  rate-limited.
- Keep the existing fallback static responses in `llmService.ts` as the last safety net.
- Stop live AI tests from burning real API quota by defaulting to mock mode.
- Keep all changes contained to `server/src/services/ai/` and config — no controller, prompt,
  route, or shared-type changes needed.

## Non-Goals

- Adding Groq or any other third cloud provider (deferred, revisit if Gemini + Ollama proves
  insufficient).
- Changing prompt content, story logic, or response schemas.
- Streaming responses.

---

## Architecture

### Provider Interface

A new shared interface in `providers/LLMProvider.ts` defines the contract both providers must
satisfy:

```typescript
export interface LLMProviderRequest {
  prompt: string;
  schema: Record<string, unknown>;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface LLMProvider {
  readonly name: string;
  generateJson<T>(params: LLMProviderRequest): Promise<T>;
}
```

`model` is intentionally absent — each provider resolves its own model from config. The schema
field is provider-agnostic; each provider interprets it differently (Gemini uses it as a native
`responseSchema`; Ollama uses it to generate a JSON template appended to the prompt).

### Fallback Client

`fallbackLLMClient.ts` holds a prioritised list of providers and tries them in order. It stops and
returns on the first success. On failure it logs a warning and advances to the next provider.

```
Request → GeminiProvider → success → return
                         → failure (rate limit, 5xx, network) →
          OllamaProvider → success → return
                         → failure →
          throw Error('All LLM providers failed')
              ↓
          llmService.ts catches and calls fallbackByMode() (existing static responses)
```

### File Structure

All changes are inside `server/src/services/ai/`:

```
services/ai/
  geminiClient.ts          unchanged
  llmService.ts            updated: use FallbackLLMClient instead of GeminiJsonClient directly
  fallbackLLMClient.ts     NEW
  providers/
    LLMProvider.ts         NEW  — interface + LLMProviderRequest type
    geminiProvider.ts      NEW  — thin wrapper around existing GeminiJsonClient
    ollamaProvider.ts      NEW  — Ollama /api/generate HTTP client
  prompts/                 unchanged
  storyContextBuilder.ts   unchanged
  contentFilter.ts         unchanged
```

### GeminiProvider

Wraps the existing `GeminiJsonClient`. Reads `config.gemini.model` internally. The
`GeminiJsonClient` itself is not modified.

### OllamaProvider

Calls `POST /api/generate` on the Ollama server using the native `fetch` API (no new
dependencies). Only constructed when `config.ollama.baseUrl` is non-empty, so the app runs
normally without Ollama configured.

**Authentication:** HTTP Basic Auth header — `Authorization: Basic <base64(username:password)>`.

**JSON handling:** Ollama supports `format: "json"` to force JSON output but does not support a
response schema. To get reliable structured output, the provider appends an explicit format
instruction to every prompt, generated at runtime from `schema.properties`:

```
IMPORTANT: Respond with ONLY a valid JSON object — no explanation, no markdown.
Use exactly this structure:
{
  "fieldName": "<string>",
  "arrayField": ["<string>", ...]
}
```

The response is parsed with `JSON.parse` and passed through the same `sanitizeAndValidateAIResponse`
content filter that Gemini responses use.

**Timeout:** 30 seconds per request (Ollama on shared hardware can be slow under load).

---

## Configuration

### New env vars (added to `server/.env.example` and `config/index.ts`)

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_BASE_URL` | `''` | e.g. `http://10.10.248.41`. Empty = Ollama disabled. |
| `OLLAMA_USERNAME` | `''` | Basic auth username |
| `OLLAMA_PASSWORD` | `''` | Basic auth password |
| `OLLAMA_MODEL` | `llama3.1:8b` | Model name on the Ollama server |

### Changed defaults

| Variable | Old default | New default | Reason |
|---|---|---|---|
| `GEMINI_MODEL` | `gemini-2.5-flash` | `gemini-2.0-flash` | 3× more free req/day (1,500 vs 500) |

---

## Test Script Fix

`test:ai:observe` currently runs live against Gemini with no env guard, burning real quota.

**Before:**
```json
"test:ai:observe": "vitest run src/tests/ai.live-observability.test.ts"
```

**After:**
```json
"test:ai:observe": "RUN_AI_OBSERVABILITY_MOCK=true vitest run src/tests/ai.live-observability.test.ts"
```

Running live intentionally: `RUN_AI_OBSERVABILITY=true npx vitest run src/tests/ai.live-observability.test.ts`

The test file itself is unchanged.

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Gemini rate-limited (429) | FallbackLLMClient catches, logs warning, tries Ollama |
| Gemini 5xx / network error | Same as above |
| Ollama unreachable / timeout | FallbackLLMClient logs warning, throws after all providers exhausted |
| All providers fail | `llmService.ts` `requestByMode` catches and calls `fallbackByMode()` — static safe response returned to user |
| Ollama returns malformed JSON | `OllamaProvider` throws, treated same as any provider failure |
| Unsafe content from Ollama | `sanitizeAndValidateAIResponse` blocks it; `llmService.ts` uses `fallbackByMode()` |

---

## Out of Scope / Future Work

- **Groq provider**: Add as a third option if Gemini + Ollama proves insufficient under heavy load.
- **Provider health monitoring**: Track per-provider failure rates for observability.
- **Request queuing**: Rate-limit client-side requests to Ollama to respect its 5 req/min server cap.
