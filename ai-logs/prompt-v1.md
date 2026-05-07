# Prompt v1 — First Attempt (Basic)

## The Prompt

```
System: You are a content strategist. Analyze the following social media content and tell me how viral it could be.

User: Analyze this: {{USER_CONTENT}}
```

## What Happened

The model returned a long, freeform paragraph with no structure. Scores were buried in prose ("I'd give this about a 7 out of 10 for hook strength..."). Nothing was parseable programmatically.

## What Changed

Needed JSON output so the UI could render structured results. Moved to v2 with explicit JSON schema in the prompt.
