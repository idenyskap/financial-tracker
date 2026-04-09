package com.example.financial_tracker.service;

import com.example.financial_tracker.entity.ExchangeRate;
import com.example.financial_tracker.entity.User;
import com.example.financial_tracker.enumerations.Currency;
import com.example.financial_tracker.exception.BusinessLogicException;
import com.example.financial_tracker.repository.ExchangeRateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CurrencyServiceTest {

    @Mock
    private ExchangeRateRepository exchangeRateRepository;

    @InjectMocks
    private CurrencyService currencyService;

    private User testUser;
    private ExchangeRate testRate;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setDefaultCurrency(Currency.USD);

        testRate = new ExchangeRate();
        testRate.setId(1L);
        testRate.setFromCurrency(Currency.USD);
        testRate.setToCurrency(Currency.EUR);
        testRate.setRate(new BigDecimal("0.85"));
        testRate.setValidFrom(LocalDateTime.now().minusHours(1));
        testRate.setSource("API");
    }

    @Test
    void getExchangeRate_directRateFound_returnsRate() {
        when(exchangeRateRepository.findLatestRate(eq(Currency.USD), eq(Currency.EUR), any(LocalDateTime.class)))
                .thenReturn(Optional.of(testRate));

        BigDecimal rate = currencyService.getExchangeRate(Currency.USD, Currency.EUR);

        assertEquals(new BigDecimal("0.85"), rate);
    }

    @Test
    void getExchangeRate_reverseRateFound_returnsReversed() {
        ExchangeRate reverseRate = new ExchangeRate();
        reverseRate.setFromCurrency(Currency.USD);
        reverseRate.setToCurrency(Currency.EUR);
        reverseRate.setRate(new BigDecimal("0.85"));
        reverseRate.setValidFrom(LocalDateTime.now().minusHours(1));
        reverseRate.setSource("API");

        when(exchangeRateRepository.findLatestRate(eq(Currency.EUR), eq(Currency.USD), any(LocalDateTime.class)))
                .thenReturn(Optional.empty());
        when(exchangeRateRepository.findLatestRate(eq(Currency.USD), eq(Currency.EUR), any(LocalDateTime.class)))
                .thenReturn(Optional.of(reverseRate));

        BigDecimal rate = currencyService.getExchangeRate(Currency.EUR, Currency.USD);

        assertNotNull(rate);
        assertTrue(rate.compareTo(BigDecimal.ONE) > 0);
    }

    @Test
    void getExchangeRate_noRateFound_throwsException() {
        when(exchangeRateRepository.findLatestRate(any(), any(), any()))
                .thenReturn(Optional.empty());

        assertThrows(BusinessLogicException.class, () ->
                currencyService.getExchangeRate(Currency.USD, Currency.EUR));
    }

    @Test
    void convert_sameCurrency_returnsSameAmount() {
        BigDecimal amount = new BigDecimal("100.00");

        BigDecimal result = currencyService.convert(amount, Currency.USD, Currency.USD);

        assertEquals(amount, result);
    }

    @Test
    void convert_differentCurrency_returnsConvertedAmount() {
        when(exchangeRateRepository.findLatestRate(eq(Currency.USD), eq(Currency.EUR), any(LocalDateTime.class)))
                .thenReturn(Optional.of(testRate));

        BigDecimal result = currencyService.convert(new BigDecimal("100.00"), Currency.USD, Currency.EUR);

        assertEquals(new BigDecimal("85.00"), result);
    }

    @Test
    void convert_zeroAmount_returnsZero() {
        when(exchangeRateRepository.findLatestRate(eq(Currency.USD), eq(Currency.EUR), any(LocalDateTime.class)))
                .thenReturn(Optional.of(testRate));

        BigDecimal result = currencyService.convert(BigDecimal.ZERO, Currency.USD, Currency.EUR);

        assertEquals(new BigDecimal("0.00"), result);
    }

    @Test
    void initializeExchangeRatesIfNeeded_ratesExist_skipsUpdate() {
        when(exchangeRateRepository.findCurrentRatesForCurrency(eq(Currency.USD), any(LocalDateTime.class)))
                .thenReturn(List.of(testRate));

        currencyService.initializeExchangeRatesIfNeeded();

        verify(exchangeRateRepository, never()).save(any());
    }

    @Test
    void getCurrentRates_returnsList() {
        when(exchangeRateRepository.findCurrentRatesForCurrency(any(), any()))
                .thenReturn(List.of(testRate));

        var rates = currencyService.getCurrentRates(Currency.USD);

        assertNotNull(rates);
        assertFalse(rates.isEmpty());
    }

    @Test
    void getCurrentRates_emptyList() {
        when(exchangeRateRepository.findCurrentRatesForCurrency(any(), any()))
                .thenReturn(List.of());

        var rates = currencyService.getCurrentRates(Currency.USD);

        assertTrue(rates.isEmpty());
    }

    @Test
    void getUserPreferences_returnsPreferences() {
        var prefs = currencyService.getUserPreferences(testUser);

        assertNotNull(prefs);
        assertEquals(Currency.USD, prefs.getDefaultCurrency());
    }

    @Test
    void getUserPreferences_withSecondaryCurrency() {
        testUser.setDisplaySecondaryCurrency(true);
        testUser.setSecondaryCurrency(Currency.EUR);

        var prefs = currencyService.getUserPreferences(testUser);

        assertNotNull(prefs);
        assertTrue(prefs.isDisplaySecondary());
        assertEquals(Currency.EUR, prefs.getSecondaryCurrency());
    }

    @Test
    void getAvailableCurrencies_returnsAllCurrencies() {
        var currencies = currencyService.getAvailableCurrencies();

        assertNotNull(currencies);
        assertFalse(currencies.isEmpty());
        assertEquals(Currency.values().length, currencies.size());
    }
}