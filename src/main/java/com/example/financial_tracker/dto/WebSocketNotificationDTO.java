package com.example.financial_tracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketNotificationDTO {
    private String type;
    private String title;
    private String message;
    private String level;
    private LocalDateTime timestamp;

    private String titleKey;
    private String messageKey;
    private java.util.Map<String, Object> messageParams;

    public static WebSocketNotificationDTO budgetWarning(String categoryName, String level, java.math.BigDecimal amount) {
        return WebSocketNotificationDTO.builder()
                .type("BUDGET_WARNING")
                .titleKey("notifications.budgetWarning.title")
                .messageKey("notifications.budgetWarning." + level.toLowerCase())
                .messageParams(java.util.Map.of("category", categoryName, "amount", amount))
                .level(level)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static WebSocketNotificationDTO goalCompleted(String goalName) {
        return WebSocketNotificationDTO.builder()
                .type("GOAL_COMPLETED")
                .titleKey("notifications.goalCompleted.title")
                .messageKey("notifications.goalCompleted.message")
                .messageParams(java.util.Map.of("goal", goalName))
                .level("SUCCESS")
                .timestamp(LocalDateTime.now())
                .build();
    }
}
