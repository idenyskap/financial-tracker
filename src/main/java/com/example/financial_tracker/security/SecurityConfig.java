package com.example.financial_tracker.security;

import com.example.financial_tracker.security.jwt.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@RequiredArgsConstructor
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

  private final JwtAuthFilter jwtAuthFilter;
  private final UserDetailsService userDetailsService;
  private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

  @org.springframework.beans.factory.annotation.Value("${cors.allowed-origin:http://localhost:5173}")
  private String corsAllowedOrigin;

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
      .cors(cors -> cors.configurationSource(corsConfigurationSource()))
      .csrf(AbstractHttpConfigurer::disable)
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/v1/auth/**").permitAll()
        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/swagger-resources/**", "/webjars/**").permitAll()
        .requestMatchers("/actuator/health").permitAll()
        .requestMatchers("/healthz").permitAll()
        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()

        .requestMatchers("/api/v1/users/me").authenticated()
        .requestMatchers("/api/v1/users/profile").authenticated()
        .requestMatchers("/api/v1/users/change-password").authenticated()
        .requestMatchers("/api/v1/users/request-email-change").authenticated()

        .requestMatchers("/api/v1/users/**").hasRole("ADMIN")
        .requestMatchers("/actuator/**").hasRole("ADMIN")

        .requestMatchers("/api/v1/transactions/**").authenticated()
        .requestMatchers("/api/v1/categories/**").authenticated()
        .requestMatchers("/api/v1/notifications/**").authenticated()
        .requestMatchers("/api/v1/currency/**").authenticated()
        .requestMatchers("/api/v1/budgets/**").authenticated()
        .requestMatchers("/api/v1/analytics/**").authenticated()
        .requestMatchers("/api/v1/dashboard/**").authenticated()
        .requestMatchers("/api/v1/recurring-transactions/**").authenticated()
        .requestMatchers("/api/v1/goals/**").authenticated()
        .requestMatchers("/api/v1/saved-searches/**").authenticated()

        .anyRequest().authenticated()
      )
      .oauth2Login(oauth2 -> oauth2
        .successHandler(oAuth2LoginSuccessHandler)
      )
      .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .userDetailsService(userDetailsService)
      .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();

    configuration.setAllowedOrigins(List.of(
      corsAllowedOrigin,
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000"
    ));

    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(List.of("*"));
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }

  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
    return config.getAuthenticationManager();
  }
}
