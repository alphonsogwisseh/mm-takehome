package com.memberregistry.api.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.memberregistry.api.dto.CreateUserRequest;
import com.memberregistry.api.dto.FilterOptionsResponse;
import com.memberregistry.api.dto.PagedResponse;
import com.memberregistry.api.dto.UserResponse;
import com.memberregistry.api.exception.DuplicateEmailException;
import com.memberregistry.api.exception.GlobalExceptionHandler;
import com.memberregistry.api.exception.ResourceNotFoundException;
import com.memberregistry.api.service.UserService;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = UserController.class)
@Import(GlobalExceptionHandler.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    private final UserResponse sample = new UserResponse(
            100L,
            "Andree",
            "Flita",
            "Andree.Flita@gmail.com",
            "worker",
            LocalDate.of(2020, 8, 31),
            "Wallis and Futuna",
            "Nanjing");

    @Test
    void listUsersReturnsPagedPayload() throws Exception {
        when(userService.findUsers(isNull(), isNull(), isNull(), isNull(), isNull(), eq(0), eq(20), eq("id,asc")))
                .thenReturn(new PagedResponse<>(List.of(sample), 0, 20, 1, 1));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].firstName").value("Andree"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void getUserReturnsUser() throws Exception {
        when(userService.findById(100L)).thenReturn(sample);

        mockMvc.perform(get("/api/users/100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("Andree.Flita@gmail.com"));
    }

    @Test
    void getUserReturns404WhenMissing() throws Exception {
        when(userService.findById(9999L)).thenThrow(new ResourceNotFoundException("User not found with id 9999"));

        mockMvc.perform(get("/api/users/9999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Not Found"));
    }

    @Test
    void createUserReturns201WithLocation() throws Exception {
        UserResponse created = new UserResponse(
                1100L,
                "Ada",
                "Lovelace",
                "ada@example.com",
                "developer",
                LocalDate.of(2024, 1, 1),
                "United Kingdom",
                "London");
        when(userService.create(any(CreateUserRequest.class))).thenReturn(created);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "firstName": "Ada",
                                  "lastName": "Lovelace",
                                  "email": "ada@example.com",
                                  "profession": "developer",
                                  "dateCreated": "2024-01-01",
                                  "country": "United Kingdom",
                                  "city": "London"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", org.hamcrest.Matchers.containsString("/api/users/1100")))
                .andExpect(jsonPath("$.id").value(1100));
    }

    @Test
    void createUserReturns400WhenInvalid() throws Exception {
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "firstName": "",
                                  "lastName": "Lovelace",
                                  "email": "not-an-email",
                                  "profession": "developer",
                                  "country": "United Kingdom",
                                  "city": "London"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation Failed"));
    }

    @Test
    void createUserReturns409OnDuplicateEmail() throws Exception {
        when(userService.create(any(CreateUserRequest.class)))
                .thenThrow(new DuplicateEmailException("ada@example.com"));

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "firstName": "Ada",
                                  "lastName": "Lovelace",
                                  "email": "ada@example.com",
                                  "profession": "developer",
                                  "country": "United Kingdom",
                                  "city": "London"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Conflict"));
    }

    @Test
    void deleteUserReturns204() throws Exception {
        doNothing().when(userService).delete(100L);

        mockMvc.perform(delete("/api/users/100"))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteUserReturns404WhenMissing() throws Exception {
        doThrow(new ResourceNotFoundException("User not found with id 9999"))
                .when(userService).delete(9999L);

        mockMvc.perform(delete("/api/users/9999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void filterOptionsReturnsLists() throws Exception {
        when(userService.filterOptions())
                .thenReturn(new FilterOptionsResponse(List.of("doctor"), List.of("Canada")));

        mockMvc.perform(get("/api/users/filters"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.professions[0]").value("doctor"))
                .andExpect(jsonPath("$.countries[0]").value("Canada"));
    }

    @Test
    void invalidSortReturns400() throws Exception {
        when(userService.findUsers(any(), any(), any(), any(), any(), anyInt(), anyInt(), anyString()))
                .thenThrow(new IllegalArgumentException("Sort field 'hack' is not allowed"));

        mockMvc.perform(get("/api/users").param("sort", "hack,asc"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void analyticsEndpointDelegatesToService() throws Exception {
        when(userService.analytics(isNull(), isNull()))
                .thenReturn(new com.memberregistry.api.dto.AnalyticsResponse(
                        2,
                        1,
                        1,
                        1,
                        java.util.List.of(new com.memberregistry.api.dto.LabelCount("doctor", 2L)),
                        java.util.List.of(new com.memberregistry.api.dto.LabelCount("Canada", 2L)),
                        java.util.List.of(new com.memberregistry.api.dto.CityCount("Toronto", "Canada", 2L)),
                        java.util.List.of(new com.memberregistry.api.dto.MonthCount(2020, 1, 2L)),
                        java.util.List.of(),
                        java.util.List.of()));

        mockMvc.perform(get("/api/users/analytics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").value(2))
                .andExpect(jsonPath("$.byProfession[0].label").value("doctor"));
    }
}
