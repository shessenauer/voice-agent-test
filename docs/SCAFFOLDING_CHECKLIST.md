# PersonalOS Scaffolding Checklist

## Overview

This checklist provides step-by-step instructions for implementing Phase 1 of PersonalOS. Each checkbox represents a concrete, completable task.

**Current Status:** Phase 1.1 Complete ✅ | Phase 1.2 In Progress 🔄

---

## Phase 1.1: Project Structure Setup ✅ COMPLETE

- [x] Create `/src/app/agentConfigs/personalOS/` directory structure
- [x] Create `/src/app/agentConfigs/personalOS/specialists/` directory
- [x] Create `/src/app/agentConfigs/personalOS/tools/` directory
- [x] Create `/src/lib/mcp/` directory structure
- [x] Create `/src/lib/mcp/adapters/` directory
- [x] Create `/src/components/panels/` directory
- [x] Create `/src/schemas/` directory
- [x] Create `/src/types/generated/` directory
- [x] Create `/src/test/mocks/` directory
- [x] Create `/src/test/fixtures/` directory
- [x] Create `.env.example` with all required placeholders
- [x] Update `.env` with PersonalOS credential placeholders

---

## Phase 1.2: Core Agent Structure 🔄 IN PROGRESS

### Supervisor Agent

- [x] Create `src/app/agentConfigs/personalOS/supervisor.ts`
- [x] Define supervisor RealtimeAgent with voice: 'sage'
- [x] Write comprehensive instructions for intent detection
- [x] Add Deep Research gating logic to instructions
- [x] Add confirmation patterns to instructions
- [ ] Add handoffs array (populate later)
- [ ] Test supervisor instructions for clarity

### Specialist Agents (6 agents)

#### Issues Agent

- [ ] Create `src/app/agentConfigs/personalOS/specialists/issuesAgent.ts`
- [ ] Define RealtimeAgent with name: 'Issues Agent'
- [ ] Write instructions for task management
- [ ] Add patterns for: create, update, list, complete tasks
- [ ] Add priority handling: P0, P1, P2, P3
- [ ] Add status handling: Todo, In Progress, Waiting, Blocked, Done
- [ ] Add view handling: Today, This Week, Waiting, Overdue
- [ ] Set tools: [] (will populate in Phase 1.3)
- [ ] Set handoffs: [] (will populate later)

#### Calendar Agent

- [ ] Create `src/app/agentConfigs/personalOS/specialists/calendarAgent.ts`
- [ ] Define RealtimeAgent with name: 'Calendar Agent'
- [ ] Write instructions for calendar management
- [ ] Add event creation confirmation pattern
- [ ] Add natural language time parsing instructions
- [ ] Add attendee/location handling
- [ ] Set tools: [] (will populate in Phase 1.3)
- [ ] Set handoffs: [] (will populate later)

#### Email Agent

- [ ] Create `src/app/agentConfigs/personalOS/specialists/emailAgent.ts`
- [ ] Define RealtimeAgent with name: 'Email Agent'
- [ ] Write instructions for email management
- [ ] Add CRITICAL send gating: never send without explicit "send"
- [ ] Add draft vs send distinction
- [ ] Add search functionality instructions
- [ ] Set tools: [] (will populate in Phase 1.3)
- [ ] Set handoffs: [] (will populate later)

#### Home Agent

- [ ] Create `src/app/agentConfigs/personalOS/specialists/homeAgent.ts`
- [ ] Define RealtimeAgent with name: 'Home Agent'
- [ ] Write instructions for smart home control
- [ ] Add scene execution confirmation pattern
- [ ] Add device control confirmation pattern
- [ ] Add scene mapping instructions (natural → sceneId)
- [ ] Set tools: [] (will populate in Phase 1.3)
- [ ] Set handoffs: [] (will populate later)

#### Web Search Agent

