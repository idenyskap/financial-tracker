package com.example.financial_tracker.service;

import com.example.financial_tracker.dto.*;
import com.example.financial_tracker.entity.*;
import com.example.financial_tracker.enumerations.TransactionType;
import com.example.financial_tracker.exception.AccessDeniedException;
import com.example.financial_tracker.exception.BusinessLogicException;
import com.example.financial_tracker.exception.ResourceNotFoundException;
import com.example.financial_tracker.mapper.TransactionMapper;
import com.example.financial_tracker.repository.CategoryRepository;
import com.example.financial_tracker.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.opencsv.CSVWriter;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import com.example.financial_tracker.entity.Budget;
import com.example.financial_tracker.repository.BudgetRepository;
import com.example.financial_tracker.dto.BudgetWarningDTO;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TransactionService {

  private final TransactionRepository transactionRepository;
  private final TransactionMapper transactionMapper;
  private final CategoryRepository categoryRepository;
  private final SavedSearchService savedSearchService;
  private final BudgetService budgetService;
  private final BudgetRepository budgetRepository;
  private final EmailService emailService;

  @Transactional(readOnly = true)
  public List<TransactionDTO> getTransactionsByUser(User user) {
    log.debug("Fetching all transactions for user: {} (ID: {})", user.getEmail(), user.getId());

    List<Transaction> transactions = transactionRepository.findByUserOrderByDateDesc(user);

    log.debug("Found {} transactions for user: {}", transactions.size(), user.getEmail());
    return transactionMapper.toDtoList(transactions);
  }

  @Transactional(readOnly = true)
  public Page<TransactionDTO> getTransactionsByUser(User user, Pageable pageable) {
    log.debug("Fetching paginated transactions for user: {} (page: {}, size: {})",
      user.getEmail(), pageable.getPageNumber(), pageable.getPageSize());

    Page<Transaction> transactions = transactionRepository.findByUserOrderByDateDesc(user, pageable);

    log.debug("Retrieved page {} of {} with {} transactions for user: {}",
      transactions.getNumber(), transactions.getTotalPages(),
      transactions.getNumberOfElements(), user.getEmail());

    return transactions.map(transactionMapper::toDto);
  }

  @Transactional(readOnly = true)
  public TransactionDTO getTransactionById(Long id, User user) {
    log.debug("Fetching transaction ID: {} for user: {}", id, user.getEmail());

    Transaction transaction = transactionRepository.findByIdAndUser(id, user)
      .orElseThrow(() -> {
        log.warn("Transaction ID: {} not found for user: {}", id, user.getEmail());
        return new ResourceNotFoundException("Transaction not found");
      });

    log.debug("Successfully retrieved transaction ID: {} for user: {}", id, user.getEmail());
    return transactionMapper.toDto(transaction);
  }

  public TransactionDTO createTransaction(TransactionDTO dto, User user) {
    log.info("Creating new transaction for user: {} with data: {}", user.getEmail(),
      maskSensitiveData(dto));

    if (dto.getType() != null) {
      try {
        TransactionType.valueOf(dto.getType().toUpperCase());
      } catch (IllegalArgumentException e) {
        log.error("Invalid transaction type '{}' provided by user: {}",
          dto.getType(), user.getEmail());
        throw new BusinessLogicException("Invalid transaction type: " + dto.getType() +
          ". Must be 'INCOME' or 'EXPENSE'");
      }
    }

    log.debug("Validating category ID: {} for user: {}", dto.getCategoryId(), user.getEmail());
    Category category = categoryRepository.findById(dto.getCategoryId())
      .orElseThrow(() -> {
        log.error("Category ID: {} not found when creating transaction for user: {}",
          dto.getCategoryId(), user.getEmail());
        return new ResourceNotFoundException("Category", "id", dto.getCategoryId());
      });

    if (!category.getUser().getId().equals(user.getId())) {
      log.warn("User: {} attempted to use category ID: {} belonging to another user",
        user.getEmail(), dto.getCategoryId());
      throw new AccessDeniedException("Category does not belong to user");
    }

    Transaction transaction = transactionMapper.toEntity(dto);
    transaction.setUser(user);
    transaction.setCategory(category);

    Transaction saved = transactionRepository.save(transaction);

    log.info("Successfully created transaction ID: {} for user: {} - Type: {}, Amount: {}, Category: '{}'",
      saved.getId(), user.getEmail(), saved.getType(),
      saved.getAmount(), category.getName());

    return transactionMapper.toDto(saved);
  }

  private BudgetWarningDTO checkBudgetWarning(User user, Category category) {
    try {
      List<Budget> budgets = budgetRepository.findActiveBudgetsForCategory(user, category);

      for (Budget budget : budgets) {
        if (budget.getStartDate() == null || budget.getEndDate() == null) {
          budget.calculateDates();
        }

        BigDecimal spent;
        if (budget.getCategory() != null) {
          spent = transactionRepository.getTotalExpenseByUserAndCategoryAndDateRange(
            user, budget.getCategory(), budget.getStartDate(), budget.getEndDate());
        } else {
          spent = transactionRepository.getTotalExpenseByUserAndDateRange(
            user, budget.getStartDate(), budget.getEndDate());
        }

        BigDecimal remaining = budget.getAmount().subtract(spent);
        BigDecimal percentUsed = budget.getAmount().compareTo(BigDecimal.ZERO) > 0
          ? spent.multiply(new BigDecimal("100")).divide(budget.getAmount(), 2, java.math.RoundingMode.HALF_UP)
          : BigDecimal.ZERO;
        boolean overBudget = spent.compareTo(budget.getAmount()) > 0;

        BudgetWarningDTO.WarningLevel level;
        String message;

        if (overBudget) {
          level = BudgetWarningDTO.WarningLevel.EXCEEDED;
          message = String.format("Budget '%s' exceeded! Spent: $%.2f of $%.2f limit",
            budget.getName(), spent, budget.getAmount());
        } else if (percentUsed.compareTo(new BigDecimal(budget.getNotifyThreshold())) >= 0) {
          level = BudgetWarningDTO.WarningLevel.ALERT;
          message = String.format("Budget '%s' is %.0f%% used. Remaining: $%.2f",
            budget.getName(), percentUsed, remaining);
        } else if (percentUsed.compareTo(new BigDecimal("50")) >= 0) {
          level = BudgetWarningDTO.WarningLevel.WARNING;
          message = String.format("Budget '%s' is %.0f%% used",
            budget.getName(), percentUsed);
        } else {
          continue;
        }

        log.warn("Budget warning: {}", message);

        return BudgetWarningDTO.builder()
          .budgetId(budget.getId())
          .budgetName(budget.getName())
          .limit(budget.getAmount())
          .spent(spent)
          .remaining(remaining)
          .percentUsed(percentUsed)
          .overBudget(overBudget)
          .message(message)
          .level(level)
          .build();
      }
    } catch (Exception e) {
      log.error("Error checking budget warnings", e);
    }

    return null;
  }

  public TransactionDTO updateTransaction(Long id, TransactionDTO dto, User user) {
    log.info("Updating transaction ID: {} for user: {} with new data: {}",
      id, user.getEmail(), maskSensitiveData(dto));

    Transaction existing = transactionRepository.findByIdAndUser(id, user)
      .orElseThrow(() -> {
        log.error("Transaction ID: {} not found for update by user: {}", id, user.getEmail());
        return new RuntimeException("Transaction not found");
      });

    log.debug("Original transaction - Amount: {}, Type: {}, Description: '{}'",
      existing.getAmount(), existing.getType(), existing.getDescription());

    if (dto.getCategoryId() != null && !dto.getCategoryId().equals(existing.getCategory().getId())) {
      log.debug("Category being changed from ID: {} to ID: {}",
        existing.getCategory().getId(), dto.getCategoryId());

      Category category = categoryRepository.findById(dto.getCategoryId())
        .orElseThrow(() -> {
          log.error("New category ID: {} not found during update for user: {}",
            dto.getCategoryId(), user.getEmail());
          return new RuntimeException("Category not found");
        });

      if (!category.getUser().getId().equals(user.getId())) {
        log.warn("User: {} attempted to change to category ID: {} belonging to another user",
          user.getEmail(), dto.getCategoryId());
        throw new RuntimeException("Category does not belong to user");
      }
      existing.setCategory(category);
    }

    existing.setAmount(dto.getAmount());
    existing.setType(TransactionType.valueOf(dto.getType()));
    existing.setDescription(dto.getDescription());
    existing.setDate(dto.getDate());

    Transaction saved = transactionRepository.save(existing);

    log.info("Successfully updated transaction ID: {} for user: {} - New values: Type: {}, Amount: {}",
      id, user.getEmail(), saved.getType(), saved.getAmount());

    return transactionMapper.toDto(saved);
  }

  public void deleteTransaction(Long id, User user) {
    log.info("Deleting transaction ID: {} for user: {}", id, user.getEmail());

    Transaction transaction = transactionRepository.findByIdAndUser(id, user)
      .orElseThrow(() -> {
        log.error("Transaction ID: {} not found for deletion by user: {}", id, user.getEmail());
        return new RuntimeException("Transaction not found");
      });

    log.info("Deleting transaction - Type: {}, Amount: {}, Category: '{}', Date: {}",
      transaction.getType(), transaction.getAmount(),
      transaction.getCategory().getName(), transaction.getDate());

    transactionRepository.delete(transaction);

    log.info("Successfully deleted transaction ID: {} for user: {}", id, user.getEmail());
  }

  @Transactional(readOnly = true)
  public BigDecimal getBalanceByUser(User user) {
    log.debug("Calculating balance for user: {}", user.getEmail());

    BigDecimal balance = transactionRepository.calculateBalanceByUser(user);
    BigDecimal result = balance != null ? balance : BigDecimal.ZERO;

    log.debug("Current balance for user: {} is: {}", user.getEmail(), result);
    return result;
  }

  @Transactional(readOnly = true)
  public BigDecimal getTotalIncomeByUser(User user) {
    log.debug("Calculating total income for user: {}", user.getEmail());

    BigDecimal income = transactionRepository.getTotalIncomeByUser(user);

    log.debug("Total income for user: {} is: {}", user.getEmail(), income);
    return income;
  }

  @Transactional(readOnly = true)
  public BigDecimal getTotalExpenseByUser(User user) {
    log.debug("Calculating total expenses for user: {}", user.getEmail());

    BigDecimal expense = transactionRepository.getTotalExpenseByUser(user);

    log.debug("Total expenses for user: {} is: {}", user.getEmail(), expense);
    return expense;
  }

  @Transactional(readOnly = true)
  public List<TransactionDTO> getTransactionsWithFilters(User user,
                                                         TransactionType type,
                                                         Long categoryId,
                                                         LocalDate startDate,
                                                         LocalDate endDate) {
    log.debug("Fetching filtered transactions for user: {} - Type: {}, CategoryID: {}, Date range: {} to {}",
      user.getEmail(), type, categoryId, startDate, endDate);

    List<Transaction> transactions = transactionRepository.findByUserWithFilters(
      user, type, categoryId, startDate, endDate);

    log.debug("Found {} transactions matching filters for user: {}",
      transactions.size(), user.getEmail());

    return transactionMapper.toDtoList(transactions);
  }

  @Transactional(readOnly = true)
  public List<TransactionDTO> getTransactionsByType(User user, TransactionType type) {
    log.debug("Fetching {} transactions for user: {}", type, user.getEmail());

    List<Transaction> transactions = transactionRepository.findByUserAndTypeOrderByDateDesc(user, type);

    log.debug("Found {} {} transactions for user: {}",
      transactions.size(), type, user.getEmail());

    return transactionMapper.toDtoList(transactions);
  }

  private String maskSensitiveData(TransactionDTO dto) {
    if (dto == null) return "null";

    return String.format("TransactionDTO{type='%s', amount=%s, categoryId=%s, date=%s, description='%s'}",
      dto.getType(),
      dto.getAmount(),
      dto.getCategoryId(),
      dto.getDate(),
      dto.getDescription() != null && dto.getDescription().length() > 50 ?
        dto.getDescription().substring(0, 50) + "..." : dto.getDescription());
  }

  @Transactional(readOnly = true)
  public Page<TransactionDTO> searchTransactions(User user, TransactionSearchDTO searchDto) {
    log.debug("Searching transactions for user: {} with criteria: {}", user.getEmail(), searchDto);

    applyQuickDateFilter(searchDto);

    Specification<Transaction> spec = createSearchSpecification(user, searchDto);

    Pageable pageable = createPageable(searchDto);

    Page<Transaction> transactions = transactionRepository.findAll(spec, pageable);

    log.debug("Found {} transactions matching criteria", transactions.getTotalElements());
    return transactions.map(transactionMapper::toDto);
  }

  private void applyQuickDateFilter(TransactionSearchDTO searchDto) {
    if (searchDto.getQuickDateFilter() == null ||
      searchDto.getQuickDateFilter() == TransactionSearchDTO.QuickDateFilter.CUSTOM) {
      return;
    }

    LocalDate now = LocalDate.now();

    switch (searchDto.getQuickDateFilter()) {
      case TODAY:
        searchDto.setDateFrom(now);
        searchDto.setDateTo(now);
        break;
      case LAST_7_DAYS:
        searchDto.setDateFrom(now.minusDays(6));
        searchDto.setDateTo(now);
        break;
      case LAST_30_DAYS:
        searchDto.setDateFrom(now.minusDays(29));
        searchDto.setDateTo(now);
        break;
      case LAST_90_DAYS:
        searchDto.setDateFrom(now.minusDays(89));
        searchDto.setDateTo(now);
        break;
      case THIS_MONTH:
        searchDto.setDateFrom(now.withDayOfMonth(1));
        searchDto.setDateTo(now);
        break;
      case LAST_MONTH:
        LocalDate lastMonth = now.minusMonths(1);
        searchDto.setDateFrom(lastMonth.withDayOfMonth(1));
        searchDto.setDateTo(lastMonth.withDayOfMonth(lastMonth.lengthOfMonth()));
        break;
      case THIS_YEAR:
        searchDto.setDateFrom(now.withDayOfYear(1));
        searchDto.setDateTo(now);
        break;
    }
  }

  private Specification<Transaction> createSearchSpecification(User user, TransactionSearchDTO searchDto) {
    return (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();

      predicates.add(cb.equal(root.get("user"), user));

      if (searchDto.getSearchText() != null && !searchDto.getSearchText().trim().isEmpty()) {
        String searchPattern = "%" + searchDto.getSearchText().toLowerCase().trim() + "%";
        predicates.add(cb.like(cb.lower(root.get("description")), searchPattern));
      }

      if (searchDto.getMinAmount() != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("amount"), searchDto.getMinAmount()));
      }

      if (searchDto.getMaxAmount() != null) {
        predicates.add(cb.lessThanOrEqualTo(root.get("amount"), searchDto.getMaxAmount()));
      }

      if (searchDto.getDateFrom() != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("date"), searchDto.getDateFrom()));
      }

      if (searchDto.getDateTo() != null) {
        predicates.add(cb.lessThanOrEqualTo(root.get("date"), searchDto.getDateTo()));
      }

      if (searchDto.getType() != null && !searchDto.getType().isEmpty()) {
        try {
          TransactionType type = TransactionType.valueOf(searchDto.getType().toUpperCase());
          predicates.add(cb.equal(root.get("type"), type));
        } catch (IllegalArgumentException e) {
          log.warn("Invalid transaction type in search: {}", searchDto.getType());
        }
      }

      if (searchDto.getCategoryIds() != null && !searchDto.getCategoryIds().isEmpty()) {
        predicates.add(root.get("category").get("id").in(searchDto.getCategoryIds()));
      }

      return cb.and(predicates.toArray(new Predicate[0]));
    };
  }

  private Pageable createPageable(TransactionSearchDTO searchDto) {
    Sort.Direction sortDirection = searchDto.getSortDirection() == TransactionSearchDTO.SortDirection.ASC
      ? Sort.Direction.ASC : Sort.Direction.DESC;

    String sortBy = searchDto.getSortBy();
    if (!List.of("date", "amount", "description", "type").contains(sortBy)) {
      sortBy = "date";
    }

    return PageRequest.of(
      searchDto.getPage(),
      searchDto.getSize(),
      Sort.by(sortDirection, sortBy)
    );
  }

  @Transactional(readOnly = true)
  public byte[] exportTransactionsToCsv(User user, TransactionSearchDTO searchDto) {
    log.info("Exporting transactions to CSV for user: {}", user.getEmail());

    applyQuickDateFilter(searchDto);
    Specification<Transaction> spec = createSearchSpecification(user, searchDto);

    Sort sort = Sort.by(
      searchDto.getSortDirection() == TransactionSearchDTO.SortDirection.ASC
        ? Sort.Direction.ASC : Sort.Direction.DESC,
      searchDto.getSortBy()
    );

    List<Transaction> transactions = transactionRepository.findAll(spec, sort);

    try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
         OutputStreamWriter osw = new OutputStreamWriter(baos, "UTF-8");
         CSVWriter csvWriter = new CSVWriter(osw)) {

      String[] headers = {"Date", "Type", "Category", "Amount", "Description", "Created At"};
      csvWriter.writeNext(headers);

      for (Transaction transaction : transactions) {
        String[] data = {
          transaction.getDate().toString(),
          transaction.getType().toString(),
          transaction.getCategory().getName(),
          transaction.getAmount().toString(),
          transaction.getDescription() != null ? transaction.getDescription() : "",
          transaction.getCreatedAt() != null ? transaction.getCreatedAt().toString() : ""
        };
        csvWriter.writeNext(data);
      }

      csvWriter.flush();
      log.info("Successfully exported {} transactions to CSV", transactions.size());
      return baos.toByteArray();

    } catch (Exception e) {
      log.error("Error exporting transactions to CSV", e);
      throw new BusinessLogicException("Failed to export transactions to CSV");
    }
  }

  @Transactional(readOnly = true)
  public TransactionSearchStatsDTO getSearchStats(User user, TransactionSearchDTO searchDto) {
    log.debug("Calculating search statistics for user: {}", user.getEmail());

    applyQuickDateFilter(searchDto);
    Specification<Transaction> spec = createSearchSpecification(user, searchDto);

    List<Transaction> transactions = transactionRepository.findAll(spec);

    BigDecimal totalIncome = transactions.stream()
      .filter(t -> t.getType() == TransactionType.INCOME)
      .map(Transaction::getAmount)
      .reduce(BigDecimal.ZERO, BigDecimal::add);

    BigDecimal totalExpense = transactions.stream()
      .filter(t -> t.getType() == TransactionType.EXPENSE)
      .map(Transaction::getAmount)
      .reduce(BigDecimal.ZERO, BigDecimal::add);

    return TransactionSearchStatsDTO.builder()
      .totalCount(transactions.size())
      .totalIncome(totalIncome)
      .totalExpense(totalExpense)
      .netAmount(totalIncome.subtract(totalExpense))
      .build();
  }

  @Transactional(readOnly = true)
  public byte[] exportTransactionsToExcel(User user, TransactionSearchDTO searchDto) {
    log.info("Exporting transactions to Excel for user: {}", user.getEmail());

    applyQuickDateFilter(searchDto);
    Specification<Transaction> spec = createSearchSpecification(user, searchDto);

    Sort sort = Sort.by(
      searchDto.getSortDirection() == TransactionSearchDTO.SortDirection.ASC
        ? Sort.Direction.ASC : Sort.Direction.DESC,
      searchDto.getSortBy()
    );

    List<Transaction> transactions = transactionRepository.findAll(spec, sort);

    try (Workbook workbook = new XSSFWorkbook();
         ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

      Sheet sheet = workbook.createSheet("Transactions");

      CellStyle headerStyle = workbook.createCellStyle();
      Font headerFont = workbook.createFont();
      headerFont.setBold(true);
      headerStyle.setFont(headerFont);
      headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
      headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

      CellStyle dateStyle = workbook.createCellStyle();
      dateStyle.setDataFormat(workbook.createDataFormat().getFormat("yyyy-MM-dd"));

      CellStyle currencyStyle = workbook.createCellStyle();
      currencyStyle.setDataFormat(workbook.createDataFormat().getFormat("$#,##0.00"));

      Row headerRow = sheet.createRow(0);
      String[] headers = {"Date", "Type", "Category", "Amount", "Description"};
      for (int i = 0; i < headers.length; i++) {
        Cell cell = headerRow.createCell(i);
        cell.setCellValue(headers[i]);
        cell.setCellStyle(headerStyle);
      }

      int rowNum = 1;
      for (Transaction transaction : transactions) {
        Row row = sheet.createRow(rowNum++);

        Cell dateCell = row.createCell(0);
        dateCell.setCellValue(transaction.getDate());
        dateCell.setCellStyle(dateStyle);

        row.createCell(1).setCellValue(transaction.getType().toString());
        row.createCell(2).setCellValue(transaction.getCategory().getName());

        Cell amountCell = row.createCell(3);
        amountCell.setCellValue(transaction.getAmount().doubleValue());
        amountCell.setCellStyle(currencyStyle);

        row.createCell(4).setCellValue(transaction.getDescription() != null ? transaction.getDescription() : "");
      }

      for (int i = 0; i < headers.length; i++) {
        sheet.autoSizeColumn(i);
      }

      workbook.write(baos);
      log.info("Successfully exported {} transactions to Excel", transactions.size());
      return baos.toByteArray();

    } catch (Exception e) {
      log.error("Error exporting transactions to Excel", e);
      throw new BusinessLogicException("Failed to export transactions to Excel");
    }
  }

  @Transactional(readOnly = true)
  public Page<TransactionDTO> searchBySavedSearch(User user, Long savedSearchId, Integer page, Integer size) {
    log.debug("Executing saved search ID: {} for user: {}", savedSearchId, user.getEmail());

    SavedSearchDTO savedSearch = savedSearchService.getSavedSearchById(user, savedSearchId);

    TransactionSearchDTO searchDto = savedSearch.getSearchCriteria();
    if (page != null) {
      searchDto.setPage(page);
    }
    if (size != null) {
      searchDto.setSize(size);
    }

    log.debug("Executing search with criteria from saved search '{}'", savedSearch.getName());
    return searchTransactions(user, searchDto);
  }

  public ImportResultDTO importFromCsv(User user, MultipartFile file) {
    ImportResultDTO result = ImportResultDTO.builder()
      .errors(new ArrayList<>())
      .importedTransactions(new ArrayList<>())
      .build();

    try (BufferedReader reader = new BufferedReader(
      new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

      String headerLine = reader.readLine();
      if (headerLine == null) {
        throw new BusinessLogicException("CSV file is empty");
      }

      String line;
      int rowNumber = 1;

      while ((line = reader.readLine()) != null) {
        rowNumber++;
        result.setTotalRows(result.getTotalRows() + 1);

        try {
          TransactionDTO transaction = parseCsvLine(line, rowNumber, user);
          Transaction saved = createTransactionFromImport(transaction, user);
          result.getImportedTransactions().add(transactionMapper.toDto(saved));
          result.setSuccessfulImports(result.getSuccessfulImports() + 1);
        } catch (Exception e) {
          result.setFailedImports(result.getFailedImports() + 1);
          result.getErrors().add(String.format("Row %d: %s", rowNumber, e.getMessage()));

          if (result.getErrors().size() >= 10) {
            result.getErrors().add("Import stopped due to too many errors");
            break;
          }
        }
      }
    } catch (IOException e) {
      throw new BusinessLogicException("Error reading CSV file: " + e.getMessage());
    }

    return result;
  }

  private TransactionDTO parseCsvLine(String line, int rowNumber, User user) {
    String[] values = line.split(",");

    if (values.length < 4) {
      throw new IllegalArgumentException("Invalid format. Expected: date,amount,type,category,description");
    }

    try {
      TransactionDTO dto = new TransactionDTO();

      dto.setDate(LocalDate.parse(values[0].trim()));

      dto.setAmount(new BigDecimal(values[1].trim()));

      String type = values[2].trim().toUpperCase();
      if (!type.equals("INCOME") && !type.equals("EXPENSE")) {
        throw new IllegalArgumentException("Type must be INCOME or EXPENSE");
      }
      dto.setType(type);

      String categoryName = values[3].trim();
      Category category = categoryRepository.findByNameAndUser(categoryName, user)
        .orElseThrow(() -> new IllegalArgumentException("Category '" + categoryName + "' not found"));
      dto.setCategoryId(category.getId());

      if (values.length > 4) {
        dto.setDescription(values[4].trim());
      }

      return dto;
    } catch (DateTimeParseException e) {
      throw new IllegalArgumentException("Invalid date format. Use YYYY-MM-DD");
    } catch (NumberFormatException e) {
      throw new IllegalArgumentException("Invalid amount format");
    }
  }

  private Transaction createTransactionFromImport(TransactionDTO dto, User user) {
    Category category = categoryRepository.findById(dto.getCategoryId())
      .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

    Transaction transaction = transactionMapper.toEntity(dto);
    transaction.setUser(user);
    transaction.setCategory(category);

    return transactionRepository.save(transaction);
  }
}
