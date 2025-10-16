# PersonalOS Scaffolding Plan v2

## Quick Reference

**Current State:** OpenAI Realtime Agents demo template (working)
**Target State:** PersonalOS - Voice-first personal assistant with MCP integrations
**Strategy:** Incremental transformation, keeping core infrastructure intact

**Template Understanding:**
- Uses `@openai/agents/realtime` SDK
- RealtimeAgent pattern with voice, instructions, tools, handoffs
- Two key patterns: chatSupervisor (supervisor pattern) and customerServiceRetail (handoff graph)
- Existing infrastructure: session management, WebRTC audio, tool execution, guardrails

---

## Phase 1 Overview: Foundation (8 sub-phases)

### 1.1 Project Structure Setup ✅
**Status:** COMPLETED
**Actual Time:** 30 minutes

**Deliverables:**
- ✅ `/src/app/agentConfigs/personalOS/` directory with agent files
- ✅ `/src/lib/mcp/` directory with MCP client infrastructure
- ✅ `/src/components/panels/` directory with UI panels
- ✅ `/src/schemas/`, `/src/types/generated/`, `/src/test/` directories
- ✅ Updated `.env` and `.env.example` with all required credentials

**Created Structure:**
```
src/
├── app/agentConfigs/personalOS/
│   ├── specialists/
│   └── tools/
├── lib/mcp/
│   └── adapters/
├── components/panels/
├── schemas/
├── types/generated/
└── test/
    ├── mocks/
    └── fixtures/
```

---

### 1.2 Core Agent Structure
**Status:** IN PROGRESS
**Estimated Time:** 3-4 hours

**Deliverables:**
- [x] PersonalOS Supervisor agent with intent detection
- [ ] 6 specialist agents with skeleton structure
- [ ] Handoff graph configuration
- [ ] Registration in `agentConfigs/index.ts`

**Implementation Pattern (from template analysis):**

Each agent is a `RealtimeAgent` with:
```typescript
new RealtimeAgent({
  name: string,
  voice: 'sage' | 'shimmer' | 'alloy',
  handoffDescription?: string,  // For handoff targets
  instructions: string,          // Comprehensive prompt
  tools: FunctionTool[],        // OpenAI function tools
  handoffs: RealtimeAgent[],    // Populated after creation
})
```

**Specialist Agents to Create:**
1. **IssuesAgent** - Task management via GitHub Issues
   - Tools: create_task, set_status, update_priority, list_view
   - Pattern: Short confirmations, natural language parsing

2. **CalendarAgent** - Google Calendar management
   - Tools: create_calendar_event, list_events, update_event
   - Pattern: ALWAYS confirm before creating events

3. **EmailAgent** - Gmail management
   - Tools: draft_email, send_email, search_emails
   - Pattern: CRITICAL - never send without explicit "send" command

4. **HomeAgent** - Alexa smart home control
   - Tools: alexa_scene_run, alexa_device_control
   - Pattern: ALWAYS confirm before executing

5. **WebSearchAgent** - Quick web searches
   - Tools: web_search
   - Pattern: Fast, concise responses

6. **DeepResearchAgent** - Comprehensive research
   - Tools: deep_research
   - Pattern: GATED - requires explicit user consent

**Handoff Graph:**
```typescript
// Bidirectional handoffs between supervisor and all specialists
supervisorAgent.handoffs = [
  issuesAgent,
  calendarAgent,
  emailAgent,
  homeAgent,
  webSearchAgent,
  deepResearchAgent
];

// Each specialist can hand back to supervisor
issuesAgent.handoffs = [supervisorAgent];
calendarAgent.handoffs = [supervisorAgent];
emailAgent.handoffs = [supervisorAgent];
homeAgent.handoffs = [supervisorAgent];
webSearchAgent.handoffs = [supervisorAgent];
deepResearchAgent.handoffs = [supervisorAgent];
```