- [ ] Create `src/app/agentConfigs/personalOS/specialists/webSearchAgent.ts`
- [ ] Define RealtimeAgent with name: 'Web Search Agent'
- [ ] Write instructions for quick search
- [ ] Add concise response pattern
- [ ] Add citation pattern
- [ ] Set tools: [] (will populate in Phase 1.3)
- [ ] Set handoffs: [] (will populate later)

#### Deep Research Agent

- [ ] Create `src/app/agentConfigs/personalOS/specialists/deepResearchAgent.ts`
- [ ] Define RealtimeAgent with name: 'Deep Research Agent'
- [ ] Write instructions for comprehensive research
- [ ] Add detailed report pattern
- [ ] Add optional GitHub Issue creation for research
- [ ] Set tools: [] (will populate in Phase 1.3)
- [ ] Set handoffs: [] (will populate later)

### Handoff Graph Configuration

- [ ] Import all specialist agents in `supervisor.ts`
- [ ] Set `supervisorAgent.handoffs` to array of all 6 specialists
- [ ] Set each specialist's `handoffs` to `[supervisorAgent]`
- [ ] Verify bidirectional handoff structure

### Index File

- [ ] Create `src/app/agentConfigs/personalOS/index.ts`
- [ ] Export `personalOSScenario` as array starting with supervisor
- [ ] Export `personalOSCompanyName` (optional, for guardrails)
- [ ] Set default export to `personalOSScenario`

### Registration

- [ ] Open `src/app/agentConfigs/index.ts`
- [ ] Import `personalOSScenario` from `./personalOS`
- [ ] Add `personalOS: personalOSScenario` to `allAgentSets`
- [ ] Change `defaultAgentSetKey` to `'personalOS'`
- [ ] Save and verify TypeScript compiles

### Testing

- [ ] Run `npm run dev`
- [ ] Verify PersonalOS appears in agent dropdown (if applicable)
- [ ] Test basic voice interaction with supervisor
- [ ] Test handoff to at least one specialist
- [ ] Verify no TypeScript errors in console

---

## Phase 1.3: MCP Client Foundation

### MCP Types

- [ ] Create `src/lib/mcp/types.ts`
- [ ] Define `MCPServer` interface (name, url, type)
- [ ] Define `MCPTool` interface (name, description, inputSchema, outputSchema)
- [ ] Define `MCPToolCall` interface (server, tool, args)
- [ ] Define `MCPToolResult` interface (success, data, error)
- [ ] Export all types

### MCP Client Wrapper

- [ ] Create `src/lib/mcp/client.ts`
- [ ] Create `MCPClient` class
- [ ] Add `servers: Map<string, MCPServer>` property
- [ ] Add `tools: Map<string, MCPTool[]>` property
- [ ] Implement `registerServer(name, config)` method
- [ ] Implement `discoverTools(serverName)` method
- [ ] Implement `callTool(serverName, toolName, args)` method
- [ ] Add error handling with try/catch
- [ ] Add retry logic with exponential backoff
- [ ] Add timeout handling (8s default, 120s for deep research)
- [ ] Export singleton instance `mcpClient`

### Tool Factory

- [ ] Create `src/lib/mcp/toolFactory.ts`
- [ ] Import `tool` from '@openai/agents/realtime'
- [ ] Implement `convertMCPSchemaToOpenAI(mcpSchema)` function
- [ ] Implement `createMCPTool(serverName, mcpTool)` function
- [ ] Return `tool()` instance that calls `mcpClient.callTool()`
- [ ] Add error wrapping for tool execution failures
- [ ] Export factory functions

### GitHub Adapter (Mock)

- [ ] Create `src/lib/mcp/adapters/githubAdapter.ts`
- [ ] Define mock responses for all GitHub tools
- [ ] Implement `createTaskMock(title, priority?, due?)` → returns {number: 123}
- [ ] Implement `setStatusMock(number, status)` → returns {success: true}
- [ ] Implement `updatePriorityMock(number, priority)` → returns {success: true}
- [ ] Implement `listViewMock(view)` → returns array of tasks
- [ ] Export `githubMCPServer` config with mock tools
- [ ] Register server with `mcpClient.registerServer('github', ...)`

