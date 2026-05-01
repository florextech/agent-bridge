'use client';

import { Card, CardContent, CardHeader, CardTitle, CodeBlock, CopyCommand, Heading, Tabs, TabsContent, TabsList, TabsTrigger, Text } from '@florexlabs/ui';

const CURL_CREATE_SESSION = `curl -X POST http://localhost:3001/agent-sessions \\
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

const CURL_SEND_EVENT = `curl -X POST http://localhost:3001/agent-events \\
  -H "Content-Type: application/json" \\
  -d '{
    "sessionId": "SESSION_ID",
    "type": "task_completed",
    "payload": { "summary": "Refactored auth module" }
  }'`;

const CURL_GET_RESPONSES = `curl http://localhost:3001/agent-sessions/SESSION_ID/responses`;

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
console.log(responses);

// Mark all responses as read
await bridge.markRead('SESSION_ID');`;

export default function IntegrationPage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Heading as="h2">Integration Guide</Heading>
      <Text className="text-neutral-400">Connect your code agent to Agent Bridge using curl or the TypeScript SDK.</Text>

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
              <CodeBlock>{SDK_EXAMPLE}</CodeBlock>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curl">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader><CardTitle>Create Session</CardTitle></CardHeader>
              <CardContent><CodeBlock>{CURL_CREATE_SESSION}</CodeBlock></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Send Event</CardTitle></CardHeader>
              <CardContent><CodeBlock>{CURL_SEND_EVENT}</CodeBlock></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Get Responses</CardTitle></CardHeader>
              <CardContent><CodeBlock>{CURL_GET_RESPONSES}</CodeBlock></CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
