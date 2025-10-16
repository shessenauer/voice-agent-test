Tech Spec — PersonalOS
1) Monorepo
personal-os/
├─ apps/
│  ├─ web/ (Next.js UI)
│  ├─ api/ (Next.js / Node server)
│  └─ ios/ (SwiftUI app + App Intents)
├─ packages/
│  ├─ agents/ (Supervisor + Specialists)
│  ├─ mcp-client/ (Remote MCP helper)
│  ├─ schemas/ (JSON Schemas for tools, action plans)
│  ├─ shared/ (date parsing, prompts, logger)
│  └─ typings/ (generated TS + Swift types)
├─ mcp-servers/
│  ├─ github-issues/
│  ├─ google-calendar/
│  ├─ gmail/
│  ├─ alexa/
│  └─ web-search/ (or hosted)
├─ infra/
│  ├─ docker-compose.yml
│  └─ terraform/
├─ .github/workflows/ (ci-web.yml, ci-ios.yml)
├─ turbo.json
└─ .env.example


2) Components & Responsibilities

apps/web: PTT UI; session token fetch; panels for Tasks/Calendar/Email; activity log.

apps/api:

/api/session: mint ephemeral Realtime tokens.

/ingest: multipart image intake; invoke Vision intake; return ActionPlan.

/proxy/* (optional): pass-through to MCP servers if needed for CORS/auth.

packages/agents:

PersonalOS (Supervisor): intent detection, gating, and handoffs.

IssuesAgent, CalendarAgent, EmailAgent, HomeAgent, WebSearchAgent, DeepResearchAgent.

mcp-servers/:

github-issues: REST (issues) + GraphQL (Projects v2).

google-calendar: events list/create.

gmail: search, draft, send (send is gated by supervisor).

alexa: smart-home/scene execution (+ optional reminders).

web-search/deep-research: hosted or self-run connectors.

3) Data Models
3.1 GitHub Issues/Projects fields

Issue: number, title, body, labels[], state.

Project fields (single-select IDs discovered at init):

Status: Todo | In Progress | Waiting | Blocked | Done

Priority: P0 | P1 | P2 | P3

Due: date

Area: string single-select

Views (saved filters mirrored in MCP):

today, this_week, waiting, overdue.

3.2 Action Plan (output of /ingest & multimodal)
{
  "actions": [
    { "type": "create_task", "title": "Renew tabs", "due": "2025-10-12", "priority": "P1", "area": "Personal" },
    { "type": "create_event", "title": "Lunch with Priya", "start_iso": "2025-10-08T12:00:00-07:00", "end_iso": "2025-10-08T13:00:00-07:00" },
    { "type": "draft_email", "to": ["jeff@example.com"], "subject": "Q4 Budget", "body_markdown": "…" },
    { "type": "run_shortcut", "name": "Toggle Focus: Work" }
  ]
}

4) APIs & Contracts
4.1 /api/session (GET)

Resp

{ "client_secret": "<ephemeral-realtime-token>", "expires_in": 60 }

4.2 /ingest (POST multipart/form-data)

Req

image: file (PNG/JPG)

mode: quick_search | deep_research

notes: optional string

Resp

ActionPlan JSON (above)

4.3 MCP Tool Schemas (JSON Schema; source of truth in packages/schemas)

github_issues

{
  "create_task.request": {
    "type": "object",
    "required": ["title"],
    "properties": {
      "title": {"type":"string"},
      "body": {"type":"string"},
      "priority": {"enum":["P0","P1","P2","P3"]},
      "due": {"type":"string","format":"date"},
      "area": {"type":"string"},
      "labels": {"type":"array","items":{"type":"string"}}
    }
  },
  "create_task.response": {
    "type":"object","properties":{"number":{"type":"number"}}
  },
  "set_status.request": {
    "type":"object","required":["number","status"],
    "properties":{"number":{"type":"number"},"status":{"enum":["Todo","In Progress","Waiting","Blocked","Done"]}}
  },
  "list_view.request": {
    "type":"object","required":["view"],
    "properties":{"view":{"enum":["today","this_week","waiting","overdue"]}}
  }
}


google_calendar

{
  "create_calendar_event.request": {
    "type":"object",
    "required":["title","start_iso","end_iso"],
    "properties":{
      "title":{"type":"string"},
      "start_iso":{"type":"string","format":"date-time"},
      "end_iso":{"type":"string","format":"date-time"},
      "attendees":{"type":"array","items":{"type":"string","format":"email"}},
      "location":{"type":"string"},
      "notes":{"type":"string"}
    }
  }
}


gmail

{
  "draft_email.request": {
    "type":"object",
    "required":["to","subject","body_markdown"],
    "properties":{
      "to":{"type":"array","items":{"type":"string","format":"email"}},
      "subject":{"type":"string"},
      "body_markdown":{"type":"string"},
      "signature_profile":{"type":"string"}
    }
  },
  "send_email.request": {
    "type":"object",
    "required":["draft_id"],
    "properties":{"draft_id":{"type":"string"}}
  }
}


alexa

{
  "alexa_scene_run.request": {
    "type":"object",
    "required":["sceneId"],
    "properties":{"sceneId":{"type":"string"}}
  }
}


web_search vs deep_research

{
  "web_search.request": {
    "type":"object",
    "required":["query"],
    "properties":{"query":{"type":"string"}, "recency_days":{"type":"number"}}
  },
  "deep_research.request": {
    "type":"object",
    "required":["question"],
    "properties":{"question":{"type":"string"}, "scope":{"type":"string"}}
  }
}


All schemas are code-generated to TS/Swift for compile-time safety.

5) Agent Behavior
5.1 Supervisor (PersonalOS)

Extracts high-level intent from transcript (tasks/calendar/email/home/search/deep research).

Deep Research policy:

If user says “deep research …” → route to DeepResearchAgent.

If query implies deep dive → ask “This needs Deep Research. Use it?” → on “yes” route to DR else WebSearchAgent.

High-impact actions require readback and “yes”.

5.2 Specialists

IssuesAgent: prefers create_task, set_status, update_task, complete_task, list_view.

CalendarAgent: reads back title/date/time/place; confirms; calls create_calendar_event.

EmailAgent: drafts; on “send”, calls send_email.

HomeAgent: maps natural scene names to sceneId; confirm, then run.

WebSearchAgent: short answer with citations (outside PRD scope to format).

DeepResearchAgent: longer answer/report; persist summary to a “Research” label in GitHub Issues (optional).

6) iOS Integration
6.1 Shortcut “PersonalOS Capture”

Actions: Take Screenshot → Run App Intent (SendToPersonalOS) with inputs: image, mode, notes (Dictate Text optional).

After app returns ActionPlan, Shortcut:

If actions contain run_shortcut, run it.

Otherwise no-op; the server executes MCP actions.

6.2 App Intent (Swift)

SendToPersonalOS(screenshot: IntentFile, mode: Enum[quick_search|deep_research], notes?: String)

Reads file, POSTs to /ingest, returns ActionPlan to Shortcut.

7) Auth & Secrets

GitHub: GitHub App (preferred) installed on repo; permissions: Issues (read/write), Projects (read/write via GraphQL), Metadata.

Google: OAuth client with scopes calendar, gmail.modify (send gated), openid email profile.

Alexa: Skill credentials; scope for Smart Home/Scenes (and Reminders if used).

Tokens stored encrypted (KMS/HashiCorp Vault or env-encrypted file) and linked to user account.

8) Error Handling

MCP errors bubble to Specialist → Supervisor crafts natural apology and a follow-up (“Try again” / “Open in web”).

Retries with exponential backoff for transient 5xx/429; idempotent task creation via client token (e.g., external_id on issue body).

Timeouts: 8s default for non-DR tools; 60–120s for Deep Research.

9) Observability & Metrics

Structured logs per request: request_id, user_id, agent, tool, latency_ms, ok, error_code.

Aggregate counters: tasks created, calendar events created, drafts created/sent, scenes run, DR runs.

PII-redacted logs; optional audit screen in web app.

10) Testing Plan

Unit: schema validation; MCP client adapters; Issue field updates; calendar time math.

Integration: end-to-end tool calls against sandbox GitHub/Google.

Voice: scripted transcripts for common flows; TTS stubs.

iOS: App Intent unit tests; Shortcut integration manual test checklist.

11) Performance Targets

Web Search: tool call ≤ 2s P95; overall ≤ 5s.

GitHub issue create+project attach ≤ 2.5s.

Calendar create ≤ 4s.

/ingest (screenshot → plan) ≤ 6s (quick), Deep Research excluded.

12) CI/CD

ci-web.yml: Node 20 + pnpm; build, typecheck, run unit/integration with mocked MCP.

ci-ios.yml: macOS runner; xcodebuild for scheme; basic UI test.

Preview deployments per PR (Vercel/Render) for web/api; TestFlight for iOS beta.

13) Security & Privacy

HTTPS everywhere; HSTS; CSRF for web forms.

OAuth tokens encrypted at rest; rotate keys; scope minimization.

MCP allow-list; no dynamic endpoints at runtime; pin server certs if feasible.

Screenshot flows: user-initiated only via Shortcut; optional Markup step before send.

14) Open Questions

Do you want GitHub Issue sub-issues for subtasks in v1 or convert checklists into child issues automatically?

Save Deep Research reports into GitHub as issues with a “Research” label (default on/off)?

Calendar default duration/working hours profile—hardcode or learn from history?

15) Acceptance Criteria (v1)

From web PTT: “Add a task ‘renew car tabs’ P1 due next Friday” → issue created, project fields set, UI shows it in This Week.

“What’s due today?” → read back titles + open web panel with results.

“Schedule lunch with Priya Thursday 12–1 at Mamnoon” → assistant reads back → on “yes” event is created (visible in Calendar panel).

“Draft email to Jeff about Q4 budget” → draft appears in Email panel; “send it” → send only after explicit confirmation.

“Search: best patio dinner bellevue tonight” → quick response.

“Deep research: WA med-spa licensing” → assistant asks; on “yes” produces long-form answer (and optionally creates a Research issue).

iOS Action Button flow produces at least one correct Action from screenshot within 6s P95.