### Calendar Adapter (Mock)

- [ ] Create `src/lib/mcp/adapters/calendarAdapter.ts`
- [ ] Define mock responses for calendar tools
- [ ] Implement `createEventMock(title, start, end, ...)` → returns {id: 'evt_123'}
- [ ] Implement `listEventsMock(startDate, endDate)` → returns array of events
- [ ] Implement `updateEventMock(id, updates)` → returns updated event
- [ ] Export `calendarMCPServer` config with mock tools
- [ ] Register server with `mcpClient.registerServer('calendar', ...)`

### Gmail Adapter (Mock)

- [ ] Create `src/lib/mcp/adapters/gmailAdapter.ts`
- [ ] Define mock responses for Gmail tools
- [ ] Implement `draftEmailMock(to, subject, body)` → returns {draft_id: 'draft_123'}
- [ ] Implement `sendEmailMock(draft_id)` → returns {success: true, message_id: '...'}
- [ ] Implement `searchEmailsMock(query)` → returns array of emails
- [ ] Export `gmailMCPServer` config with mock tools
- [ ] Register server with `mcpClient.registerServer('gmail', ...)`

### Alexa Adapter (Mock)

- [ ] Create `src/lib/mcp/adapters/alexaAdapter.ts`
- [ ] Define mock responses for Alexa tools
- [ ] Implement `runSceneMock(sceneId)` → returns {success: true}
- [ ] Implement `listScenesMock()` → returns array of scenes
- [ ] Implement `deviceControlMock(deviceId, action)` → returns {success: true}
- [ ] Export `alexaMCPServer` config with mock tools
- [ ] Register server with `mcpClient.registerServer('alexa', ...)`

### Search Adapter (Mock)

- [ ] Create `src/lib/mcp/adapters/searchAdapter.ts`
- [ ] Define mock responses for search tools
- [ ] Implement `webSearchMock(query)` → returns {results: [...], summary: '...'}
- [ ] Implement `deepResearchMock(question)` → returns {report: '...', sources: [...]}
- [ ] Export `searchMCPServer` config with mock tools
- [ ] Register server with `mcpClient.registerServer('search', ...)`

### Tool Registration

- [ ] Create `src/app/agentConfigs/personalOS/tools/githubTools.ts`
- [ ] Import `createMCPTool` from toolFactory
- [ ] Import `githubMCPServer` from adapters
- [ ] Create tools: `createTask`, `setStatus`, `updatePriority`, `listView`
- [ ] Export array of tools
- [ ] Add tools to `issuesAgent.tools`

- [ ] Create `src/app/agentConfigs/personalOS/tools/calendarTools.ts`
- [ ] Create tools: `createCalendarEvent`, `listEvents`, `updateEvent`
- [ ] Export array of tools
- [ ] Add tools to `calendarAgent.tools`

- [ ] Create `src/app/agentConfigs/personalOS/tools/gmailTools.ts`
- [ ] Create tools: `draftEmail`, `sendEmail`, `searchEmails`
- [ ] Export array of tools
- [ ] Add tools to `emailAgent.tools`

- [ ] Create `src/app/agentConfigs/personalOS/tools/alexaTools.ts`
- [ ] Create tools: `alexaSceneRun`, `alexaListScenes`, `alexaDeviceControl`
- [ ] Export array of tools
- [ ] Add tools to `homeAgent.tools`

- [ ] Create `src/app/agentConfigs/personalOS/tools/searchTools.ts`
- [ ] Create tools: `webSearch`, `deepResearch`
- [ ] Export array of tools
- [ ] Add tools to `webSearchAgent.tools` and `deepResearchAgent.tools`

### Testing

- [ ] Test tool creation doesn't throw errors
- [ ] Test calling a mock tool returns expected structure
- [ ] Test error handling when tool fails
- [ ] Verify all tools are registered correctly
- [ ] Test tool execution from agent (manual voice test)