**Registration:**
```typescript
// src/app/agentConfigs/index.ts
export const allAgentSets: Record<string, RealtimeAgent[]> = {
  simpleHandoff: simpleHandoffScenario,
  customerServiceRetail: customerServiceRetailScenario,
  chatSupervisor: chatSupervisorScenario,
  personalOS: personalOSScenario,  // ADD THIS
};

export const defaultAgentSetKey = 'personalOS';  // CHANGE THIS
```

---

### 1.3 MCP Client Foundation
**Status:** Not Started
**Estimated Time:** 4-5 hours

**Deliverables:**
- [ ] MCP client wrapper (`/src/lib/mcp/client.ts`)
- [ ] 5 adapter interfaces with mock implementations
- [ ] Tool factory to convert MCP tools to OpenAI function format
- [ ] Error handling and retry logic

**Key Insight from Template:**
Tools in the template are defined using `tool()` from `@openai/agents/realtime`:

```typescript
import { tool } from '@openai/agents/realtime';

const myTool = tool({
  name: 'tool_name',
  description: 'What this tool does',
  parameters: {
    type: 'object',
    properties: { /* JSON Schema */ },
    required: [],
    additionalProperties: false,
  },
  execute: async (input, details) => {
    // Implementation
    return result;
  },
});
```

**Our MCP Integration Strategy:**

1. **MCP Client Wrapper** (`src/lib/mcp/client.ts`):
   - Manages connections to MCP servers (stdio, HTTP, WebSocket)
   - Discovers available tools from MCP servers
   - Provides unified interface: `callTool(serverName, toolName, args)`

2. **Tool Factory** (`src/lib/mcp/toolFactory.ts`):
   - Converts MCP tool schemas to OpenAI function format
   - Creates `tool()` instances that proxy to MCP servers
   - Example:
   ```typescript
   function createMCPTool(mcpServer: string, mcpTool: MCPTool) {
     return tool({
       name: mcpTool.name,
       description: mcpTool.description,
       parameters: convertMCPSchemaToOpenAI(mcpTool.inputSchema),
       execute: async (input) => {
         return mcpClient.callTool(mcpServer, mcpTool.name, input);
       },
     });
   }
   ```

3. **Adapters** (with mock implementations first):
   - `githubAdapter.ts` - Mock GitHub Issues/Projects responses
   - `calendarAdapter.ts` - Mock Google Calendar responses
   - `gmailAdapter.ts` - Mock Gmail responses
   - `alexaAdapter.ts` - Mock Alexa responses
   - `searchAdapter.ts` - Mock search responses

**Mock-First Approach:**
- Phase 1.3: Create adapters that return mock data
- Phase 2+: Replace with real MCP server connections
- Allows UI and agent development to proceed in parallel

---

### 1.4 UI Extensions
**Status:** Not Started
**Estimated Time:** 5-6 hours

**Deliverables:**
- [ ] TasksPanel component with view selector
- [ ] CalendarPanel component with event list
- [ ] EmailPanel component with draft management
- [ ] Updated App.tsx layout with panels

**Current UI Structure (from template):**
```typescript
// src/app/App.tsx renders:
- BottomToolbar (PTT controls)
- Transcript (conversation history)
- Events (realtime events log)
```

**Our Extension:**
Add 3-column panel layout alongside existing components:

```
+------------------------+
|  PTT Toolbar           |
+------------------------+
|  Transcript  | Panels  |
|              |---------|
|              | Tasks   |
|              | Cal     |
|              | Email   |
+------------------------+
|  Events (collapsible)  |
+------------------------+
```

**Component Specs:**

1. **TasksPanel.tsx**
   ```typescript
   - View selector: [Today | This Week | Waiting | Overdue]
   - Task list with status badges, priority, due date
   - Click to open in GitHub
   - Mock data initially
   ```

2. **CalendarPanel.tsx**
   ```typescript
   - Upcoming events (next 7 days)
   - Event cards: title, time, location, attendees
   - Mock data initially
   ```

3. **EmailPanel.tsx**
   ```typescript
   - Draft list
   - Draft preview with send button
   - Send triggers voice confirmation flow
   - Mock data initially
   ```

