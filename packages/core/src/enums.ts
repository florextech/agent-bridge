export enum AgentEventType {
  TaskStarted = 'task_started',
  TaskCompleted = 'task_completed',
  NeedsReview = 'needs_review',
  NeedsApproval = 'needs_approval',
  Error = 'error',
  TestResults = 'test_results',
  Message = 'message',
}

export enum DeliveryStatus {
  Pending = 'pending',
  Sent = 'sent',
  Delivered = 'delivered',
  Failed = 'failed',
}

export enum ChannelType {
  Telegram = 'telegram',
  WhatsApp = 'whatsapp',
  Discord = 'discord',
  Slack = 'slack',
}

export enum SessionStatus {
  Active = 'active',
  Closed = 'closed',
}