---

## Phase 1.4: UI Extensions

### Read Existing UI Structure

- [ ] Read `src/app/App.tsx` to understand current layout
- [ ] Read `src/app/components/Transcript.tsx` for reference
- [ ] Read `src/app/components/Events.tsx` for reference
- [ ] Identify where to inject panels in layout

### TasksPanel Component

- [ ] Create `src/components/panels/TasksPanel.tsx`
- [ ] Import React, useState, useEffect
- [ ] Define mock tasks data structure
- [ ] Create view selector: [Today | This Week | Waiting | Overdue]
- [ ] Implement state for selected view
- [ ] Implement filter logic for each view
- [ ] Create task list display with:
  - [ ] Task title
  - [ ] Status badge (color coded)
  - [ ] Priority badge (P0-P3)
  - [ ] Due date (formatted)
- [ ] Add click handler to open task in GitHub (open in new tab)
- [ ] Style with Tailwind CSS matching app theme
- [ ] Export TasksPanel component

### CalendarPanel Component

- [ ] Create `src/components/panels/CalendarPanel.tsx`
- [ ] Import React, useState, useEffect
- [ ] Define mock events data structure (next 7 days)
- [ ] Create event card layout:
  - [ ] Event title
  - [ ] Date/time display
  - [ ] Location (if present)
  - [ ] Attendees count
- [ ] Add grouping by date
- [ ] Style event cards with Tailwind CSS
- [ ] Add hover effects
- [ ] Export CalendarPanel component

### EmailPanel Component

- [ ] Create `src/components/panels/EmailPanel.tsx`
- [ ] Import React, useState
- [ ] Define mock drafts data structure
- [ ] Create draft list layout:
  - [ ] Draft subject
  - [ ] Recipients
  - [ ] Preview of body (first 100 chars)
- [ ] Add draft selection state
- [ ] Create draft preview pane
- [ ] Add "Send" button with confirmation modal
- [ ] Style with Tailwind CSS
- [ ] Export EmailPanel component

### Mock Data

- [ ] Create `src/test/fixtures/tasks.json` with 10 sample tasks
- [ ] Include variety of statuses, priorities, and due dates
- [ ] Create `src/test/fixtures/events.json` with 5 sample events
- [ ] Include events today, tomorrow, and next week
- [ ] Create `src/test/fixtures/emails.json` with 3 sample drafts
- [ ] Include variety of recipients and topics

### App Layout Update

- [ ] Open `src/app/App.tsx`
- [ ] Import TasksPanel, CalendarPanel, EmailPanel
- [ ] Identify current layout structure (likely flex/grid)
- [ ] Design responsive grid:
  - [ ] Desktop: Main content (2/3) | Panels sidebar (1/3)
  - [ ] Tablet: Stacked or tabs
  - [ ] Mobile: Tabs only
- [ ] Add panel toggle buttons (show/hide panels)
- [ ] Add panel minimize/expand functionality
- [ ] Implement responsive breakpoints with Tailwind
- [ ] Test layout at different screen sizes

### Styling

- [ ] Ensure panels match existing dark theme
- [ ] Use consistent spacing (Tailwind spacing scale)
- [ ] Use consistent borders/shadows
- [ ] Add smooth transitions for show/hide
- [ ] Test color contrast for accessibility

### Testing

- [ ] Verify all panels render with mock data
- [ ] Test view switching in TasksPanel
- [ ] Test draft selection in EmailPanel
- [ ] Test responsive layout breakpoints
- [ ] Test panel toggle/minimize functionality
- [ ] Verify no layout shift when panels appear

---

## Phase 1.5: API Route Extensions

### Read Existing API Routes

- [ ] Read `src/app/api/session/route.ts` to understand pattern
- [ ] Read `src/app/api/responses/route.ts` for reference
- [ ] Understand NextJS App Router API route structure

### Ingest Endpoint

