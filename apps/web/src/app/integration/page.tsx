'use client';

import { Card, CardContent, CardHeader, CardTitle, CodeBlock, CopyCommand, Heading, Tabs, TabsContent, TabsList, TabsTrigger, Text } from '@florexlabs/ui';

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
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <Heading as="h2" size="lg">Integration Guide</Heading>
        <Text variant="muted">Connect your code agent to Agent Bridge using curl or the TypeScript SDK.</Text>
      </div>

      <Card>
        <CardHeader><CardTitle>Install SDK</CardTitle></CardHeader>
        <CardContent>
          <CopyCommand command="pnpm add @agent-bridge/sdk @agent-bridge/core" />
        </CardContent>
      </Card>

      <Tabs defaultValue="sdk">
        <TabsList>
          <TabsTrigger value="sdk">TypeScript SDK</TabsTrigger>
          <TabsTrigger value="curl">curl</TabsTrigger>
        </TabsList>

        <TabsContent value="sdk">
          <Card>
            <CardHeader><CardTitle>SDK Usage</CardTitle></CardHeader>
            <CardContent>
              <CodeBlock title="bridge.ts">{SDK_EXAMPLE}</CodeBlock>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curl">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader><CardTitle>Create Session</CardTitle></CardHeader>
              <CardContent><CodeBlock>{CURL_CREATE}</CodeBlock></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Send Event</CardTitle></CardHeader>
              <CardContent><CodeBlock>{CURL_EVENT}</CodeBlock></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Get Responses</CardTitle></CardHeader>
              <CardContent><CodeBlock>{CURL_RESPONSES}</CodeBlock></CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
