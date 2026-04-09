package com.example.financial_tracker.service;

import com.example.financial_tracker.dto.GoalContributionDTO;
import com.example.financial_tracker.dto.GoalDTO;
import com.example.financial_tracker.entity.Category;
import com.example.financial_tracker.entity.Goal;
import com.example.financial_tracker.entity.User;
import com.example.financial_tracker.enumerations.GoalPriority;
import com.example.financial_tracker.enumerations.GoalStatus;
import com.example.financial_tracker.enumerations.Role;
import com.example.financial_tracker.exception.BusinessLogicException;
import com.example.financial_tracker.exception.ResourceNotFoundException;
import com.example.financial_tracker.mapper.GoalMapper;
import com.example.financial_tracker.repository.CategoryRepository;
import com.example.financial_tracker.repository.GoalRepository;
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
class GoalServiceTest {

    @Mock
    private GoalRepository goalRepository;

    @Mock
    private GoalMapper goalMapper;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private GoalService goalService;

    private User testUser;
    private Goal testGoal;
    private GoalDTO testGoalDTO;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setRole(Role.USER);

        testGoal = new Goal();
        testGoal.setId(1L);
        testGoal.setUser(testUser);
        testGoal.setName("Save for vacation");
        testGoal.setTargetAmount(new BigDecimal("1000.00"));
        testGoal.setCurrentAmount(new BigDecimal("250.00"));
        testGoal.setTargetDate(LocalDate.now().plusMonths(3));
        testGoal.setStatus(GoalStatus.ACTIVE);
        testGoal.setPriority(GoalPriority.HIGH);

