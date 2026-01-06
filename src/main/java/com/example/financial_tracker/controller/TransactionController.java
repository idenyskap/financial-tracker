package com.example.financial_tracker.controller;

import com.example.financial_tracker.dto.*;
import com.example.financial_tracker.enumerations.TransactionType;
import com.example.financial_tracker.entity.User;
import com.example.financial_tracker.service.TransactionService;
import com.example.financial_tracker.util.RequestUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import com.example.financial_tracker.service.SavedSearchService;
import org.springframework.web.multipart.MultipartFile;
import com.example.financial_tracker.exception.BadRequestException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/transactions")
@Validated
public class TransactionController {

  private final TransactionService transactionService;
  private final SavedSearchService savedSearchService;

  @GetMapping
  public ResponseEntity<List<TransactionDTO>> getAllTransactions(
    @AuthenticationPrincipal User user,
    HttpServletRequest request) {

    log.info("GET /api/transactions - User: {} from IP: {}",
      user.getEmail(), RequestUtils.getClientIpAddress(request));

    List<TransactionDTO> transactions = transactionService.getTransactionsByUser(user);

    log.info("Returning {} transactions to user: {}", transactions.size(), user.getEmail());
    return ResponseEntity.ok(transactions);
  }

  @GetMapping("/paginated")
  public ResponseEntity<Page<TransactionDTO>> getTransactionsPaginated(
    @AuthenticationPrincipal User user,
    Pageable pageable) {
    Page<TransactionDTO> transactions = transactionService.getTransactionsByUser(user, pageable);
    return ResponseEntity.ok(transactions);
  }

  @GetMapping("/{id}")
  public ResponseEntity<TransactionDTO> getTransactionById(
    @PathVariable @Positive(message = "Transaction ID must be positive") Long id,
    @AuthenticationPrincipal User user,
    HttpServletRequest request) {

    log.info("GET /api/transactions/{} - User: {} from IP: {}",
      id, user.getEmail(), RequestUtils.getClientIpAddress(request));

    TransactionDTO transaction = transactionService.getTransactionById(id, user);
    return ResponseEntity.ok(transaction);
  }