**Styling:**
- Tailwind CSS (already configured in template)
- Responsive grid layout
- Panel toggle/minimize functionality
- Match existing dark theme

---

### 1.5 API Route Extensions
**Status:** Not Started
**Estimated Time:** 3-4 hours

**Deliverables:**
- [ ] `/api/ingest` endpoint for multimodal capture
- [ ] Extended `/api/responses` for MCP tool execution (if needed)

**Current API Routes:**
- `/api/session` - Creates ephemeral Realtime API tokens
- `/api/responses` - Proxy to OpenAI Responses API (used by supervisorAgent)
- `/api/health` - Health check

**New Route: `/api/ingest`**

Purpose: Accept screenshot + text from iOS Shortcut, extract entities, return ActionPlan

```typescript
// POST /api/ingest
// Content-Type: multipart/form-data
// Fields: image (file), notes (string), mode (quick_search | deep_research)

// Response: ActionPlan JSON
{
  "actions": [
    {
      "type": "create_task",
      "title": "Renew car tabs",
      "due": "2025-10-18",
      "priority": "P1"
    },
    // ... more actions
  ]
}
```

Implementation:
1. Accept multipart upload
2. Call GPT-4 Vision to analyze image + notes
3. Extract structured actions
4. Return ActionPlan JSON
5. Initially return mock data

**Responses API Extension:**
Template already uses `/api/responses` for supervisor tool calls. We may need to:
- Add MCP tool execution logic
- Add timeout handling for Deep Research (60-120s)
- This might not be needed if MCP tools execute client-side

---

### 1.6 Type Safety & Schemas
**Status:** Not Started
**Estimated Time:** 2-3 hours

**Deliverables:**
- [ ] JSON schemas in `/src/schemas/`
- [ ] Type generation setup
- [ ] Generated types in `/src/types/generated/`
- [ ] Updated imports across codebase

**JSON Schemas to Create:**

1. **actionPlan.schema.json** - For /ingest output
2. **githubIssues.schema.json** - MCP tool schemas
3. **googleCalendar.schema.json** - MCP tool schemas
4. **gmail.schema.json** - MCP tool schemas
5. **alexa.schema.json** - MCP tool schemas
6. **webSearch.schema.json** - MCP tool schemas

**Type Generation:**
```bash
npm install --save-dev json-schema-to-typescript
```

Add script to `package.json`:
```json
{
  "scripts": {
    "generate-types": "json2ts -i src/schemas -o src/types/generated"
  }
}
```

**Benefits:**
- Compile-time safety for tool parameters
- IntelliSense in IDE
- Catch errors before runtime
- Single source of truth (schemas)

---

### 1.7 Testing Infrastructure
**Status:** Not Started
**Estimated Time:** 4-5 hours

**Deliverables:**
- [ ] Test dependencies installed
- [ ] Mock utilities for MCP client
- [ ] Test fixtures (sample data)
- [ ] Initial test suite passing

**Testing Stack:**
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Test Structure:**
```
src/test/
├── mocks/
│   ├── mcpClient.ts          # Mock MCP responses
│   └── realtimeAgent.ts      # Mock agent interactions
├── fixtures/
│   ├── tasks.json            # Sample task data
│   ├── events.json           # Sample calendar events
│   └── emails.json           # Sample email drafts
└── utils.tsx                 # Test helpers (render with providers)
```

**Test Coverage:**
1. Agent handoff logic
2. MCP tool call handling
3. Tool parameter validation
4. UI panel rendering with mock data
5. API route responses

**Example Test:**
```typescript
describe('IssuesAgent', () => {
  it('creates task with priority and due date', async () => {
    const result = await createTaskTool.execute({
      title: 'Test task',
      priority: 'P1',
      due: '2025-10-18'
    });

    expect(result.number).toBeDefined();
    expect(result.priority).toBe('P1');
  });
});
```

---

### 1.8 Documentation
**Status:** Not Started
**Estimated Time:** 2-3 hours

**Deliverables:**
- [ ] `/docs/architecture.md` with diagrams
- [ ] `/docs/development.md` with setup guide
- [ ] Updated `README.md`