- [ ] Create `src/app/api/ingest/route.ts`
- [ ] Import NextRequest, NextResponse
- [ ] Define POST handler
- [ ] Accept multipart/form-data:
  - [ ] `image`: File (PNG/JPG)
  - [ ] `notes`: string (optional)
  - [ ] `mode`: 'quick_search' | 'deep_research'
- [ ] Validate file type and size
- [ ] Extract image buffer
- [ ] Create mock ActionPlan response structure:
  ```typescript
  {
    actions: [
      { type: "create_task", title: "...", priority: "P1", due: "..." },
      { type: "create_event", title: "...", start_iso: "...", end_iso: "..." },
      // ...
    ];
  }
  ```
- [ ] For now, return mock ActionPlan (later: call GPT-4 Vision)
- [ ] Handle errors with try/catch
- [ ] Return JSON response
- [ ] Export POST as default

### ActionPlan Type

- [ ] Create `src/types/actionPlan.ts`
- [ ] Define ActionType union type
- [ ] Define CreateTaskAction interface
- [ ] Define CreateEventAction interface
- [ ] Define DraftEmailAction interface
- [ ] Define RunShortcutAction interface
- [ ] Define ActionPlan interface
- [ ] Export types

### Testing

- [ ] Test endpoint with curl/Postman:
  ```bash
  curl -X POST http://localhost:3000/api/ingest \
    -F "image=@test.png" \
    -F "notes=Renew car tabs P1 due Friday" \
    -F "mode=quick_search"
  ```
- [ ] Verify response structure matches ActionPlan type
- [ ] Test with missing fields (should error gracefully)
- [ ] Test with invalid image type (should reject)

### Responses API Extension (Optional)

- [ ] Determine if MCP tools need server-side execution
- [ ] If yes:
  - [ ] Read existing `/api/responses/route.ts`
  - [ ] Add MCP tool execution logic
  - [ ] Add timeout handling for Deep Research
- [ ] If no: Skip (tools execute client-side in agent)

---

## Phase 1.6: Type Safety & Schemas

### JSON Schemas

#### ActionPlan Schema

- [ ] Create `src/schemas/actionPlan.schema.json`
- [ ] Define schema for ActionPlan type
- [ ] Include all action types
- [ ] Add required fields
- [ ] Add validation rules

#### GitHub Issues Schema

- [ ] Create `src/schemas/githubIssues.schema.json`
- [ ] Define create_task request/response
- [ ] Define set_status request/response
- [ ] Define update_priority request/response
- [ ] Define list_view request/response
- [ ] Include enum for priority and status

#### Google Calendar Schema

- [ ] Create `src/schemas/googleCalendar.schema.json`
- [ ] Define create_calendar_event request/response
- [ ] Define list_events request/response
- [ ] Include ISO date-time format validation

#### Gmail Schema

- [ ] Create `src/schemas/gmail.schema.json`
- [ ] Define draft_email request/response
- [ ] Define send_email request/response
- [ ] Define search_emails request/response

#### Alexa Schema

- [ ] Create `src/schemas/alexa.schema.json`
- [ ] Define alexa_scene_run request/response
- [ ] Define alexa_device_control request/response
- [ ] Define alexa_list_scenes response

#### Web Search Schema

- [ ] Create `src/schemas/webSearch.schema.json`
- [ ] Define web_search request/response
- [ ] Define deep_research request/response

### Type Generation Setup

- [ ] Install `json-schema-to-typescript`:
  ```bash
  npm install --save-dev json-schema-to-typescript
  ```
- [ ] Add to `package.json` scripts:
  ```json
  "generate-types": "json2ts -i src/schemas -o src/types/generated"
  ```
- [ ] Create `.gitignore` entry for `src/types/generated/`
- [ ] Run `npm run generate-types`
- [ ] Verify generated types in `src/types/generated/`

### Import Generated Types

