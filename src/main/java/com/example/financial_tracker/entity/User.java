package com.example.financial_tracker.entity;

import com.example.financial_tracker.enumerations.Currency;
import com.example.financial_tracker.enumerations.Role;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
@Entity
@Table(name = "users")
public class User implements UserDetails {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String name;

  private String email;

  private String password;

  @Enumerated(EnumType.STRING)
  private Role role;

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return List.of(role);
  }

  @Override
  public String getUsername() {
    return email;
  }

  @Override
  public boolean isAccountNonExpired() {
    return true;
  }

  @Override
  public boolean isAccountNonLocked() {
    return true;
  }

  @Override
  public boolean isCredentialsNonExpired() {
    return true;
  }

  @Override
  public boolean isEnabled() {
    return true;
  }

  @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
  private NotificationSettings notificationSettings;

  public NotificationSettings getNotificationSettings() {
    return notificationSettings;
  }

  @Column(name = "email_verified")
  private boolean emailVerified = false;

  @Column(name = "verification_token")
  private String verificationToken;

  @Column(name = "verification_token_expires_at")
  private LocalDateTime verificationTokenExpiresAt;

  @Column(name = "reset_password_token")
  private String resetPasswordToken;

  @Column(name = "reset_password_token_expires_at")
  private LocalDateTime resetPasswordTokenExpiresAt;

  @Column(name = "new_email")
  private String newEmail;

  @Column(name = "new_email_token")
  private String newEmailToken;

  @Column(name = "new_email_token_expires_at")
  private LocalDateTime newEmailTokenExpiresAt;

  @Column(name = "auth_provider")
  private String authProvider = "LOCAL";

  @Column(name = "google_id")
  private String googleId;

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  @Column(name = "two_factor_enabled")
  private boolean twoFactorEnabled = false;

  @Column(name = "two_factor_secret")
  private String twoFactorSecret;

  @Column(name = "recovery_codes", columnDefinition = "TEXT")
  private String recoveryCodes;

  @Column(name = "last_2fa_timestamp")
  private LocalDateTime last2faTimestamp;

  @Column(name = "default_currency")
  @Enumerated(EnumType.STRING)
  private Currency defaultCurrency = Currency.USD;

  @Column(name = "display_secondary_currency")
  private boolean displaySecondaryCurrency = false;

  @Column(name = "secondary_currency")
  @Enumerated(EnumType.STRING)
  private Currency secondaryCurrency;

  @PrePersist
  protected void onCreate() {
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
    if (defaultCurrency == null) {
      defaultCurrency = Currency.USD;
    }
  }

  public boolean isTwoFactorEnabled() {
    return twoFactorEnabled;
  }

  public void setTwoFactorEnabled(boolean enabled) {
    this.twoFactorEnabled = enabled;
  }

  public String getTwoFactorSecret() {
    return twoFactorSecret;
  }

  public void setTwoFactorSecret(String secret) {
    this.twoFactorSecret = secret;
  }

  public String getRecoveryCodes() {
    return recoveryCodes;
  }

  public void setRecoveryCodes(String codes) {
    this.recoveryCodes = codes;
  }
}
