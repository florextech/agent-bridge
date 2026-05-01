import { describe, it, expect } from 'vitest';
import { AgentEventType, ChannelType, DeliveryStatus, SessionStatus } from '../enums';

describe('AgentEventType', () => {
  it('has correct values', () => {
    expect(AgentEventType.TaskStarted).toBe('task_started');
    expect(AgentEventType.TaskCompleted).toBe('task_completed');
    expect(AgentEventType.NeedsReview).toBe('needs_review');
    expect(AgentEventType.NeedsApproval).toBe('needs_approval');
    expect(AgentEventType.Error).toBe('error');
    expect(AgentEventType.TestResults).toBe('test_results');
    expect(AgentEventType.Message).toBe('message');
  });
});

describe('ChannelType', () => {
  it('has correct values', () => {
    expect(ChannelType.Telegram).toBe('telegram');
    expect(ChannelType.WhatsApp).toBe('whatsapp');
    expect(ChannelType.Discord).toBe('discord');
    expect(ChannelType.Slack).toBe('slack');
    expect(ChannelType.Email).toBe('email');
  });
});

describe('DeliveryStatus', () => {
  it('has correct values', () => {
    expect(DeliveryStatus.Pending).toBe('pending');
    expect(DeliveryStatus.Sent).toBe('sent');
    expect(DeliveryStatus.Delivered).toBe('delivered');
    expect(DeliveryStatus.Failed).toBe('failed');
  });
});

describe('SessionStatus', () => {
  it('has correct values', () => {
    expect(SessionStatus.Active).toBe('active');
    expect(SessionStatus.Closed).toBe('closed');
  });
});

describe('exports', () => {
  it('exports types from index', async () => {
    const mod = await import('../index');
    expect(mod.AgentEventType).toBeDefined();
    expect(mod.ChannelType).toBeDefined();
    expect(mod.DeliveryStatus).toBeDefined();
    expect(mod.SessionStatus).toBeDefined();
  });
});
