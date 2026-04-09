package com.example.financial_tracker.service;

import com.example.financial_tracker.dto.RecurringTransactionDTO;
import com.example.financial_tracker.entity.Category;
import com.example.financial_tracker.entity.RecurringTransaction;
import com.example.financial_tracker.entity.User;
import com.example.financial_tracker.enumerations.RecurrenceFrequency;
import com.example.financial_tracker.enumerations.Role;
import com.example.financial_tracker.enumerations.TransactionType;
import com.example.financial_tracker.exception.ResourceNotFoundException;
import com.example.financial_tracker.mapper.RecurringTransactionMapper;
import com.example.financial_tracker.repository.CategoryRepository;
import com.example.financial_tracker.repository.RecurringTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecurringTransactionServiceTest {

    @Mock
    private RecurringTransactionRepository recurringTransactionRepository;

    @Mock
    private RecurringTransactionMapper recurringTransactionMapper;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private TransactionService transactionService;

    @InjectMocks
    private RecurringTransactionService recurringTransactionService;

    private User testUser;
    private Category testCategory;
    private RecurringTransaction testRecurring;
    private RecurringTransactionDTO testDto;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setRole(Role.USER);

        testCategory = new Category();
        testCategory.setId(1L);
        testCategory.setName("Rent");

        testRecurring = new RecurringTransaction();
        testRecurring.setId(1L);
        testRecurring.setUser(testUser);
        testRecurring.setName("Monthly Rent");
        testRecurring.setAmount(new BigDecimal("1000.00"));
        testRecurring.setType(TransactionType.EXPENSE);
        testRecurring.setCategory(testCategory);
        testRecurring.setFrequency(RecurrenceFrequency.MONTHLY);
        testRecurring.setStartDate(LocalDate.now().minusMonths(1));
        testRecurring.setNextExecutionDate(LocalDate.now());
        testRecurring.setActive(true);

        testDto = new RecurringTransactionDTO();
        testDto.setId(1L);
        testDto.setName("Monthly Rent");
        testDto.setAmount(new BigDecimal("1000.00"));
        testDto.setType("EXPENSE");
        testDto.setCategoryId(1L);
        testDto.setFrequency(RecurrenceFrequency.MONTHLY);
        testDto.setStartDate(LocalDate.now().minusMonths(1));
    }

    @Test
    void getUserRecurringTransactions_returnsList() {
        when(recurringTransactionRepository.findByUserOrderByNextExecutionDateAsc(testUser))
                .thenReturn(List.of(testRecurring));
        when(recurringTransactionMapper.toDtoList(List.of(testRecurring)))
                .thenReturn(List.of(testDto));

        List<RecurringTransactionDTO> result = recurringTransactionService.getUserRecurringTransactions(testUser);

        assertEquals(1, result.size());
        assertEquals("Monthly Rent", result.get(0).getName());
    }

    @Test
    void getUserRecurringTransactions_emptyList() {
        when(recurringTransactionRepository.findByUserOrderByNextExecutionDateAsc(testUser))
                .thenReturn(List.of());
        when(recurringTransactionMapper.toDtoList(List.of()))
                .thenReturn(List.of());

        List<RecurringTransactionDTO> result = recurringTransactionService.getUserRecurringTransactions(testUser);

        assertTrue(result.isEmpty());
    }

    @Test
    void createRecurringTransaction_success() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(testCategory));
        when(recurringTransactionMapper.toEntity(testDto)).thenReturn(testRecurring);
        when(recurringTransactionRepository.save(any(RecurringTransaction.class))).thenReturn(testRecurring);
        when(recurringTransactionMapper.toDto(testRecurring)).thenReturn(testDto);

        RecurringTransactionDTO result = recurringTransactionService.createRecurringTransaction(testUser, testDto);

        assertNotNull(result);
        assertEquals("Monthly Rent", result.getName());
        verify(recurringTransactionRepository).save(any(RecurringTransaction.class));
    }

    @Test
    void createRecurringTransaction_categoryNotFound_throwsException() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                recurringTransactionService.createRecurringTransaction(testUser, testDto));
    }

    @Test
    void updateRecurringTransaction_success() {
        RecurringTransactionDTO updateDto = new RecurringTransactionDTO();
        updateDto.setName("Updated Rent");
        updateDto.setAmount(new BigDecimal("1200.00"));
        updateDto.setType("EXPENSE");
        updateDto.setFrequency(RecurrenceFrequency.MONTHLY);
        updateDto.setStartDate(LocalDate.now());
        updateDto.setActive(true);

        when(recurringTransactionRepository.findByIdAndUser(1L, testUser)).thenReturn(Optional.of(testRecurring));
        when(recurringTransactionRepository.save(any(RecurringTransaction.class))).thenReturn(testRecurring);
        when(recurringTransactionMapper.toDto(testRecurring)).thenReturn(updateDto);

        RecurringTransactionDTO result = recurringTransactionService.updateRecurringTransaction(testUser, 1L, updateDto);

        assertNotNull(result);
        verify(recurringTransactionRepository).save(any(RecurringTransaction.class));
    }

    @Test
    void updateRecurringTransaction_notFound_throwsException() {
        when(recurringTransactionRepository.findByIdAndUser(999L, testUser)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                recurringTransactionService.updateRecurringTransaction(testUser, 999L, testDto));
    }

    @Test
    void updateRecurringTransaction_changeCategory() {
        Category newCategory = new Category();
        newCategory.setId(2L);
        newCategory.setName("Utilities");

        RecurringTransactionDTO updateDto = new RecurringTransactionDTO();
        updateDto.setName("Monthly Rent");
        updateDto.setAmount(new BigDecimal("1000.00"));
        updateDto.setType("EXPENSE");
        updateDto.setCategoryId(2L);
        updateDto.setFrequency(RecurrenceFrequency.MONTHLY);
        updateDto.setStartDate(LocalDate.now());
        updateDto.setActive(true);

        when(recurringTransactionRepository.findByIdAndUser(1L, testUser)).thenReturn(Optional.of(testRecurring));
        when(categoryRepository.findById(2L)).thenReturn(Optional.of(newCategory));
        when(recurringTransactionRepository.save(any(RecurringTransaction.class))).thenReturn(testRecurring);
        when(recurringTransactionMapper.toDto(testRecurring)).thenReturn(updateDto);

        RecurringTransactionDTO result = recurringTransactionService.updateRecurringTransaction(testUser, 1L, updateDto);

        assertNotNull(result);
        verify(categoryRepository).findById(2L);
    }

    @Test
    void deleteRecurringTransaction_success() {
        when(recurringTransactionRepository.findByIdAndUser(1L, testUser)).thenReturn(Optional.of(testRecurring));

        recurringTransactionService.deleteRecurringTransaction(testUser, 1L);

        verify(recurringTransactionRepository).delete(testRecurring);
    }

    @Test
    void deleteRecurringTransaction_notFound_throwsException() {
        when(recurringTransactionRepository.findByIdAndUser(999L, testUser)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                recurringTransactionService.deleteRecurringTransaction(testUser, 999L));
    }

    @Test
    void processRecurringTransactions_executesDueTransactions() {
        testRecurring.setNextExecutionDate(LocalDate.now());

        when(recurringTransactionRepository.findDueRecurringTransactions(any(LocalDate.class)))
                .thenReturn(List.of(testRecurring));
        when(recurringTransactionRepository.save(any(RecurringTransaction.class))).thenReturn(testRecurring);

        recurringTransactionService.processRecurringTransactions();

        verify(transactionService).createTransaction(any(), eq(testUser));
        verify(recurringTransactionRepository).save(testRecurring);
    }

    @Test
    void processRecurringTransactions_deactivatesExpired() {
        testRecurring.setEndDate(LocalDate.now().minusDays(1));

        when(recurringTransactionRepository.findDueRecurringTransactions(any(LocalDate.class)))
                .thenReturn(List.of(testRecurring));
        when(recurringTransactionRepository.save(any(RecurringTransaction.class))).thenReturn(testRecurring);

        recurringTransactionService.processRecurringTransactions();

        assertFalse(testRecurring.getActive());
        verify(transactionService, never()).createTransaction(any(), any());
    }

    @Test
    void processRecurringTransactions_noDueTransactions() {
        when(recurringTransactionRepository.findDueRecurringTransactions(any(LocalDate.class)))
                .thenReturn(List.of());

        recurringTransactionService.processRecurringTransactions();

        verify(transactionService, never()).createTransaction(any(), any());
    }

    @Test
    void executeRecurringTransactionNow_success() {
        when(recurringTransactionRepository.findByIdAndUser(1L, testUser)).thenReturn(Optional.of(testRecurring));
        when(recurringTransactionRepository.save(any(RecurringTransaction.class))).thenReturn(testRecurring);

        recurringTransactionService.executeRecurringTransactionNow(testUser, 1L);

        verify(transactionService).createTransaction(any(), eq(testUser));
        assertNotNull(testRecurring.getLastExecutionDate());
    }

    @Test
    void executeRecurringTransactionNow_notFound_throwsException() {
        when(recurringTransactionRepository.findByIdAndUser(999L, testUser)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                recurringTransactionService.executeRecurringTransactionNow(testUser, 999L));
    }
}