**Architecture Doc:**
- System architecture diagram (agents, MCP, UI)
- Agent flow diagrams (supervisor → specialist → tool → response)
- MCP integration patterns
- Tool execution flow
- Confirmation patterns

**Development Doc:**
- Environment setup (env vars, dependencies)
- Running locally (`npm run dev`)
- Adding new agents
- Adding new MCP tools
- Testing guide
- Debugging tips (Events panel, breadcrumbs)

**README Update:**
- Project overview
- Quick start
- Key features
- Architecture overview (link to detailed docs)
- Contributing guide

---

## Total Estimated Time: 20-28 hours

---

## Scaffolding Acceptance Criteria

Before moving to Phase 2, verify:

### Agent System
- [ ] **Agent Selection:** PersonalOS appears in UI dropdown
- [ ] **Basic Conversation:** Supervisor agent responds to greetings
- [ ] **Intent Detection:** Supervisor correctly routes to specialist agents
- [ ] **Handoffs:** Can transfer between supervisor and specialists and back
- [ ] **Tool Execution:** Mock MCP tools execute and return data

### UI
- [ ] **Panels Render:** All three panels (Tasks, Calendar, Email) render with mock data
- [ ] **Panel Interaction:** Can toggle views in TasksPanel
- [ ] **Responsive:** Layout works on desktop and tablet

### API
- [ ] **Multimodal:** `/api/ingest` accepts images and returns ActionPlan
- [ ] **Session:** Existing `/api/session` still works
- [ ] **Responses:** Existing `/api/responses` still works for supervisor

### Type Safety
- [ ] **Compilation:** All TypeScript compiles without errors
- [ ] **Types Generated:** `npm run generate-types` produces valid types
- [ ] **Imports:** Generated types used across codebase

### Testing
- [ ] **Tests Pass:** Basic test suite passes (`npm test`)
- [ ] **Coverage:** >70% coverage on new code

### Documentation
- [ ] **Docs Complete:** All docs written and accurate
- [ ] **README Updated:** Clear quick start instructions

---

## Phase 2 Preview: GitHub Issues Integration (Real MCP)

After scaffolding is complete, we'll implement the first real MCP integration:

### Deliverables:
1. **MCP Server Setup**
   - Build or configure GitHub Issues MCP server
   - Implement REST API for Issues
   - Implement GraphQL for Projects v2

2. **Replace Mock Adapter**
   - Connect `githubAdapter.ts` to real MCP server
   - Handle authentication (GitHub App or PAT)
   - Implement retry logic

3. **End-to-End Flow**
   - Voice: "Add task 'Review Q4 budget' P1 due Friday"
   - Supervisor routes to IssuesAgent
   - IssuesAgent calls create_task MCP tool
   - Real GitHub Issue created
   - Confirmation spoken and shown in TasksPanel

4. **Task Views**
   - Implement Today, This Week, Waiting, Overdue filters
   - Real data populates TasksPanel
   - Click-through to GitHub works

**Estimated Time:** 12-16 hours

---

## Implementation Order (Recommended)

Based on dependencies and risk:

1. ✅ **Phase 1.1** - Structure (DONE)
2. **Phase 1.2** - Agents (IN PROGRESS)
   - Complete all 6 specialists
   - Wire up handoff graph
   - Register in index.ts
3. **Phase 1.6** - Schemas (do early for types)
4. **Phase 1.3** - MCP with mocks
5. **Phase 1.4** - UI panels
6. **Phase 1.7** - Tests
7. **Phase 1.5** - API /ingest
8. **Phase 1.8** - Docs

---

## Key Architecture Decisions

### 1. Keep Template Infrastructure ✅
**Decision:** Don't rewrite core infrastructure
**Rationale:** Template provides solid foundation (session mgmt, WebRTC, tool execution)
**Impact:** Focus energy on PersonalOS-specific features

### 2. MCP-First Approach ✅
**Decision:** Build MCP client abstraction layer early
**Rationale:** Core to PersonalOS vision; enables parallel development
**Impact:** UI/agents can use mocks while MCP servers are built

