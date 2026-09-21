package com.memberregistry.api.controller;

import com.memberregistry.api.dto.AnalyticsResponse;
import com.memberregistry.api.dto.CreateUserRequest;
import com.memberregistry.api.dto.FilterOptionsResponse;
import com.memberregistry.api.dto.PagedResponse;
import com.memberregistry.api.dto.UserResponse;
import com.memberregistry.api.service.UserService;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public PagedResponse<UserResponse> listUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) List<String> profession,
            @RequestParam(required = false) List<String> country,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateCreatedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateCreatedTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id,asc") String sort) {
        return userService.findUsers(
                search, profession, country, dateCreatedFrom, dateCreatedTo, page, size, sort);
    }

    @GetMapping("/filters")
    public FilterOptionsResponse filterOptions() {
        return userService.filterOptions();
    }

    @GetMapping("/analytics")
    public AnalyticsResponse analytics(
            @RequestParam(required = false) List<String> profession,
            @RequestParam(required = false) List<String> country) {
        return userService.analytics(profession, country);
    }

    @GetMapping("/{id:\\d+}")
    public UserResponse getUser(@PathVariable Long id) {
        return userService.findById(id);
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse created = userService.create(request);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.id())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @DeleteMapping("/{id:\\d+}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable Long id) {
        userService.delete(id);
    }
}
