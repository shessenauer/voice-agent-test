PRD — PersonalOS (Voice-First, MCP-First Assistant)
1) Summary

PersonalOS is a voice-first assistant that you can trigger from web (push-to-talk) and iOS (Action Button → Shortcut). It routes intents to specialist agents that operate exclusively through MCP tools wherever possible. It manages:

Infinite todos via GitHub Issues + Projects v2,

Calendar (Google Calendar),

Email (Gmail),

Smart-home controls (Alexa),

Web Search (fast) vs Deep Research (explicit user consent),

Multimodal intake from iOS screenshots to extract actions.

Monorepo hosts web UI, API, iOS app, and MCP servers.

2) Goals & Non-Goals

Goals

Voice-first UX with concise confirmations.

MCP-first integrations, swappable per environment.

Infinite tasks using GitHub Issues/Projects with status/priority/due.

Quick Search vs gated Deep Research.

iOS Action Button flow to capture a screenshot and send as multimodal context.

Single monorepo for dev/CI/CD.

Non-Goals

Real-time on-device wake-word modeling (PTT/hotkey only).

Full email client UI (compose/reply by agent only).

Non-GitHub task sources in v1 (Notion/Todoist later).

Sharing/collab UX beyond single user in v1.

3) Users & Use Cases

Primary user: you (single-user assistant; future multi-user optional).

Core use cases

“Add a task … P1 … due next Friday” → issue created, added to Project with fields.

“What’s due today / this week?” → read back filtered view; open in web panel.

“Schedule lunch with Priya Thursday noon, 60 minutes” → create GCal event after readback.

“Draft an email to Jeff about Q4 budget” → draft created; send only after explicit “send”.

“Turn on bedtime scene” → Alexa scene run with confirmation.

“Search: best patio dinner bellevue tonight” → Web Search results summarized.

“Deep research: WA med-spa licensing landscape” → assistant asks consent → runs DR.

iOS Action Button → Shortcut Take Screenshot → App Intent → upload → agent proposes actions (e.g., create tasks from an on-screen note or email thread).

4) Functional Requirements

Voice input: PTT hotkey on web; iOS Shortcut trigger. Automatic speech recognition, brief spoken responses.

Intent routing: Supervisor → Specialists (Issues/Calendar/Email/Home/Search/DeepResearch).

Deep Research gating: never invoked without explicit user “yes” or utterance containing “deep research”.

GitHub Issues/Projects:

Create/update/close issues.

Update Project fields: Status (Todo/In Progress/Waiting/Blocked/Done), Priority (P0–P3), Due (date), Area (select).

Views: Today, This Week, Waiting, Overdue.

Subtasks via linked issues.

Calendar: list, create, readback confirmation, optional attendees/location.

Email: search, draft; send requires explicit ‘send’ confirmation.

Smart-home: run scenes / toggle device power with confirmation.

Multimodal ingest: accept image + optional note; extract entities and propose actions.

Web UI panels: PTT, Activity Log, Tasks (views), Calendar list, Email drafts.

Security: OAuth tokens stored server-side; least-privilege scopes; per-tool confirmation on high-impact actions.

Observability: event log for tool calls and outcomes; minimal metrics (success/error, latency).

5) Success Metrics (v1)

P95 end-to-end latency (voice command → tool success): < 5s for Search/tasks; < 8s for Calendar/Email drafts.

Task creation accuracy (title, due, priority correctly set): ≥ 95% on sampled commands.

False Deep-Research invocations: 0 (must be consented).

iOS capture flow success rate: ≥ 95% (screenshot arrives, parsed, actions emitted).

6) UX Requirements

Confirmation policy:

Readback & confirm for: sending email, creating calendar events, running Alexa scenes.

Short confirmations for tasks (unless destructive edit/close).

Error handling: natural apology + next best step; show retry in UI.

Privacy: visual indicator when microphone is active; screenshot preview in iOS Shortcut (Markup optional).

7) Constraints & Risks

GitHub Projects GraphQL quotas and field ID management.

OAuth setup and token storage (Google, GitHub, Amazon).

MCP servers trust: prefer self-hosted or vetted providers; allow-list endpoints.

iOS Shortcuts variability across iOS versions (ensure minimal action set).

8) Rollout Plan

M1: Web PTT + Issues MCP + Web Search.

M2: Calendar + Email MCPs; confirmations; UI panels.

M3: iOS Shortcut + App Intent + /ingest multimodal.

M4: Alexa + Deep Research gating; polish; metrics/alerts.