### 3. Incremental UI ✅
**Decision:** Add panels alongside existing transcript/events
**Rationale:** Maintain working voice interface while adding data views
**Impact:** Can test voice + visual together

### 4. Mock-First Development ✅
**Decision:** Use mock data and adapters before real MCP servers
**Rationale:** Unblocks frontend development; validates UX early
**Impact:** Can iterate on UX without waiting for integrations

### 5. Type Safety First ✅
**Decision:** Generate types from schemas before implementation
**Rationale:** Catches errors early; improves DX
**Impact:** Slight upfront cost, major downstream benefit

### 6. Supervisor Pattern (NEW)
**Decision:** Use supervisor agent for intent detection, not direct handoffs
**Rationale:** Matches template pattern; centralized routing logic
**Impact:** Supervisor becomes "brain", specialists are focused executors

### 7. Tool Execution Model (NEW)
**Decision:** Tools execute client-side (in agent tool.execute()), not server-side
**Rationale:** Template pattern; MCP client runs in Next.js server
**Impact:** `/api/responses` may not need modification; tools call MCP directly

---

## File Tree After Phase 1

```
voice-agent-test/
├── src/
│   ├── app/
│   │   ├── agentConfigs/
│   │   │   ├── personalOS/                    # NEW
│   │   │   │   ├── index.ts                   # Export personalOSScenario
│   │   │   │   ├── supervisor.ts              # Main supervisor agent
│   │   │   │   ├── specialists/
│   │   │   │   │   ├── issuesAgent.ts
│   │   │   │   │   ├── calendarAgent.ts
│   │   │   │   │   ├── emailAgent.ts
│   │   │   │   │   ├── homeAgent.ts
│   │   │   │   │   ├── webSearchAgent.ts
│   │   │   │   │   └── deepResearchAgent.ts
│   │   │   │   └── tools/
│   │   │   │       ├── githubTools.ts         # MCP tool wrappers
│   │   │   │       ├── calendarTools.ts
│   │   │   │       ├── gmailTools.ts
│   │   │   │       ├── alexaTools.ts
│   │   │   │       └── searchTools.ts
│   │   │   ├── chatSupervisor/                # KEEP (reference)
│   │   │   ├── customerServiceRetail/         # KEEP (reference)
│   │   │   ├── simpleHandoff.ts               # KEEP (reference)
│   │   │   ├── types.ts
│   │   │   ├── guardrails.ts
│   │   │   └── index.ts                       # ADD personalOS here
│   │   ├── components/
│   │   │   ├── panels/                        # NEW
│   │   │   │   ├── TasksPanel.tsx
│   │   │   │   ├── CalendarPanel.tsx
│   │   │   │   └── EmailPanel.tsx
│   │   │   ├── Transcript.tsx
│   │   │   ├── Events.tsx
│   │   │   ├── BottomToolbar.tsx
│   │   │   └── GuardrailChip.tsx
│   │   ├── contexts/
│   │   │   ├── TranscriptContext.tsx
│   │   │   └── EventContext.tsx
│   │   ├── hooks/
│   │   │   ├── useRealtimeSession.ts
│   │   │   ├── useHandleSessionHistory.ts
│   │   │   └── useAudioDownload.ts
│   │   ├── lib/
│   │   │   ├── envSetup.ts
│   │   │   ├── codecUtils.ts
│   │   │   └── audioUtils.ts
│   │   ├── api/
│   │   │   ├── session/route.ts
│   │   │   ├── responses/route.ts
│   │   │   ├── health/route.ts
│   │   │   └── ingest/                        # NEW
│   │   │       └── route.ts
│   │   ├── App.tsx                            # MODIFY (add panels)
│   │   ├── page.tsx
│   │   └── types.ts
│   ├── lib/
│   │   └── mcp/                               # NEW
│   │       ├── client.ts                      # MCP client wrapper
│   │       ├── types.ts                       # MCP type definitions
│   │       ├── toolFactory.ts                 # Convert MCP → OpenAI tools
│   │       └── adapters/
│   │           ├── githubAdapter.ts           # Mock GitHub responses
│   │           ├── calendarAdapter.ts         # Mock Calendar responses
│   │           ├── gmailAdapter.ts            # Mock Gmail responses
│   │           ├── alexaAdapter.ts            # Mock Alexa responses
│   │           └── searchAdapter.ts           # Mock Search responses
│   ├── schemas/                               # NEW
│   │   ├── actionPlan.schema.json
│   │   ├── githubIssues.schema.json
│   │   ├── googleCalendar.schema.json
│   │   ├── gmail.schema.json
│   │   ├── alexa.schema.json
│   │   └── webSearch.schema.json
│   ├── types/
│   │   └── generated/                         # NEW (gitignored)
│   │       ├── ActionPlan.ts
│   │       ├── GithubIssues.ts
│   │       ├── GoogleCalendar.ts
│   │       ├── Gmail.ts
│   │       ├── Alexa.ts
│   │       └── WebSearch.ts
│   └── test/                                  # NEW
│       ├── mocks/
│       │   ├── mcpClient.ts
│       │   └── realtimeAgent.ts
│       ├── fixtures/
│       │   ├── tasks.json
│       │   ├── events.json
│       │   └── emails.json
│       └── utils.tsx
├── docs/
│   ├── architecture.md                        # NEW
│   ├── development.md                         # NEW
│   ├── SCAFFOLDING_PLAN.md                    # THIS FILE (updated)
│   ├── techspec.md
│   └── mvp_prd.md
├── .env                                       # UPDATED
├── .env.example                               # NEW
├── package.json                               # UPDATED (add scripts, deps)
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── README.md                                  # UPDATED
```

