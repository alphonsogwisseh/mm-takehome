package com.memberregistry.api;

import static org.assertj.core.api.Assertions.assertThat;

import com.memberregistry.api.dto.CreateUserRequest;
import com.memberregistry.api.dto.UserResponse;
import com.memberregistry.api.repository.UserRepository;
import com.memberregistry.api.service.UserService;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class MemberRegistryApplicationTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Test
    void seederLoadsExactlyOneThousandUsers() {
        assertThat(userRepository.count()).isEqualTo(1000L);
    }

    @Test
    void createdUserReceivesIdAboveSeededRange() {
        UserResponse created = userService.create(new CreateUserRequest(
                "Grace",
                "Hopper",
                "grace.hopper." + System.nanoTime() + "@example.com",
                "developer",
                LocalDate.of(2024, 6, 1),
                "United States",
                "New York"));

        assertThat(created.id()).isGreaterThan(1099L);
    }
}