        testGoalDTO = new GoalDTO();
        testGoalDTO.setId(1L);
        testGoalDTO.setName("Save for vacation");
        testGoalDTO.setTargetAmount(new BigDecimal("1000.00"));
        testGoalDTO.setCurrentAmount(new BigDecimal("250.00"));
        testGoalDTO.setTargetDate(LocalDate.now().plusMonths(3));
        testGoalDTO.setPriority(GoalPriority.HIGH);
    }

    @Test
    void getUserGoals_returnsEnrichedGoals() {
        when(goalRepository.findByUserOrderByPriorityDescTargetDateAsc(testUser))
                .thenReturn(List.of(testGoal));
        when(goalMapper.toDto(testGoal)).thenReturn(testGoalDTO);

        List<GoalDTO> result = goalService.getUserGoals(testUser);

        assertEquals(1, result.size());
        assertNotNull(result.get(0).getProgressPercentage());
        assertNotNull(result.get(0).getRemainingAmount());
    }

    @Test
    void getUserGoals_emptyList() {
        when(goalRepository.findByUserOrderByPriorityDescTargetDateAsc(testUser))
                .thenReturn(List.of());

        List<GoalDTO> result = goalService.getUserGoals(testUser);

        assertTrue(result.isEmpty());
    }

    @Test
    void getGoalById_found_returnsGoal() {
        when(goalRepository.findByIdAndUser(1L, testUser)).thenReturn(Optional.of(testGoal));
        when(goalMapper.toDto(testGoal)).thenReturn(testGoalDTO);

        GoalDTO result = goalService.getGoalById(testUser, 1L);

        assertNotNull(result);
        assertEquals("Save for vacation", result.getName());
    }

    @Test
    void getGoalById_notFound_throwsException() {
        when(goalRepository.findByIdAndUser(999L, testUser)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                goalService.getGoalById(testUser, 999L));
    }

    @Test
    void createGoal_withoutCategory_success() {
        GoalDTO inputDto = new GoalDTO();
        inputDto.setName("New goal");
        inputDto.setTargetAmount(new BigDecimal("500.00"));
        inputDto.setTargetDate(LocalDate.now().plusMonths(1));
        inputDto.setPriority(GoalPriority.MEDIUM);

        Goal newGoal = new Goal();
        newGoal.setId(2L);
        newGoal.setName("New goal");
        newGoal.setTargetAmount(new BigDecimal("500.00"));
        newGoal.setCurrentAmount(BigDecimal.ZERO);
        newGoal.setTargetDate(LocalDate.now().plusMonths(1));
        newGoal.setStatus(GoalStatus.ACTIVE);

        when(goalMapper.toEntity(inputDto)).thenReturn(newGoal);
        when(goalRepository.save(any(Goal.class))).thenReturn(newGoal);
        when(goalMapper.toDto(newGoal)).thenReturn(inputDto);

        GoalDTO result = goalService.createGoal(testUser, inputDto);

        assertNotNull(result);
        verify(goalRepository).save(any(Goal.class));
    }

    @Test
    void createGoal_withCategory_success() {
        Category category = new Category();
        category.setId(1L);
        category.setName("Savings");

        GoalDTO inputDto = new GoalDTO();
        inputDto.setName("New goal");
        inputDto.setTargetAmount(new BigDecimal("500.00"));
        inputDto.setTargetDate(LocalDate.now().plusMonths(1));
        inputDto.setCategoryId(1L);

        Goal newGoal = new Goal();
        newGoal.setId(2L);
        newGoal.setTargetAmount(new BigDecimal("500.00"));
        newGoal.setCurrentAmount(BigDecimal.ZERO);
        newGoal.setTargetDate(LocalDate.now().plusMonths(1));
        newGoal.setStatus(GoalStatus.ACTIVE);

        when(goalMapper.toEntity(inputDto)).thenReturn(newGoal);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(goalRepository.save(any(Goal.class))).thenReturn(newGoal);
        when(goalMapper.toDto(newGoal)).thenReturn(inputDto);

        GoalDTO result = goalService.createGoal(testUser, inputDto);

        assertNotNull(result);
        verify(categoryRepository).findById(1L);
    }

    @Test
    void createGoal_categoryNotFound_throwsException() {
        GoalDTO inputDto = new GoalDTO();
        inputDto.setName("New goal");
        inputDto.setTargetAmount(new BigDecimal("500.00"));
        inputDto.setTargetDate(LocalDate.now().plusMonths(1));
        inputDto.setCategoryId(999L);

        Goal newGoal = new Goal();
        newGoal.setTargetAmount(new BigDecimal("500.00"));
        newGoal.setCurrentAmount(BigDecimal.ZERO);
        newGoal.setTargetDate(LocalDate.now().plusMonths(1));

        when(goalMapper.toEntity(inputDto)).thenReturn(newGoal);
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                goalService.createGoal(testUser, inputDto));
    }

    @Test
    void updateGoal_success() {
        GoalDTO updateDto = new GoalDTO();
        updateDto.setName("Updated goal");
        updateDto.setTargetAmount(new BigDecimal("2000.00"));
        updateDto.setTargetDate(LocalDate.now().plusMonths(6));
        updateDto.setPriority(GoalPriority.LOW);

        when(goalRepository.findByIdAndUser(1L, testUser)).thenReturn(Optional.of(testGoal));
        when(goalRepository.save(any(Goal.class))).thenReturn(testGoal);
        when(goalMapper.toDto(testGoal)).thenReturn(updateDto);

        GoalDTO result = goalService.updateGoal(testUser, 1L, updateDto);

        assertNotNull(result);
        verify(goalRepository).save(testGoal);
    }

    @Test
    void updateGoal_notFound_throwsException() {
        when(goalRepository.findByIdAndUser(999L, testUser)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                goalService.updateGoal(testUser, 999L, testGoalDTO));
    }

    @Test
    void deleteGoal_success() {
        when(goalRepository.findByIdAndUser(1L, testUser)).thenReturn(Optional.of(testGoal));

        goalService.deleteGoal(testUser, 1L);

        verify(goalRepository).delete(testGoal);
    }

    @Test
    void deleteGoal_notFound_throwsException() {
        when(goalRepository.findByIdAndUser(999L, testUser)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                goalService.deleteGoal(testUser, 999L));
    }

    @Test
    void contributeToGoal_addAmount_success() {
        GoalContributionDTO contribution = new GoalContributionDTO();
        contribution.setGoalId(1L);
        contribution.setAmount(new BigDecimal("100.00"));
        contribution.setType(GoalContributionDTO.ContributionType.ADD);

        when(goalRepository.findByIdAndUser(1L, testUser)).thenReturn(Optional.of(testGoal));
        when(goalRepository.save(any(Goal.class))).thenReturn(testGoal);
        when(goalMapper.toDto(testGoal)).thenReturn(testGoalDTO);

        GoalDTO result = goalService.contributeToGoal(testUser, contribution);

        assertNotNull(result);
        assertEquals(new BigDecimal("350.00"), testGoal.getCurrentAmount());
    }

    @Test
    void contributeToGoal_subtractAmount_success() {
        GoalContributionDTO contribution = new GoalContributionDTO();
        contribution.setGoalId(1L);
        contribution.setAmount(new BigDecimal("50.00"));
        contribution.setType(GoalContributionDTO.ContributionType.WITHDRAW);

        when(goalRepository.findByIdAndUser(1L, testUser)).thenReturn(Optional.of(testGoal));
        when(goalRepository.save(any(Goal.class))).thenReturn(testGoal);
        when(goalMapper.toDto(testGoal)).thenReturn(testGoalDTO);

        GoalDTO result = goalService.contributeToGoal(testUser, contribution);

        assertNotNull(result);
        assertEquals(new BigDecimal("200.00"), testGoal.getCurrentAmount());
    }

    @Test
    void contributeToGoal_completesGoal() {
        GoalContributionDTO contribution = new GoalContributionDTO();
        contribution.setGoalId(1L);
        contribution.setAmount(new BigDecimal("750.00"));
        contribution.setType(GoalContributionDTO.ContributionType.ADD);

        when(goalRepository.findByIdAndUser(1L, testUser)).thenReturn(Optional.of(testGoal));
        when(goalRepository.save(any(Goal.class))).thenReturn(testGoal);
        when(goalMapper.toDto(testGoal)).thenReturn(testGoalDTO);

        goalService.contributeToGoal(testUser, contribution);

        assertEquals(GoalStatus.COMPLETED, testGoal.getStatus());
        assertNotNull(testGoal.getCompletedAt());
    }

    @Test
    void contributeToGoal_inactiveGoal_throwsException() {
        testGoal.setStatus(GoalStatus.CANCELLED);

        GoalContributionDTO contribution = new GoalContributionDTO();
        contribution.setGoalId(1L);
        contribution.setAmount(new BigDecimal("100.00"));
        contribution.setType(GoalContributionDTO.ContributionType.ADD);

        when(goalRepository.findByIdAndUser(1L, testUser)).thenReturn(Optional.of(testGoal));

        assertThrows(BusinessLogicException.class, () ->
                goalService.contributeToGoal(testUser, contribution));
    }

    @Test
    void contributeToGoal_withdrawMoreThanCurrent_throwsException() {
        GoalContributionDTO contribution = new GoalContributionDTO();
        contribution.setGoalId(1L);
        contribution.setAmount(new BigDecimal("500.00"));
        contribution.setType(GoalContributionDTO.ContributionType.WITHDRAW);

        when(goalRepository.findByIdAndUser(1L, testUser)).thenReturn(Optional.of(testGoal));

        assertThrows(BusinessLogicException.class, () ->
                goalService.contributeToGoal(testUser, contribution));
    }

    @Test
    void contributeToGoal_notFound_throwsException() {
        GoalContributionDTO contribution = new GoalContributionDTO();
        contribution.setGoalId(999L);
        contribution.setAmount(new BigDecimal("100.00"));
        contribution.setType(GoalContributionDTO.ContributionType.ADD);

        when(goalRepository.findByIdAndUser(999L, testUser)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                goalService.contributeToGoal(testUser, contribution));
    }

    @Test
    void cancelGoal_success() {
        when(goalRepository.findByIdAndUser(1L, testUser)).thenReturn(Optional.of(testGoal));

        goalService.cancelGoal(testUser, 1L);

        assertEquals(GoalStatus.CANCELLED, testGoal.getStatus());
        verify(goalRepository).save(testGoal);
    }

    @Test
    void enrichGoalDto_calculatesProgress() {
        when(goalRepository.findByIdAndUser(1L, testUser)).thenReturn(Optional.of(testGoal));
        when(goalMapper.toDto(testGoal)).thenReturn(testGoalDTO);

        GoalDTO result = goalService.getGoalById(testUser, 1L);

        assertNotNull(result.getProgressPercentage());
        assertEquals(new BigDecimal("750.00"), result.getRemainingAmount());
        assertFalse(result.getIsCompleted());
    }
}