  @PostMapping
  public ResponseEntity<TransactionDTO> createTransaction(
    @Valid @RequestBody TransactionDTO dto,
    @AuthenticationPrincipal User user,
    HttpServletRequest request) {

    log.info("POST /api/transactions - User: {} from IP: {} creating {} transaction of amount: {}",
      user.getEmail(), RequestUtils.getClientIpAddress(request), dto.getType(), dto.getAmount());

    TransactionDTO created = transactionService.createTransaction(dto, user);

    log.info("Successfully created transaction ID: {} for user: {}",
      created.getId(), user.getEmail());

    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @PutMapping("/{id}")
  public ResponseEntity<TransactionDTO> updateTransaction(
    @PathVariable @Positive(message = "Transaction ID must be positive") Long id,
    @Valid @RequestBody TransactionDTO dto,
    @AuthenticationPrincipal User user,
    HttpServletRequest request) {

    log.info("PUT /api/transactions/{} - User: {} from IP: {}",
      id, user.getEmail(), RequestUtils.getClientIpAddress(request));

    TransactionDTO updated = transactionService.updateTransaction(id, dto, user);
    return ResponseEntity.ok(updated);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteTransaction(
    @PathVariable @Positive(message = "Transaction ID must be positive") Long id,
    @AuthenticationPrincipal User user,
    HttpServletRequest request) {

    log.info("DELETE /api/transactions/{} - User: {} from IP: {}",
      id, user.getEmail(), RequestUtils.getClientIpAddress(request));

    transactionService.deleteTransaction(id, user);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/balance")
  public ResponseEntity<BigDecimal> getBalance(
    @AuthenticationPrincipal User user,
    HttpServletRequest request) {

    log.info("GET /api/transactions/balance - User: {} from IP: {}",
      user.getEmail(), RequestUtils.getClientIpAddress(request));

    BigDecimal balance = transactionService.getBalanceByUser(user);
    return ResponseEntity.ok(balance);
  }

  @GetMapping("/stats")
  public ResponseEntity<Map<String, BigDecimal>> getStats(
    @AuthenticationPrincipal User user,
    HttpServletRequest request) {

    log.info("GET /api/transactions/stats - User: {} from IP: {}",
      user.getEmail(), RequestUtils.getClientIpAddress(request));

    BigDecimal income = transactionService.getTotalIncomeByUser(user);
    BigDecimal expense = transactionService.getTotalExpenseByUser(user);
    BigDecimal balance = transactionService.getBalanceByUser(user);

    Map<String, BigDecimal> stats = Map.of(
      "income", income,
      "expense", expense,
      "balance", balance
    );

    log.info("Returning stats to user: {} - Income: {}, Expense: {}, Balance: {}",
      user.getEmail(), income, expense, balance);

    return ResponseEntity.ok(stats);
  }

  @GetMapping("/filter")
  public ResponseEntity<List<TransactionDTO>> getTransactionsWithFilters(
    @AuthenticationPrincipal User user,
    @RequestParam(required = false) TransactionType type,
    @RequestParam(required = false) @Positive(message = "Category ID must be positive") Long categoryId,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
    HttpServletRequest request) {

    log.info("GET /api/transactions/filter - User: {} from IP: {} - Filters: type={}, categoryId={}, startDate={}, endDate={}",
      user.getEmail(), RequestUtils.getClientIpAddress(request), type, categoryId, startDate, endDate);

    List<TransactionDTO> transactions = transactionService.getTransactionsWithFilters(
      user, type, categoryId, startDate, endDate);
    return ResponseEntity.ok(transactions);
  }

  @GetMapping("/income")
  public ResponseEntity<List<TransactionDTO>> getIncomeTransactions(
    @AuthenticationPrincipal User user,
    HttpServletRequest request) {

    log.info("GET /api/transactions/income - User: {} from IP: {}",
      user.getEmail(), RequestUtils.getClientIpAddress(request));

    List<TransactionDTO> transactions = transactionService.getTransactionsByType(user, TransactionType.INCOME);
    return ResponseEntity.ok(transactions);
  }

  @GetMapping("/expense")
  public ResponseEntity<List<TransactionDTO> > getExpenseTransactions(
    @AuthenticationPrincipal User user,
    HttpServletRequest request) {

    log.info("GET /api/transactions/expense - User: {} from IP: {}",
      user.getEmail(), RequestUtils.getClientIpAddress(request));

    List<TransactionDTO> transactions = transactionService.getTransactionsByType(user, TransactionType.EXPENSE);
    return ResponseEntity.ok(transactions);
  }

  @GetMapping("/search")
  public ResponseEntity<Page<TransactionDTO>> searchTransactions(
    @AuthenticationPrincipal User user,
    @RequestParam(required = false) String searchText,
    @RequestParam(required = false) BigDecimal minAmount,
    @RequestParam(required = false) BigDecimal maxAmount,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
    @RequestParam(required = false) TransactionSearchDTO.QuickDateFilter quickDateFilter,
    @RequestParam(required = false) String type,
    @RequestParam(required = false) List<Long> categoryIds,
    @RequestParam(defaultValue = "0") @Min(0) Integer page,
    @RequestParam(defaultValue = "20") @Positive Integer size,
    @RequestParam(defaultValue = "date") String sortBy,
    @RequestParam(defaultValue = "DESC") TransactionSearchDTO.SortDirection sortDirection,
    HttpServletRequest request) {

    log.info("Search transactions request from IP: {} with params: searchText={}, dateFrom={}, dateTo={}",
      RequestUtils.getClientIpAddress(request), searchText, dateFrom, dateTo);

    TransactionSearchDTO searchDto = TransactionSearchDTO.builder()
      .searchText(searchText)
      .minAmount(minAmount)
      .maxAmount(maxAmount)
      .dateFrom(dateFrom)
      .dateTo(dateTo)
      .quickDateFilter(quickDateFilter)
      .type(type)
      .categoryIds(categoryIds)
      .page(page)
      .size(size)
      .sortBy(sortBy)
      .sortDirection(sortDirection)
      .build();

    Page<TransactionDTO> results = transactionService.searchTransactions(user, searchDto);
    return ResponseEntity.ok(results);
  }

  @PostMapping("/search")
  public ResponseEntity<Page<TransactionDTO>> searchTransactionsPost(
    @AuthenticationPrincipal User user,
    @Valid @RequestBody TransactionSearchDTO searchDto,
    HttpServletRequest request) {

    log.info("Search transactions POST request from IP: {} with criteria: {}",
      RequestUtils.getClientIpAddress(request), searchDto);

    Page<TransactionDTO> results = transactionService.searchTransactions(user, searchDto);
    return ResponseEntity.ok(results);
  }

  @GetMapping("/search/stats")
  public ResponseEntity<TransactionSearchStatsDTO> getSearchStats(
    @AuthenticationPrincipal User user,
    @RequestParam(required = false) String searchText,
    @RequestParam(required = false) BigDecimal minAmount,
    @RequestParam(required = false) BigDecimal maxAmount,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
    @RequestParam(required = false) TransactionSearchDTO.QuickDateFilter quickDateFilter,
    @RequestParam(required = false) String type,
    @RequestParam(required = false) List<Long> categoryIds,
    HttpServletRequest request) {

    log.info("Get search stats request from IP: {}", RequestUtils.getClientIpAddress(request));

    TransactionSearchDTO searchDto = TransactionSearchDTO.builder()
      .searchText(searchText)
      .minAmount(minAmount)
      .maxAmount(maxAmount)
      .dateFrom(dateFrom)
      .dateTo(dateTo)
      .quickDateFilter(quickDateFilter)
      .type(type)
      .categoryIds(categoryIds)
      .build();

    TransactionSearchStatsDTO stats = transactionService.getSearchStats(user, searchDto);
    return ResponseEntity.ok(stats);
  }

  @GetMapping("/export/csv")
  public ResponseEntity<byte[]> exportTransactionsToCsv(
    @AuthenticationPrincipal User user,
    @RequestParam(required = false) String searchText,
    @RequestParam(required = false) BigDecimal minAmount,
    @RequestParam(required = false) BigDecimal maxAmount,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
    @RequestParam(required = false) TransactionSearchDTO.QuickDateFilter quickDateFilter,
    @RequestParam(required = false) String type,
    @RequestParam(required = false) List<Long> categoryIds,
    @RequestParam(defaultValue = "date") String sortBy,
    @RequestParam(defaultValue = "DESC") TransactionSearchDTO.SortDirection sortDirection,
    HttpServletRequest request) {

    log.info("Export transactions to CSV request from IP: {}", RequestUtils.getClientIpAddress(request));

    TransactionSearchDTO searchDto = TransactionSearchDTO.builder()
      .searchText(searchText)
      .minAmount(minAmount)
      .maxAmount(maxAmount)
      .dateFrom(dateFrom)
      .dateTo(dateTo)
      .quickDateFilter(quickDateFilter)
      .type(type)
      .categoryIds(categoryIds)
      .sortBy(sortBy)
      .sortDirection(sortDirection)
      .build();

    byte[] csvData = transactionService.exportTransactionsToCsv(user, searchDto);

    String filename = String.format("transactions_%s.csv",
      LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss")));

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.parseMediaType("text/csv"));
    headers.setContentDispositionFormData("attachment", filename);
    headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

    return new ResponseEntity<>(csvData, headers, HttpStatus.OK);
  }

  @PostMapping("/export/csv")
  public ResponseEntity<byte[]> exportTransactionsToCsvPost(
    @AuthenticationPrincipal User user,
    @Valid @RequestBody TransactionSearchDTO searchDto,
    HttpServletRequest request) {

    log.info("Export transactions to CSV POST request from IP: {}", RequestUtils.getClientIpAddress(request));

    byte[] csvData = transactionService.exportTransactionsToCsv(user, searchDto);

    String filename = String.format("transactions_%s.csv",
      LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss")));

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.parseMediaType("text/csv"));
    headers.setContentDispositionFormData("attachment", filename);
    headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

    return new ResponseEntity<>(csvData, headers, HttpStatus.OK);
  }

  @GetMapping("/export/excel")
  public ResponseEntity<byte[]> exportTransactionsToExcel(
    @AuthenticationPrincipal User user,
    @RequestParam(required = false) String searchText,
    @RequestParam(required = false) BigDecimal minAmount,
    @RequestParam(required = false) BigDecimal maxAmount,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
    @RequestParam(required = false) TransactionSearchDTO.QuickDateFilter quickDateFilter,
    @RequestParam(required = false) String type,
    @RequestParam(required = false) List<Long> categoryIds,
    @RequestParam(defaultValue = "date") String sortBy,
    @RequestParam(defaultValue = "DESC") TransactionSearchDTO.SortDirection sortDirection,
    HttpServletRequest request) {

    log.info("Export transactions to Excel request from IP: {}", RequestUtils.getClientIpAddress(request));

    TransactionSearchDTO searchDto = TransactionSearchDTO.builder()
      .searchText(searchText)
      .minAmount(minAmount)
      .maxAmount(maxAmount)
      .dateFrom(dateFrom)
      .dateTo(dateTo)
      .quickDateFilter(quickDateFilter)
      .type(type)
      .categoryIds(categoryIds)
      .sortBy(sortBy)
      .sortDirection(sortDirection)
      .build();

    byte[] excelData = transactionService.exportTransactionsToExcel(user, searchDto);

    String filename = String.format("transactions_%s.xlsx",
      LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss")));

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
    headers.setContentDispositionFormData("attachment", filename);
    headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

    return new ResponseEntity<>(excelData, headers, HttpStatus.OK);
  }

  @PostMapping("/export/excel")
  public ResponseEntity<byte[]> exportTransactionsToExcelPost(
    @AuthenticationPrincipal User user,
    @Valid @RequestBody TransactionSearchDTO searchDto,
    HttpServletRequest request) {

    log.info("Export transactions to Excel POST request from IP: {}", RequestUtils.getClientIpAddress(request));

    byte[] excelData = transactionService.exportTransactionsToExcel(user, searchDto);

    String filename = String.format("transactions_%s.xlsx",
      LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss")));

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
    headers.setContentDispositionFormData("attachment", filename);
    headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

    return new ResponseEntity<>(excelData, headers, HttpStatus.OK);
  }


  @GetMapping("/search/saved/{savedSearchId}")
  public ResponseEntity<Page<TransactionDTO>> searchBySavedSearch(
    @AuthenticationPrincipal User user,
    @PathVariable Long savedSearchId,
    @RequestParam(defaultValue = "0") @Min(0) Integer page,
    @RequestParam(defaultValue = "20") @Positive Integer size,
    HttpServletRequest request) {

    log.info("Search by saved search ID: {} - User: {} from IP: {}",
      savedSearchId, user.getEmail(), RequestUtils.getClientIpAddress(request));

    Page<TransactionDTO> results = transactionService.searchBySavedSearch(user, savedSearchId, page, size);
    return ResponseEntity.ok(results);
  }

  @GetMapping("/search/saved/{savedSearchId}/stats")
  public ResponseEntity<TransactionSearchStatsDTO> getSavedSearchStats(
    @AuthenticationPrincipal User user,
    @PathVariable Long savedSearchId,
    HttpServletRequest request) {

    log.info("Get stats for saved search ID: {} - User: {} from IP: {}",
      savedSearchId, user.getEmail(), RequestUtils.getClientIpAddress(request));

    SavedSearchDTO savedSearch = savedSearchService.getSavedSearchById(user, savedSearchId);

    TransactionSearchStatsDTO stats = transactionService.getSearchStats(user, savedSearch.getSearchCriteria());
    return ResponseEntity.ok(stats);
  }

  @GetMapping("/export/csv/saved/{savedSearchId}")
  public ResponseEntity<byte[]> exportSavedSearchToCsv(
    @AuthenticationPrincipal User user,
    @PathVariable Long savedSearchId,
    HttpServletRequest request) {

    log.info("Export saved search ID: {} to CSV - User: {} from IP: {}",
      savedSearchId, user.getEmail(), RequestUtils.getClientIpAddress(request));

    SavedSearchDTO savedSearch = savedSearchService.getSavedSearchById(user, savedSearchId);

    byte[] csvData = transactionService.exportTransactionsToCsv(user, savedSearch.getSearchCriteria());

    String filename = String.format("%s_%s.csv",
      savedSearch.getName().replaceAll("[^a-zA-Z0-9-_]", "_"),
      LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.parseMediaType("text/csv"));
    headers.setContentDispositionFormData("attachment", filename);
    headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

    return new ResponseEntity<>(csvData, headers, HttpStatus.OK);
  }

  @GetMapping("/export/excel/saved/{savedSearchId}")
  public ResponseEntity<byte[]> exportSavedSearchToExcel(
    @AuthenticationPrincipal User user,
    @PathVariable Long savedSearchId,
    HttpServletRequest request) {

    log.info("Export saved search ID: {} to Excel - User: {} from IP: {}",
      savedSearchId, user.getEmail(), RequestUtils.getClientIpAddress(request));

    SavedSearchDTO savedSearch = savedSearchService.getSavedSearchById(user, savedSearchId);

    byte[] excelData = transactionService.exportTransactionsToExcel(user, savedSearch.getSearchCriteria());

    String filename = String.format("%s_%s.xlsx",
      savedSearch.getName().replaceAll("[^a-zA-Z0-9-_]", "_"),
      LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
    headers.setContentDispositionFormData("attachment", filename);
    headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

    return new ResponseEntity<>(excelData, headers, HttpStatus.OK);
  }

  @PostMapping("/import/csv")
  public ResponseEntity<ImportResultDTO> importFromCsv(
    @AuthenticationPrincipal User user,
    @RequestParam("file") MultipartFile file,
    HttpServletRequest request) {

    String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
    log.info("POST /api/transactions/import/csv - User: {} from IP: {} importing file: {}",
      user.getEmail(), RequestUtils.getClientIpAddress(request), file.getOriginalFilename());

    if (file.isEmpty()) {
      throw new BadRequestException("Please select a file to import");
    }

    if (!filename.endsWith(".csv") && !filename.endsWith(".xlsx") && !filename.endsWith(".xls")) {
      throw new BadRequestException("Only CSV and Excel files (.csv, .xlsx, .xls) are supported");
    }

    ImportResultDTO result = transactionService.importFromFile(user, file);

    log.info("File import completed for user: {} - Success: {}, Failed: {}",
      user.getEmail(), result.getSuccessfulImports(), result.getFailedImports());

    return ResponseEntity.ok(result);
  }

}
