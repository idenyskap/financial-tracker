package com.example.financial_tracker.service;

import com.example.financial_tracker.dto.WebSocketNotificationDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendToUser(String userEmail, WebSocketNotificationDTO notification) {
        log.info("Sending WebSocket notification to {}: {}", userEmail, notification.getType());
        messagingTemplate.convertAndSendToUser(userEmail, "/queue/notifications", notification);
    }

    public void broadcast(WebSocketNotificationDTO notification) {
        log.info("Broadcasting WebSocket notification: {}", notification.getType());
        messagingTemplate.convertAndSend("/topic/notifications", notification);
    }
}