- [ ] Update `src/lib/mcp/adapters/githubAdapter.ts` to import generated types
- [ ] Update `src/lib/mcp/adapters/calendarAdapter.ts` to import generated types
- [ ] Update `src/lib/mcp/adapters/gmailAdapter.ts` to import generated types
- [ ] Update `src/lib/mcp/adapters/alexaAdapter.ts` to import generated types
- [ ] Update `src/lib/mcp/adapters/searchAdapter.ts` to import generated types
- [ ] Update tool files to use generated types
- [ ] Update API routes to use generated types

### Testing

- [ ] Run `npm run generate-types` and verify no errors
- [ ] Verify TypeScript compilation succeeds
- [ ] Test IntelliSense works with generated types
- [ ] Make a small change to a schema, re-generate, verify types update

---

## Phase 1.7: Testing Infrastructure

### Install Test Dependencies

- [ ] Install vitest:
  ```bash
  npm install --save-dev vitest @vitest/ui
  ```
- [ ] Install React testing library:
  ```bash
  npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
  ```
- [ ] Install jsdom:
  ```bash
  npm install --save-dev jsdom
  ```

### Test Configuration

- [ ] Create `vitest.config.ts` in project root
- [ ] Configure test environment: jsdom
- [ ] Configure globals: true
- [ ] Configure setup files
- [ ] Add to `package.json` scripts:
  ```json
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
  ```

### Test Setup File

- [ ] Create `src/test/setup.ts`
- [ ] Import `@testing-library/jest-dom`
- [ ] Add global test utilities
- [ ] Configure mock implementations

### Mock Utilities

- [ ] Create `src/test/mocks/mcpClient.ts`
- [ ] Mock all MCP server responses
- [ ] Export mock factory functions
- [ ] Create `src/test/mocks/realtimeAgent.ts` (if needed)

### Test Fixtures

- [ ] Verify `src/test/fixtures/tasks.json` exists
- [ ] Verify `src/test/fixtures/events.json` exists
- [ ] Verify `src/test/fixtures/emails.json` exists

### Test Utilities

- [ ] Create `src/test/utils.tsx`
- [ ] Implement `renderWithProviders()` helper
- [ ] Implement `mockAuthStore()` helper
- [ ] Implement `mockAPIResponse()` helper

### Unit Tests

#### MCP Client Tests

- [ ] Create `src/lib/mcp/client.test.ts`
- [ ] Test `registerServer()` adds server to map
- [ ] Test `discoverTools()` returns tools
- [ ] Test `callTool()` executes and returns result
- [ ] Test error handling for failed tool calls
- [ ] Test retry logic

#### Tool Factory Tests

- [ ] Create `src/lib/mcp/toolFactory.test.ts`
- [ ] Test schema conversion produces valid OpenAI schema
- [ ] Test `createMCPTool()` returns executable tool
- [ ] Test tool execution calls mcpClient correctly

#### Adapter Tests

- [ ] Create tests for each adapter (githubAdapter.test.ts, etc.)
- [ ] Test mock responses return expected structure
- [ ] Test all tool methods

### Component Tests

#### TasksPanel Tests

- [ ] Create `src/components/panels/TasksPanel.test.tsx`
- [ ] Test renders with mock data
- [ ] Test view switching (Today → This Week → etc.)
- [ ] Test filtering logic
- [ ] Test click handlers

#### CalendarPanel Tests

- [ ] Create `src/components/panels/CalendarPanel.test.tsx`
- [ ] Test renders events
- [ ] Test grouping by date
- [ ] Test event card display

#### EmailPanel Tests

- [ ] Create `src/components/panels/EmailPanel.test.tsx`
- [ ] Test renders drafts
- [ ] Test draft selection
- [ ] Test send confirmation

### API Route Tests

- [ ] Create `src/app/api/ingest/route.test.ts`
- [ ] Test accepts multipart form data
- [ ] Test returns ActionPlan structure
- [ ] Test rejects invalid file types
- [ ] Test handles missing fields

### Run Tests

- [ ] Run `npm test`
- [ ] Verify all tests pass
- [ ] Check coverage report
- [ ] Aim for >70% coverage

---

## Phase 1.8: Documentation

