Tech Spec — PersonalOS

## REFERENCE: Existing Voice Agent Template Structure

**Current Repository Base:** OpenAI Realtime API Agents Demo
**URL Reference:** https://github.com/openai/openai-realtime-agents

### Current Template Architecture Overview

This project is bootstrapped from the OpenAI Realtime Agents demo, which demonstrates multi-agent voice patterns using the OpenAI Realtime API and Agents SDK. Understanding this structure is critical for building PersonalOS on top of it.

#### Key Template Files We're Building Upon:
```
voice-agent-test/ (current state)
├── src/app/
│   ├── App.tsx                         # Main client component with session management
│   ├── page.tsx                        # Entry point
│   ├── types.ts                        # Core type definitions
│   ├── agentConfigs/                   # Agent definitions (we'll modify these)
│   │   ├── index.ts                    # Registry of all agent scenarios
│   │   ├── types.ts                    # Agent-related types
│   │   ├── guardrails.ts               # Output moderation
│   │   ├── simpleHandoff.ts            # Example: greeter → haiku pattern
│   │   ├── chatSupervisor/             # Pattern 1: Chat + Supervisor
│   │   │   ├── index.ts                # Realtime chat agent
│   │   │   ├── supervisorAgent.ts      # GPT-4.1 supervisor with tools
│   │   │   └── sampleData.ts           # Mock data
│   │   └── customerServiceRetail/      # Pattern 2: Sequential handoffs
│   │       ├── index.ts                # Agent graph setup
│   │       ├── authentication.ts       # Auth agent
│   │       ├── returns.ts              # Returns specialist
│   │       ├── sales.ts                # Sales agent
│   │       └── simulatedHuman.ts       # Escalation handler
│   ├── contexts/
│   │   ├── TranscriptContext.tsx       # Conversation state
│   │   └── EventContext.tsx            # Event logging
│   ├── hooks/
│   │   ├── useRealtimeSession.ts       # Core SDK integration
│   │   ├── useHandleSessionHistory.ts  # History handlers
│   │   └── useAudioDownload.ts         # Audio utilities
│   ├── lib/
│   │   ├── envSetup.ts
│   │   ├── codecUtils.ts
│   │   └── audioUtils.ts
│   ├── components/
│   │   ├── Transcript.tsx              # Message display
│   │   ├── Events.tsx                  # Event viewer
│   │   ├── BottomToolbar.tsx           # Controls
│   │   └── GuardrailChip.tsx           # Moderation display
│   └── api/
│       ├── session/route.ts            # Ephemeral token endpoint
│       ├── responses/route.ts          # Responses API proxy
│       └── health/route.ts             # Health check
```

#### Template Patterns We'll Leverage:

**1. Chat-Supervisor Pattern** (`chatSupervisor/`)
- Realtime chat agent handles basic interactions
- Defers to GPT-4.1 supervisor for complex tasks/tools
- We'll adapt this for PersonalOS Supervisor

**2. Sequential Handoff Pattern** (`customerServiceRetail/`)
- Specialist agents connected via handoff graph
- Each agent has focused instructions and tools
- We'll use this for IssuesAgent, CalendarAgent, etc.

**3. Key Infrastructure Already Built:**
- Session management with ephemeral tokens
- WebRTC audio streaming
- Tool call handling and response
- Transcript management
- Event logging
- Guardrail system for output moderation

#### Migration Strategy:
We'll transform the existing template into PersonalOS by:
1. Keeping core infrastructure (App.tsx, hooks, contexts, API routes)
2. Replacing demo agents with PersonalOS agents
3. Adding MCP client integration
4. Extending UI for Tasks/Calendar/Email panels
5. Adding /ingest endpoint for multimodal
6. Later: monorepo restructure for iOS

---

# PersonalOS Technical Specification
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

14) Scaffolding Plan (Phase 1: Foundation)

This section outlines the initial scaffolding needed to transform the template into PersonalOS.

### Phase 1.1: Project Structure Setup
**Goal:** Set up basic PersonalOS structure while keeping template infrastructure

**Tasks:**
1. Create `/src/app/agentConfigs/personalOS/` directory structure:
   ```
   personalOS/
   ├── index.ts                    # PersonalOS agent set export
   ├── supervisor.ts               # Main supervisor agent
   ├── specialists/
   │   ├── issuesAgent.ts         # GitHub Issues/Projects
   │   ├── calendarAgent.ts       # Google Calendar
   │   ├── emailAgent.ts          # Gmail
   │   ├── homeAgent.ts           # Alexa scenes
   │   ├── webSearchAgent.ts      # Quick search
   │   └── deepResearchAgent.ts   # Deep research
   └── tools/
       └── mcpTools.ts            # MCP tool definitions
   ```

2. Create `/src/lib/mcp/` directory for MCP client integration:
   ```
   mcp/
   ├── client.ts                   # MCP client wrapper
   ├── types.ts                    # MCP-specific types
   └── adapters/
       ├── githubAdapter.ts        # GitHub Issues MCP adapter
       ├── calendarAdapter.ts      # Google Calendar adapter
       ├── gmailAdapter.ts         # Gmail adapter
       ├── alexaAdapter.ts         # Alexa adapter
       └── searchAdapter.ts        # Search/research adapter
   ```

3. Create `/src/components/panels/` for new UI panels:
   ```
   panels/
   ├── TasksPanel.tsx              # GitHub Issues views
   ├── CalendarPanel.tsx           # Calendar events
   ├── EmailPanel.tsx              # Email drafts
   └── ActivityPanel.tsx           # Activity log (enhance existing)
   ```

