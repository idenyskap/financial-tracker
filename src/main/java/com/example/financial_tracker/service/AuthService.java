package com.example.financial_tracker.service;

import com.example.financial_tracker.dto.AuthRequest;
import com.example.financial_tracker.dto.AuthResponse;
import com.example.financial_tracker.entity.EmailHistory;
import com.example.financial_tracker.entity.NotificationSettings;
import com.example.financial_tracker.enumerations.Role;
import com.example.financial_tracker.entity.User;
import com.example.financial_tracker.repository.NotificationSettingsRepository;
import com.example.financial_tracker.repository.UserRepository;
import com.example.financial_tracker.security.jwt.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final AuthenticationManager authenticationManager;
  private final NotificationSettingsRepository notificationSettingsRepository;
  private final TokenService tokenService;
  private final EmailService emailService;
  private final TwoFactorAuthService twoFactorAuthService;

  @Value("${app.mail.base-url}")
  private String baseUrl;


  @Transactional
  public AuthResponse register(AuthRequest request) {
    String email = request.getEmail();
    log.info("Registration attempt for email: {}", email);

    if (userRepository.findByEmail(email).isPresent()) {
      log.warn("Registration failed - email already exists: {}", email);
      throw new RuntimeException("User with this email already exists");
    }

    User user = User.builder()
      .name(request.getName())
      .email(email)
      .password(passwordEncoder.encode(request.getPassword()))
      .role(Role.USER)
      .emailVerified(true) // Email verification disabled for now. Auto verify on registration
      .build();

    User savedUser = userRepository.save(user);
    log.info("Successfully registered new user - ID: {}, Email: {}, Name: '{}'",
      savedUser.getId(), email, request.getName());

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
    log.info("Created notification settings for new user: {}", savedUser.getEmail());

    String token = jwtService.generateToken(savedUser);
    log.debug("Generated JWT token for new user: {}", email);

    return new AuthResponse(token);
  }

  private void sendVerificationEmail(User user) {
    String verificationLink = baseUrl + "/verify-email?token=" + user.getVerificationToken();

    Map<String, Object> variables = Map.of(
      "userName", user.getName(),
      "verificationLink", verificationLink,
      "expiryHours", 24
    );

    emailService.sendEmail(
      user.getEmail(),
      "Verify your email address",
      "email-verification",
      variables,
      EmailHistory.EmailType.EMAIL_VERIFICATION,
      user
    );

    log.info("Verification email sent to: {}", user.getEmail());
  }

  @Transactional
  public void verifyEmail(String token) {
    User user = userRepository.findByVerificationToken(token)
      .orElseThrow(() -> new IllegalArgumentException("Invalid verification token"));

    if (tokenService.isTokenExpired(user.getVerificationTokenExpiresAt())) {
      throw new IllegalArgumentException("Verification token has expired");
    }

    user.setEmailVerified(true);
    user.setVerificationToken(null);
    user.setVerificationTokenExpiresAt(null);
    userRepository.save(user);

    log.info("Email verified for user: {}", user.getEmail());
  }

  @Transactional
  public void resendVerificationEmail(String email) {
    User user = userRepository.findByEmail(email)
      .orElseThrow(() -> new IllegalArgumentException("User not found"));

    if (user.isEmailVerified()) {
      throw new IllegalArgumentException("Email is already verified");
    }

    String verificationToken = tokenService.generateToken();
    user.setVerificationToken(verificationToken);
    user.setVerificationTokenExpiresAt(tokenService.getExpiryDate());
    userRepository.save(user);

    sendVerificationEmail(user);
  }

  @Transactional
  public void requestPasswordReset(String email) {
    Optional<User> userOptional = userRepository.findByEmail(email);

    if (userOptional.isEmpty()) {
      log.info("Password reset requested for non-existent email: {}", email);
      return;
    }

    User user = userOptional.get();
    String resetToken = tokenService.generateToken();
    user.setResetPasswordToken(resetToken);
    user.setResetPasswordTokenExpiresAt(tokenService.getExpiryDate());
    userRepository.save(user);

    String resetLink = baseUrl + "/reset-password?token=" + resetToken;

    Map<String, Object> variables = Map.of(
      "userName", user.getName(),
      "resetLink", resetLink,
      "expiryHours", 24
    );

    emailService.sendEmail(
      user.getEmail(),
      "Reset your password",
      "password-reset",
      variables,
      EmailHistory.EmailType.PASSWORD_RESET,
      user
    );

    log.info("Password reset email sent to: {}", user.getEmail());
  }

  @Transactional
  public void resetPassword(String token, String newPassword) {
    User user = userRepository.findByResetPasswordToken(token)
      .orElseThrow(() -> new IllegalArgumentException("Invalid reset token"));

    if (tokenService.isTokenExpired(user.getResetPasswordTokenExpiresAt())) {
      throw new IllegalArgumentException("Reset token has expired");
    }

    user.setPassword(passwordEncoder.encode(newPassword));
    user.setResetPasswordToken(null);
    user.setResetPasswordTokenExpiresAt(null);
    userRepository.save(user);

    log.info("Password reset for user: {}", user.getEmail());
  }


  @Transactional
  public void confirmEmailChange(String token) {
    User user = userRepository.findByNewEmailToken(token)
      .orElseThrow(() -> new IllegalArgumentException("Invalid token"));

    if (tokenService.isTokenExpired(user.getNewEmailTokenExpiresAt())) {
      throw new IllegalArgumentException("Token has expired");
    }

    String oldEmail = user.getEmail();
    user.setEmail(user.getNewEmail());
    user.setNewEmail(null);
    user.setNewEmailToken(null);
    user.setNewEmailTokenExpiresAt(null);
    userRepository.save(user);

    log.info("Email changed from {} to {}", oldEmail, user.getEmail());
  }

  public AuthResponse login(AuthRequest request) {
    String email = request.getEmail();
    log.info("Login attempt for email: {}", email);


    try {
      authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(email, request.getPassword())
      );

      User user = userRepository.findByEmail(email)
        .orElseThrow(() -> {
          log.error("User not found after successful authentication: {}", email);
          return new RuntimeException("User not found");
        });

      if (user.isTwoFactorEnabled()) {
        if (request.getTwoFactorCode() == null || request.getTwoFactorCode().isEmpty()) {
          log.info("2FA required for user: {}", email);
          return new AuthResponse(null, true, "2FA_REQUIRED");
        }

        if (!twoFactorAuthService.verifyTwoFactorCode(user, request.getTwoFactorCode())) {
          log.warn("Invalid 2FA code for user: {}", email);
          throw new BadCredentialsException("Invalid 2FA code");
        }
      }

      if (!user.isEmailVerified()) {
        log.warn("User {} logged in with unverified email", email);
      }

      log.info("Successful login for user - ID: {}, Email: {}, Role: {}, Verified: {}",
        user.getId(), email, user.getRole(), user.isEmailVerified());

      String token = jwtService.generateToken(user);
      log.debug("Generated JWT token for user: {}", email);

      return new AuthResponse(token);

    } catch (BadCredentialsException e) {
      log.warn("Failed login attempt - invalid credentials for email: {}", email);
      throw new BadCredentialsException("Invalid email or password");
    } catch (AuthenticationException e) {
      log.error("Authentication error for email: {} - {}", email, e.getMessage());
      throw new RuntimeException("Authentication failed");
    }
  }
}