### Architecture Documentation

- [ ] Create `docs/architecture.md`
- [ ] Add system architecture diagram:
  - [ ] User → Browser → PersonalOS → Agents
  - [ ] Agents → MCP Client → MCP Adapters → Mock Data
  - [ ] UI Panels ← Mock Data
- [ ] Document agent flow:
  - [ ] Voice input → Supervisor → Intent detection
  - [ ] Supervisor → Specialist handoff
  - [ ] Specialist → Tool call → MCP
  - [ ] MCP → Response → Specialist → Voice output
- [ ] Document MCP integration pattern
- [ ] Document tool execution flow
- [ ] Document confirmation patterns
- [ ] Add code examples for each pattern

### Development Guide

- [ ] Create `docs/development.md`
- [ ] Add environment setup section:
  - [ ] Prerequisites (Node, npm, etc.)
  - [ ] Clone and install
  - [ ] Configure `.env`
  - [ ] Run dev server
- [ ] Add development workflow:
  - [ ] Running locally
  - [ ] Hot reload
  - [ ] Viewing Events panel for debugging
- [ ] Add "Adding a New Agent" guide
- [ ] Add "Adding a New MCP Tool" guide
- [ ] Add "Adding a New UI Panel" guide
- [ ] Add testing guide:
  - [ ] Running tests
  - [ ] Writing tests
  - [ ] Coverage
- [ ] Add debugging tips:
  - [ ] Using Events panel
  - [ ] Checking tool execution
  - [ ] Inspecting agent handoffs

### README Update

- [ ] Open `README.md`
- [ ] Add PersonalOS project overview
- [ ] Add key features list
- [ ] Add quick start section:
  ```bash
  npm install
  cp .env.example .env
  # Fill in OPENAI_API_KEY
  npm run dev
  ```
- [ ] Add architecture overview (link to architecture.md)
- [ ] Add development guide (link to development.md)
- [ ] Add testing section
- [ ] Add contributing guidelines
- [ ] Update any outdated template references

### API Documentation (Optional)

- [ ] Document each API endpoint in development.md:
  - [ ] `/api/session` - Create ephemeral token
  - [ ] `/api/responses` - Responses API proxy
  - [ ] `/api/ingest` - Multimodal intake
- [ ] Add request/response examples
- [ ] Add curl examples

---

## Phase 1 Acceptance Criteria

### Agent System Checks

- [ ] PersonalOS appears in UI dropdown (if applicable)
- [ ] Supervisor agent responds to greetings via voice
- [ ] Supervisor correctly detects intent (test with: "Add task", "Schedule event", "Draft email")
- [ ] Supervisor hands off to IssuesAgent when asked to create task
- [ ] IssuesAgent executes mock create_task tool
- [ ] IssuesAgent confirms task creation via voice
- [ ] Can hand off to all 6 specialist agents
- [ ] Each specialist can hand back to supervisor
- [ ] Deep Research requires explicit consent (test: "Research topic" should prompt)
- [ ] Email send requires explicit "send" command

### UI Checks

- [ ] TasksPanel renders with mock data
- [ ] Can switch between Today, This Week, Waiting, Overdue views
- [ ] Task filtering works correctly for each view
- [ ] CalendarPanel renders events
- [ ] Events grouped by date correctly
- [ ] EmailPanel renders drafts
- [ ] Can select and view draft details
- [ ] Layout responsive on desktop (1920x1080)
- [ ] Layout responsive on tablet (768x1024)
- [ ] Layout responsive on mobile (375x667)
- [ ] Panels can be toggled (show/hide)

### API Checks

- [ ] `/api/ingest` endpoint accessible
- [ ] Can POST multipart form with image
- [ ] Returns valid ActionPlan JSON
- [ ] Rejects invalid file types
- [ ] `/api/session` still works (template endpoint)
- [ ] `/api/responses` still works (template endpoint)

### Type Safety Checks