4. Add environment variables to `.env`:
   ```
   OPENAI_API_KEY=<existing>
   GITHUB_APP_ID=
   GITHUB_INSTALLATION_ID=
   GITHUB_PRIVATE_KEY=
   GITHUB_REPO_OWNER=
   GITHUB_REPO_NAME=
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   GOOGLE_REFRESH_TOKEN=
   ALEXA_SKILL_CLIENT_ID=
   ALEXA_SKILL_CLIENT_SECRET=
   ```

### Phase 1.2: Core Agent Structure
**Goal:** Create PersonalOS agent scaffolding with proper handoffs

**Tasks:**
1. Create supervisor agent based on chatSupervisor pattern:
   - Intent detection logic (tasks/calendar/email/home/search/research)
   - Deep Research gating logic
   - High-impact action confirmation logic
   - Handoff orchestration to specialists

2. Create skeleton specialist agents:
   - Each agent with basic instructions and handoff config
   - Placeholder tool definitions (will connect to MCP later)
   - Confirmation/readback patterns

3. Register personalOS agent set in `/src/app/agentConfigs/index.ts`

4. Update App.tsx to support new agent configuration

### Phase 1.3: MCP Client Foundation
**Goal:** Basic MCP client infrastructure (even if servers aren't ready)

**Tasks:**
1. Create MCP client wrapper in `/src/lib/mcp/client.ts`:
   - Connection management
   - Tool discovery
   - Tool invocation interface
   - Error handling and retries

2. Create adapter interfaces for each integration:
   - Define TypeScript interfaces matching MCP schemas
   - Stub out adapter methods with mock responses
   - Add proper error handling

3. Add MCP tool registration system:
   - Load tools from MCP servers on startup
   - Convert MCP tool schemas to OpenAI function schemas
   - Map tool calls to MCP invocations

### Phase 1.4: UI Extensions
**Goal:** Add PersonalOS-specific UI components

**Tasks:**
1. Create TasksPanel component:
   - View selector (Today, This Week, Waiting, Overdue)
   - Task list display with status/priority/due
   - Click to open in GitHub
   - Initially populated with mock data

2. Create CalendarPanel component:
   - Upcoming events list
   - Event details display
   - Initially populated with mock data

3. Create EmailPanel component:
   - Draft list
   - Draft preview
   - Send confirmation UI
   - Initially populated with mock data

4. Update App.tsx layout to include panels:
   - Responsive grid layout
   - Panel visibility toggles
   - Panel state management

### Phase 1.5: API Route Extensions
**Goal:** Add PersonalOS-specific endpoints

**Tasks:**
1. Create `/src/app/api/ingest/route.ts`:
   - Accept multipart/form-data (image + notes)
   - Call GPT-4 Vision to extract entities
   - Return ActionPlan JSON
   - Initially return mock ActionPlan

2. Create `/src/app/api/mcp/route.ts` (optional proxy):
   - Proxy to MCP servers if needed for CORS/auth
   - Request/response logging
   - Error handling

3. Extend `/src/app/api/responses/route.ts`:
   - Add support for MCP tool execution
   - Add action confirmation logic
   - Add Deep Research timeout handling

### Phase 1.6: Type Safety & Schemas
**Goal:** Generate types from JSON schemas

**Tasks:**
1. Create `/src/schemas/` directory:
   - actionPlan.schema.json (for /ingest output)
   - githubIssues.schema.json (MCP tool schemas)
   - googleCalendar.schema.json
   - gmail.schema.json
   - alexa.schema.json
   - webSearch.schema.json

2. Set up schema-to-TypeScript generation:
   - Add json-schema-to-typescript or similar
   - Add npm script: `npm run generate-types`
   - Generate types into `/src/types/generated/`

3. Update all components to use generated types

### Phase 1.7: Testing Infrastructure
**Goal:** Set up basic testing before building features

**Tasks:**
1. Add testing dependencies:
   - vitest or jest
   - @testing-library/react
   - Mock service worker (MSW) for API mocking

2. Create test utilities:
   - `/src/test/mocks/mcpClient.ts` - Mock MCP responses
   - `/src/test/fixtures/` - Sample data (tasks, events, emails)
   - `/src/test/utils.tsx` - Test helpers (render with providers, etc.)

3. Write initial tests:
   - Agent handoff logic
   - Tool call handling
   - MCP adapter methods
   - UI panel rendering

### Phase 1.8: Documentation
**Goal:** Document the scaffolding for future development

**Tasks:**
1. Create `/docs/architecture.md`:
   - System architecture diagram
   - Agent flow diagrams
   - MCP integration patterns

2. Create `/docs/development.md`:
   - Setup instructions
   - Development workflow
   - Testing guide
   - Debugging tips

3. Update README.md:
   - Project overview
   - Quick start
   - Link to detailed docs

### Scaffolding Acceptance Criteria:
- [ ] PersonalOS agent configuration loads in UI dropdown
- [ ] Supervisor agent connects and responds to basic greetings
- [ ] Handoff to specialist agent works (even with placeholder tools)
- [ ] All three panels render with mock data
- [ ] /ingest endpoint accepts image and returns mock ActionPlan
- [ ] MCP client can connect to at least one mock MCP server
- [ ] All TypeScript types compile without errors
- [ ] Basic tests pass for core functionality
- [ ] Documentation is complete and accurate

### Next Steps After Scaffolding:
Once scaffolding is complete, we'll proceed to:
1. **Phase 2:** Implement GitHub Issues MCP server and integration
2. **Phase 3:** Implement Google Calendar MCP server and integration
3. **Phase 4:** Implement Gmail MCP server and integration
4. **Phase 5:** Implement Alexa and search integrations
5. **Phase 6:** iOS Shortcut and App Intent
6. **Phase 7:** Monorepo restructure

---

15) Open Questions

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