---

## Risk Mitigation

### Risk 1: MCP SDK Maturity
**Mitigation:** Use mock adapters first, validate interface before real integration

### Risk 2: OpenAI Realtime API Limits
**Mitigation:** Understand rate limits, implement queueing for tool calls

### Risk 3: Type Generation Complexity
**Mitigation:** Start with simple schemas, validate generation pipeline early

### Risk 4: Agent Handoff Complexity
**Mitigation:** Follow template pattern exactly, test with simple flows first

### Risk 5: UI Layout Complexity
**Mitigation:** Use Tailwind's grid/flex, test responsive early, keep panels simple

---

## Success Metrics (Phase 1)

### Functional
- [ ] Can have basic voice conversation with PersonalOS supervisor
- [ ] Can trigger handoff to each specialist agent
- [ ] Can execute at least one tool in each domain (with mocks)
- [ ] All panels render and display mock data
- [ ] /ingest endpoint returns valid ActionPlan

### Technical
- [ ] Zero TypeScript errors
- [ ] All tests pass
- [ ] Type generation pipeline works
- [ ] Dev server runs without errors
- [ ] Build succeeds

### Quality
- [ ] Code follows template patterns
- [ ] Clear separation of concerns (agents/tools/adapters)
- [ ] Good test coverage (>70%)
- [ ] Documentation complete and accurate

---

## Next Steps

1. ✅ Review updated plan
2. Complete Phase 1.2 (agents)
3. Work through remaining phases
4. Validate each phase before moving forward
5. Update this document with actual times and learnings

---

## Notes & Learnings

### From Template Analysis:
- RealtimeAgent pattern is straightforward and well-documented
- Tool definition with `tool()` is elegant
- Handoff graph is simple array of agent references
- Instructions are critical - be very explicit and detailed
- Template uses `/api/responses` for supervisor pattern (GPT-4.1 stateless calls)
- Events panel is incredibly useful for debugging

### Development Tips:
- Use Events panel to debug tool calls and handoffs
- Test voice flows with simple examples first
- Keep instructions concise but complete
- Mock data should be realistic (helps validate UX)
- Iterate on agent prompts based on actual behavior

### Time Estimates:
- Phase 1.1 took 30min (faster than estimated 2-3hrs)
- This suggests remaining phases may also be faster
- Template provides more scaffolding than anticipated
- Focus on understanding patterns > building from scratch
