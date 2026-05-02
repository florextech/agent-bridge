import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bridgeApi } from './api';
import type { CreateSessionDto } from '@agent-bridge/core';

export const queryKeys = {
  sessions: ['sessions'] as const,
  session: (id: string) => ['session', id] as const,
  events: (sessionId: string) => ['events', sessionId] as const,
  responses: (sessionId: string) => ['responses', sessionId] as const,
  telegramUsers: ['telegram-users'] as const,
  telegramStatus: ['telegram-status'] as const,
  users: ['users'] as const,
  userCount: ['user-count'] as const,
};

export function useSessions() {
  return useQuery({ queryKey: queryKeys.sessions, queryFn: bridgeApi.getSessions });
}

export function useSession(id: string) {
  return useQuery({ queryKey: queryKeys.session(id), queryFn: () => bridgeApi.getSession(id) });
}

export function useEvents(sessionId: string) {
  return useQuery({ queryKey: queryKeys.events(sessionId), queryFn: () => bridgeApi.getEvents(sessionId) });
}

export function useResponses(sessionId: string) {
  return useQuery({ queryKey: queryKeys.responses(sessionId), queryFn: () => bridgeApi.getResponses(sessionId) });
}

export function useTelegramUsers() {
  return useQuery({ queryKey: queryKeys.telegramUsers, queryFn: bridgeApi.getTelegramUsers, refetchInterval: 5000 });
}

export function useTelegramStatus() {
  return useQuery({ queryKey: queryKeys.telegramStatus, queryFn: bridgeApi.getTelegramStatus });
}

export function useUsers() {
  return useQuery({ queryKey: queryKeys.users, queryFn: bridgeApi.getUsers });
}

export function useUserCount() {
  return useQuery({ queryKey: queryKeys.userCount, queryFn: bridgeApi.getUserCount });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bridgeApi.deleteSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.sessions }),
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSessionDto) => bridgeApi.createSession(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.sessions }),
  });
}

export function useSetupTelegram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (botToken: string) => bridgeApi.setupTelegram(botToken),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.telegramStatus }),
  });
}

export function useToggleTelegramAuth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => bridgeApi.toggleTelegramAuth(chatId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.telegramUsers }),
  });
}

export function useRemoveTelegramUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => bridgeApi.removeTelegramUser(chatId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.telegramUsers }),
  });
}

export function useInvite() {
  return useMutation({
    mutationFn: (data: { email: string; role: string }) => bridgeApi.invite(data),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bridgeApi.deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users }),
  });
}