- [ ] `npm run build` completes without TypeScript errors
- [ ] `npm run generate-types` produces valid types
- [ ] IntelliSense works in VS Code for generated types
- [ ] No `any` types in PersonalOS code (except where necessary)

### Testing Checks

- [ ] `npm test` runs successfully
- [ ] All unit tests pass (MCP, tools, adapters)
- [ ] All component tests pass (panels)
- [ ] Coverage >70% for new code
- [ ] No failing tests

### Documentation Checks

- [ ] `docs/architecture.md` complete and accurate
- [ ] `docs/development.md` complete with setup instructions
- [ ] README.md updated with PersonalOS info
- [ ] All diagrams render correctly
- [ ] All code examples are accurate

### Performance Checks

- [ ] Dev server starts in <10 seconds
- [ ] Voice interaction responds in <3 seconds
- [ ] Panel rendering is smooth (no jank)
- [ ] No console errors in browser
- [ ] No console warnings (except expected Vite HMR warnings)

---

## Future Tasks

### Phase 1.9: Connect MCP Tools to Real API Endpoints

- [ ] Update MCP adapters to call actual API endpoints instead of mock data
- [ ] Connect GitHub MCP tools to `/api/github/issues` endpoints
- [ ] Connect Calendar MCP tools to `/api/calendar/events` endpoints
- [ ] Connect Email MCP tools to `/api/email/drafts` endpoints
- [ ] Connect Home MCP tools to `/api/home/devices` endpoints
- [ ] Connect Search MCP tools to `/api/search/web` endpoints
- [ ] Test end-to-end flow: Voice → MCP Tool → API → Response
- [ ] Verify all panels update with real data from API calls

## Next Phase Preview: Phase 2 - GitHub Issues Integration (Real MCP)

### What's Next

After completing Phase 1 scaffolding, Phase 2 will implement the first **real** MCP integration with GitHub Issues.

**Key Deliverables:**

1. Build or integrate real GitHub Issues MCP server
2. Replace mock `githubAdapter` with real GitHub API calls
3. Implement GitHub GraphQL for Projects v2
4. Handle authentication (GitHub App or PAT)
5. Connect TasksPanel to real GitHub data
6. End-to-end flow: Voice → Create Task → Real GitHub Issue → TasksPanel updates

**Estimated Time:** 12-16 hours

**Success Metric:**
Say: "Add task 'Review Q4 budget' P1 due next Friday"
Result: Real GitHub Issue created, visible in GitHub UI and TasksPanel

---

## Notes & Tips

### Using This Checklist

1. Work through each phase sequentially
2. Check off items as you complete them
3. Don't skip ahead - dependencies matter
4. Test frequently - catch issues early
5. Update actual times in SCAFFOLDING_PLAN.md

### Common Issues

- **TypeScript errors**: Run `npm run generate-types` first
- **Agent not responding**: Check Events panel for errors
- **Tool not executing**: Verify tool is in agent's tools array
- **Panel not showing**: Check responsive breakpoint and toggle state

### Getting Help

- Check existing template agents for reference
- Use Events panel to debug agent/tool execution
- Review OpenAI Realtime Agents docs
- Consult SCAFFOLDING_PLAN.md for architecture details

---

## Progress Tracking

**Phase 1.1:** ✅ Complete (30 minutes)
**Phase 1.2:** 🔄 In Progress (Est. 3-4 hours)
**Phase 1.3:** ⏳ Not Started (Est. 4-5 hours)
**Phase 1.4:** ⏳ Not Started (Est. 5-6 hours)
**Phase 1.5:** ⏳ Not Started (Est. 3-4 hours)
**Phase 1.6:** ⏳ Not Started (Est. 2-3 hours)
**Phase 1.7:** ⏳ Not Started (Est. 4-5 hours)
**Phase 1.8:** ⏳ Not Started (Est. 2-3 hours)

**Total Estimated:** 20-28 hours
**Actual So Far:** 30 minutes

---

_Last Updated: [Current Date]_
_Status: Phase 1.2 In Progress_
