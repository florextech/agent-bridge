'use client';

import { CodeBlock, CopyCommand, Heading, Tabs, TabsContent, TabsList, TabsTrigger, Text } from '@florexlabs/ui';
import { Terminal, Code } from '@phosphor-icons/react';

const SDK_EXAMPLE = `import { AgentBridgeClient } from '@agent-bridge/sdk';
import { AgentEventType } from '@agent-bridge/core';

const bridge = new AgentBridgeClient({
  baseUrl: 'http://localhost:3001',
});

// Send a task completion event
await bridge.sendEvent({
  sessionId: 'SESSION_ID',
  type: AgentEventType.TaskCompleted,
  payload: { summary: 'Refactored auth module' },
});

// Check for responses
const responses = await bridge.getResponses('SESSION_ID');

// Mark all responses as read
await bridge.markRead('SESSION_ID');`;

const CURL_CREATE = `curl -X POST http://localhost:3001/agent-sessions \\
  -H "Content-Type: application/json" \\
  -d '{
    "projectName": "my-project",
    "agentName": "codex",
    "channelType": "telegram",
    "channelConfig": {
      "botToken": "YOUR_BOT_TOKEN",
      "chatId": "YOUR_CHAT_ID"
    }
  }'`;

const CURL_EVENT = `curl -X POST http://localhost:3001/agent-events \\
  -H "Content-Type: application/json" \\
  -d '{
    "sessionId": "SESSION_ID",
    "type": "task_completed",
    "payload": { "summary": "Refactored auth module" }
  }'`;

const CURL_RESPONSES = `curl http://localhost:3001/agent-sessions/SESSION_ID/responses`;

export default function IntegrationPage() {
  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <p className="uppercase tracking-[0.18em] text-xs font-semibold text-(--brand-600) mb-2">Developers</p>
        <Heading as="h2" size="lg">Integration Guide</Heading>
        <Text variant="muted" size="sm">Connect your code agent to Agent Bridge using curl or the TypeScript SDK.</Text>
      </div>

      <div className="flx-card">
        <p className="uppercase tracking-[0.18em] text-xs font-semibold text-(--muted) mb-3">Install</p>
        <CopyCommand command="pnpm add @agent-bridge/sdk @agent-bridge/core" />
      </div>

      <Tabs defaultValue="sdk">
        <TabsList>
          <TabsTrigger value="sdk">
            <span className="inline-flex items-center gap-1.5"><Code size={16} weight="duotone" /> TypeScript SDK</span>
          </TabsTrigger>
          <TabsTrigger value="curl">
            <span className="inline-flex items-center gap-1.5"><Terminal size={16} weight="duotone" /> curl</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sdk">
          <div className="flx-card">
            <p className="font-display font-semibold mb-4">SDK Usage</p>
            <CodeBlock title="bridge.ts">{SDK_EXAMPLE}</CodeBlock>
          </div>
        </TabsContent>

        <TabsContent value="curl">
          <div className="flex flex-col gap-4">
            <div className="flx-card">
              <p className="font-display font-semibold mb-3">Create Session</p>
              <CodeBlock>{CURL_CREATE}</CodeBlock>
            </div>
            <div className="flx-card">
              <p className="font-display font-semibold mb-3">Send Event</p>
              <CodeBlock>{CURL_EVENT}</CodeBlock>
            </div>
            <div className="flx-card">
              <p className="font-display font-semibold mb-3">Get Responses</p>
              <CodeBlock>{CURL_RESPONSES}</CodeBlock>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
