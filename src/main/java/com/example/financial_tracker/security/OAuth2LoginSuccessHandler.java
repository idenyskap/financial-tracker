package com.example.financial_tracker.security;

import com.example.financial_tracker.entity.NotificationSettings;
import com.example.financial_tracker.entity.User;
import com.example.financial_tracker.enumerations.Role;
import com.example.financial_tracker.repository.NotificationSettingsRepository;
import com.example.financial_tracker.repository.UserRepository;
import com.example.financial_tracker.security.jwt.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalTime;

@Slf4j
@Component
@RequiredArgsConstructor
@org.springframework.boot.autoconfigure.condition.ConditionalOnExpression("!'${spring.security.oauth2.client.registration.google.client-id:}'.isEmpty()")
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final NotificationSettingsRepository notificationSettingsRepository;

    @Value("${cors.allowed-origin:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String googleId = oAuth2User.getAttribute("sub");

        log.info("OAuth2 login for email: {}", email);

        User user = userRepository.findByEmail(email)
                .map(existingUser -> {
                    if (existingUser.getGoogleId() == null) {
                        existingUser.setGoogleId(googleId);
                        existingUser.setAuthProvider("GOOGLE");
                        userRepository.save(existingUser);
                        log.info("Linked Google account to existing user: {}", email);
                    }
                    return existingUser;
                })
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .name(name)
                            .email(email)
                            .googleId(googleId)
                            .authProvider("GOOGLE")
                            .role(Role.USER)
                            .emailVerified(true)
                            .build();

                    User savedUser = userRepository.save(newUser);

                    NotificationSettings settings = new NotificationSettings();
                    settings.setUser(savedUser);
                    settings.setEmailEnabled(false);
                    settings.setWeeklyReport(false);
                    settings.setMonthlyReport(false);
                    settings.setPaymentReminders(false);
                    settings.setPaymentReminderDays(1);
                    settings.setDailyReminder(false);
                    settings.setDailyReminderTime(LocalTime.of(21, 0));
                    notificationSettingsRepository.save(settings);

                    log.info("Created new OAuth2 user: {}", email);
                    return savedUser;
                });

        String token = jwtService.generateToken(user);

        getRedirectStrategy().sendRedirect(request, response,
                frontendUrl + "/oauth2/callback?token=" + token);
    }
}