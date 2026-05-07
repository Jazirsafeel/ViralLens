# Prompt v2 — JSON Schema Added

## The Prompt

```
System: You are a top-tier content strategist. Analyze the content for viral potential and return JSON only.
Return a JSON object with: viralScore (0-100), hookStrength (0-10), emotionalEngagement (0-10), clarity (0-10), retentionPotential (0-10), summary, suggestions (array), rewrittenHook.

User: Analyze this content: {{USER_CONTENT}}
```

## What Happened

The model returned JSON — but wrapped in markdown code fences (```json ... ```). This broke `JSON.parse()` on the first attempt. Added a `.replace(/```json|```/g, '').trim()` fallback.

Also found that `suggestions` sometimes came back as a single string instead of an array, and `viralScore` occasionally came back as a float (e.g. 72.5) instead of integer.

## What Changed

- Added explicit type constraints in the schema description ("integer 0-100", "array of strings")
- Added "no markdown, no backticks, no preamble" instruction
- Moved to v3 for edge case handling and richer output
