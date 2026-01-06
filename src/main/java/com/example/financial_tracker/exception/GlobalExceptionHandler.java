package com.example.financial_tracker.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ValidationErrorResponse> handleValidationException(
    MethodArgumentNotValidException ex,
    HttpServletRequest request) {

    log.warn("Validation error: {}", ex.getMessage());

    Map<String, String> fieldErrors = new HashMap<>();
    ex.getBindingResult().getAllErrors().forEach(error -> {
      String fieldName = ((FieldError) error).getField();
      String errorMessage = error.getDefaultMessage();
      fieldErrors.put(fieldName, errorMessage);
    });

    ValidationErrorResponse errorResponse = ValidationErrorResponse.builder()
      .message("Validation failed")
      .error("VALIDATION_ERROR")
      .status(HttpStatus.BAD_REQUEST.value())
      .timestamp(LocalDateTime.now())
      .path(request.getRequestURI())
      .fieldErrors(fieldErrors)
      .build();

    return ResponseEntity.badRequest().body(errorResponse);
  }

  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<ErrorResponse> handleResourceNotFound(
    ResourceNotFoundException ex,
    HttpServletRequest request) {

    log.warn("Resource not found: {}", ex.getMessage());

    ErrorResponse errorResponse = ErrorResponse.builder()
      .message(ex.getMessage())
      .error("RESOURCE_NOT_FOUND")
      .status(HttpStatus.NOT_FOUND.value())
      .timestamp(LocalDateTime.now())
      .path(request.getRequestURI())
      .build();

    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ErrorResponse> handleAccessDenied(
    AccessDeniedException ex,
    HttpServletRequest request) {

    log.warn("Access denied: {}", ex.getMessage());

    ErrorResponse errorResponse = ErrorResponse.builder()
      .message(ex.getMessage())
      .error("ACCESS_DENIED")
      .status(HttpStatus.FORBIDDEN.value())
      .timestamp(LocalDateTime.now())
      .path(request.getRequestURI())
      .build();

    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
  }

  @ExceptionHandler(BusinessLogicException.class)
  public ResponseEntity<ErrorResponse> handleBusinessLogic(
    BusinessLogicException ex,
    HttpServletRequest request) {

    log.warn("Business logic error: {}", ex.getMessage());

    ErrorResponse errorResponse = ErrorResponse.builder()
      .message(ex.getMessage())
      .error("BUSINESS_LOGIC_ERROR")
      .status(HttpStatus.BAD_REQUEST.value())
      .timestamp(LocalDateTime.now())
      .path(request.getRequestURI())
      .build();

    return ResponseEntity.badRequest().body(errorResponse);
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ErrorResponse> handleIllegalArgument(
    IllegalArgumentException ex,
    HttpServletRequest request) {

    log.warn("Invalid argument: {}", ex.getMessage());

    ErrorResponse errorResponse = ErrorResponse.builder()
      .message(ex.getMessage())
      .error("INVALID_ARGUMENT")
      .status(HttpStatus.BAD_REQUEST.value())
      .timestamp(LocalDateTime.now())
      .path(request.getRequestURI())
      .build();

    return ResponseEntity.badRequest().body(errorResponse);
  }

  @ExceptionHandler(BadCredentialsException.class)
  public ResponseEntity<ErrorResponse> handleBadCredentials(
    BadCredentialsException ex,
    HttpServletRequest request) {

    log.warn("Authentication failed: {}", ex.getMessage());

    ErrorResponse errorResponse = ErrorResponse.builder()
      .message("Invalid email or password")
      .error("AUTHENTICATION_FAILED")
      .status(HttpStatus.UNAUTHORIZED.value())
      .timestamp(LocalDateTime.now())
      .path(request.getRequestURI())
      .build();

    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
  }

  @ExceptionHandler(io.jsonwebtoken.ExpiredJwtException.class)
  public ResponseEntity<ErrorResponse> handleExpiredJwt(
    io.jsonwebtoken.ExpiredJwtException ex,
    HttpServletRequest request) {

    log.warn("JWT token expired: {}", ex.getMessage());

    ErrorResponse errorResponse = ErrorResponse.builder()
      .message("JWT token has expired")
      .error("TOKEN_EXPIRED")
      .status(HttpStatus.UNAUTHORIZED.value())
      .timestamp(LocalDateTime.now())
      .path(request.getRequestURI())
      .build();

    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
  }

  @ExceptionHandler(io.jsonwebtoken.JwtException.class)
  public ResponseEntity<ErrorResponse> handleJwtException(
    io.jsonwebtoken.JwtException ex,
    HttpServletRequest request) {

    log.warn("JWT error: {}", ex.getMessage());

    ErrorResponse errorResponse = ErrorResponse.builder()
      .message("Invalid JWT token")
      .error("INVALID_TOKEN")
      .status(HttpStatus.UNAUTHORIZED.value())
      .timestamp(LocalDateTime.now())
      .path(request.getRequestURI())
      .build();

    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
  }

  @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
  public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(
    org.springframework.dao.DataIntegrityViolationException ex,
    HttpServletRequest request) {

    log.error("Data integrity violation: {}", ex.getMessage());

    String message = "Data integrity constraint violation";
    if (ex.getMessage().contains("duplicate key")) {
      message = "Record with this data already exists";
    } else if (ex.getMessage().contains("foreign key")) {
      message = "Referenced data does not exist";
    }

    ErrorResponse errorResponse = ErrorResponse.builder()
      .message(message)
      .error("DATA_INTEGRITY_ERROR")
      .status(HttpStatus.CONFLICT.value())
      .timestamp(LocalDateTime.now())
      .path(request.getRequestURI())
      .build();

    return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleGenericException(
    Exception ex,
    HttpServletRequest request) {

    log.error("Unexpected error occurred", ex);

    ErrorResponse errorResponse = ErrorResponse.builder()
      .message("An unexpected error occurred")
      .error("INTERNAL_SERVER_ERROR")
      .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
      .timestamp(LocalDateTime.now())
      .path(request.getRequestURI())
      .details(List.of(ex.getMessage()))
      .build();

    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
  }

  @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
  public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(
    org.springframework.http.converter.HttpMessageNotReadableException ex,
    HttpServletRequest request) {

    log.warn("Invalid request body: {}", ex.getMessage());

    String message = "Invalid request format";

    if (ex.getMessage().contains("TransactionType")) {
      message = "Invalid transaction type. Must be 'INCOME' or 'EXPENSE'";
    } else if (ex.getMessage().contains("LocalDate")) {
      message = "Invalid date format. Supported formats: YYYY-MM-DD, DD.MM.YYYY, DD/MM/YYYY, MM/DD/YYYY";
    } else if (ex.getMessage().contains("BigDecimal")) {
      message = "Invalid amount format";
    }

    ErrorResponse errorResponse = ErrorResponse.builder()
      .message(message)
      .error("INVALID_REQUEST_BODY")
      .status(HttpStatus.BAD_REQUEST.value())
      .timestamp(LocalDateTime.now())
      .path(request.getRequestURI())
      .build();

    return ResponseEntity.badRequest().body(errorResponse);
  }

  @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
  public ResponseEntity<ErrorResponse> handleSecurityAccessDenied(
    org.springframework.security.access.AccessDeniedException ex,
    HttpServletRequest request) {

    log.warn("Security access denied for request: {} {} - {}",
      request.getMethod(), request.getRequestURI(), ex.getMessage());

    ErrorResponse errorResponse = ErrorResponse.builder()
      .message("Access denied. You don't have permission to access this resource.")
      .error("ACCESS_DENIED")
      .status(HttpStatus.FORBIDDEN.value())
      .timestamp(LocalDateTime.now())
      .path(request.getRequestURI())
      .build();

    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
  }

  @ExceptionHandler(SecurityException.class)
  public ResponseEntity<ErrorResponse> handleSecurityException(
    SecurityException ex,
    HttpServletRequest request) {

    log.error("Security exception: {}", ex.getMessage());

    ErrorResponse errorResponse = ErrorResponse.builder()
      .message(ex.getMessage())
      .error("SECURITY_ERROR")
      .status(HttpStatus.FORBIDDEN.value())
      .timestamp(LocalDateTime.now())
      .path(request.getRequestURI())
      .build();

    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
  }

}
