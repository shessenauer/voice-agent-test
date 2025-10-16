import { RealtimeAgent } from '@openai/agents/realtime';
import { supervisorAgent } from './supervisor';
import { issuesAgent } from './specialists/issuesAgent';
import { calendarAgent } from './specialists/calendarAgent';
import { emailAgent } from './specialists/emailAgent';
import { homeAgent } from './specialists/homeAgent';
import { webSearchAgent } from './specialists/webSearchAgent';
import { deepResearchAgent } from './specialists/deepResearchAgent';

// Configure bidirectional handoff graph
// Supervisor can hand off to any specialist
supervisorAgent.handoffs = [
  issuesAgent,
  calendarAgent,
  emailAgent,
  homeAgent,
  webSearchAgent,
  deepResearchAgent,
];

// Each specialist can hand back to supervisor
issuesAgent.handoffs = [supervisorAgent];
calendarAgent.handoffs = [supervisorAgent];
emailAgent.handoffs = [supervisorAgent];
homeAgent.handoffs = [supervisorAgent];
webSearchAgent.handoffs = [supervisorAgent];
deepResearchAgent.handoffs = [supervisorAgent];

// Export PersonalOS scenario
// Array must start with supervisor agent
export const personalOSScenario: RealtimeAgent[] = [
  supervisorAgent,
  issuesAgent,
  calendarAgent,
  emailAgent,
  homeAgent,
  webSearchAgent,
  deepResearchAgent,
];

// Optional: Company name for guardrails (if needed)
export const personalOSCompanyName = 'PersonalOS';

// Default export
export default personalOSScenario;
