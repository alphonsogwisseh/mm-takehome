package com.memberregistry.api.dto;

import java.time.LocalDate;

public record UserResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String profession,
        LocalDate dateCreated,
        String country,
        String city) {
}
