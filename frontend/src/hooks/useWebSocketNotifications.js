import { useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuth } from './useAuth';
import { getToken } from '../services/api';

export const useWebSocketNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isAuthenticated || !user?.email) return;

    const apiUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8080';
    const socketUrl = `${apiUrl}/ws`;
    const token = getToken();

    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('WebSocket connected');

        client.subscribe(`/user/queue/notifications`, (message) => {
          try {
            const notification = JSON.parse(message.body);
            handleNotification(notification, t);
          } catch (e) {
            console.error('Failed to parse notification', e);
          }
        });

        client.subscribe('/topic/notifications', (message) => {
          try {
            const notification = JSON.parse(message.body);
            handleNotification(notification, t);
          } catch (e) {
            console.error('Failed to parse notification', e);
          }
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [isAuthenticated, user?.email, t]);
};

function handleNotification(notification, t) {
  const { titleKey, messageKey, messageParams, level } = notification;

  const title = titleKey ? t(titleKey, messageParams || {}) : '';
  const message = messageKey ? t(messageKey, messageParams || {}) : '';
  const text = title ? `${title}: ${message}` : message;

  switch (level) {
    case 'EXCEEDED':
    case 'ERROR':
      toast.error(text);
      break;
    case 'ALERT':
    case 'WARNING':
      toast.warning(text);
      break;
    case 'SUCCESS':
      toast.success(text);
      break;
    default:
      toast.info(text);
  }
}
