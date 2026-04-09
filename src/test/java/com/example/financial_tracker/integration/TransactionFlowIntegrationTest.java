package com.example.financial_tracker.integration;

import com.example.financial_tracker.BaseIntegrationTest;
import com.example.financial_tracker.dto.AuthRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@org.junit.jupiter.api.Tag("integration")
class TransactionFlowIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String authToken;

    @BeforeEach
    void setUp() throws Exception {
        AuthRequest registerRequest = new AuthRequest();
        registerRequest.setName("Transaction User");
        registerRequest.setEmail("tx-" + System.nanoTime() + "@example.com");
        registerRequest.setPassword("Password123");

        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().is2xxSuccessful())
                .andReturn();

        authToken = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("token").asText();
    }

    @Test
    void createCategory_thenCreateTransaction_thenGetDashboard() throws Exception {
        // Create category
        MvcResult categoryResult = mockMvc.perform(post("/api/v1/categories")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Food",
                                "color", "#ff0000",
                                "type", "EXPENSE"
                        ))))
                .andExpect(status().is2xxSuccessful())
                .andExpect(jsonPath("$.name").value("Food"))
                .andReturn();

        Long categoryId = objectMapper.readTree(categoryResult.getResponse().getContentAsString())
                .get("id").asLong();

        // Create transaction
        mockMvc.perform(post("/api/v1/transactions")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "amount", 50.00,
                                "type", "EXPENSE",
                                "categoryId", categoryId,
                                "date", "2026-04-09",
                                "description", "Lunch"
                        ))))
                .andExpect(status().is2xxSuccessful())
                .andExpect(jsonPath("$.amount").value(50.00));

        // Get dashboard
        mockMvc.perform(get("/api/v1/dashboard")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().is2xxSuccessful());

        // Get transactions
        mockMvc.perform(get("/api/v1/transactions")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().is2xxSuccessful());
    }

    @Test
    void createAndDeleteTransaction() throws Exception {
        // Create category first
        MvcResult categoryResult = mockMvc.perform(post("/api/v1/categories")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Transport",
                                "color", "#00ff00",
                                "type", "EXPENSE"
                        ))))
                .andExpect(status().is2xxSuccessful())
                .andReturn();

        Long categoryId = objectMapper.readTree(categoryResult.getResponse().getContentAsString())
                .get("id").asLong();

        // Create transaction
        MvcResult txResult = mockMvc.perform(post("/api/v1/transactions")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "amount", 30.00,
                                "type", "EXPENSE",
                                "categoryId", categoryId,
                                "date", "2026-04-09",
                                "description", "Bus"
                        ))))
                .andExpect(status().is2xxSuccessful())
                .andReturn();

        Long txId = objectMapper.readTree(txResult.getResponse().getContentAsString())
                .get("id").asLong();

        // Delete transaction
        mockMvc.perform(delete("/api/v1/transactions/" + txId)
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().is2xxSuccessful());
    }

    @Test
    void createIncomeTransaction() throws Exception {
        MvcResult categoryResult = mockMvc.perform(post("/api/v1/categories")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Salary",
                                "color", "#0000ff",
                                "type", "INCOME"
                        ))))
                .andExpect(status().is2xxSuccessful())
                .andReturn();

        Long categoryId = objectMapper.readTree(categoryResult.getResponse().getContentAsString())
                .get("id").asLong();

        mockMvc.perform(post("/api/v1/transactions")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "amount", 5000.00,
                                "type", "INCOME",
                                "categoryId", categoryId,
                                "date", "2026-04-09",
                                "description", "Monthly salary"
                        ))))
                .andExpect(status().is2xxSuccessful())
                .andExpect(jsonPath("$.type").value("INCOME"))
                .andExpect(jsonPath("$.amount").value(5000.00));
    }
}
