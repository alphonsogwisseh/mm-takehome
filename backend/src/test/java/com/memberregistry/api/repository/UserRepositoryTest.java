package com.memberregistry.api.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.memberregistry.api.model.User;
import com.memberregistry.api.spec.UserSpecifications;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        userRepository.save(new User(
                "Andree", "Flita", "Andree.Flita@gmail.com", "worker",
                LocalDate.of(2020, 8, 31), "Wallis and Futuna", "Nanjing"));
        userRepository.save(new User(
                "Di", "Lauraine", "Di.Lauraine@gmail.com", "developer",
                LocalDate.of(2021, 3, 20), "United Kingdom", "Chennai"));
        userRepository.save(new User(
                "Marline", "Clie", "Marline.Clie@gmail.com", "doctor",
                LocalDate.of(2020, 3, 30), "Hong Kong", "Dongguan"));
        userRepository.save(new User(
                "Lanae", "Salvidor", "Lanae.Salvidor@gmail.com", "doctor",
                LocalDate.of(2022, 7, 18), "AndorrA", "Banjul"));
    }

    @Test
    void searchMatchesFirstNameLastNameOrEmail() {
        Specification<User> spec = UserSpecifications.withFilters("clie", null, null, null, null);
        List<User> results = userRepository.findAll(spec);
        assertThat(results).extracting(User::getLastName).containsExactly("Clie");
    }

    @Test
    void professionFilterIsCaseInsensitive() {
        Specification<User> spec = UserSpecifications.withFilters(
                null, List.of("DOCTOR"), null, null, null);
        List<User> results = userRepository.findAll(spec);
        assertThat(results).hasSize(2);
        assertThat(results).allMatch(user -> user.getProfession().equalsIgnoreCase("doctor"));
    }

    @Test
    void countryFilterIsCaseInsensitive() {
        Specification<User> spec = UserSpecifications.withFilters(
                null, null, List.of("andorra"), null, null);
        List<User> results = userRepository.findAll(spec);
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getEmail()).isEqualTo("Lanae.Salvidor@gmail.com");
    }

    @Test
    void countryFilterAcceptsMultipleCountries() {
        Specification<User> spec = UserSpecifications.withFilters(
                null, null, List.of("united kingdom", "Hong Kong"), null, null);
        List<User> results = userRepository.findAll(spec);
        assertThat(results).extracting(User::getEmail)
                .containsExactlyInAnyOrder("Di.Lauraine@gmail.com", "Marline.Clie@gmail.com");
    }

    @Test
    void dateCreatedRangeFilter() {
        Specification<User> spec = UserSpecifications.withFilters(
                null, null, null, LocalDate.of(2020, 8, 1), LocalDate.of(2021, 12, 31));
        List<User> results = userRepository.findAll(spec);
        assertThat(results).extracting(User::getEmail)
                .containsExactlyInAnyOrder("Andree.Flita@gmail.com", "Di.Lauraine@gmail.com");
    }

    @Test
    void analyticsCountsGroupByProfession() {
        userRepository.save(new User(
                "Casey", "Case", "Casey.Case@gmail.com", "Developer",
                LocalDate.of(2023, 1, 1), "Canada", "Toronto"));

        var byProfession =
                userRepository.countByProfession(true, List.of("__none__"), true, List.of("__none__"));
        assertThat(byProfession).hasSize(3);
        assertThat(byProfession)
                .filteredOn(entry -> entry.label().equalsIgnoreCase("developer"))
                .singleElement()
                .satisfies(entry -> assertThat(entry.count()).isEqualTo(2L));
        assertThat(byProfession)
                .filteredOn(entry -> entry.label().equalsIgnoreCase("doctor"))
                .singleElement()
                .satisfies(entry -> assertThat(entry.count()).isEqualTo(2L));
        assertThat(userRepository.countScoped(true, List.of("__none__"), false, List.of("united kingdom")))
                .isEqualTo(1);
        assertThat(userRepository.countByCity(true, List.of("__none__"), false, List.of("united kingdom")))
                .extracting(com.memberregistry.api.dto.CityCount::city)
                .containsExactly("Chennai");
    }

    @Test
    void combinedFiltersAndSort() {
        Specification<User> spec = UserSpecifications.withFilters(
                null, List.of("doctor"), null, null, null);
        Page<User> page = userRepository.findAll(
                spec,
                PageRequest.of(0, 10, Sort.by(Sort.Direction.ASC, "lastName")));
        assertThat(page.getContent()).extracting(User::getLastName).containsExactly("Clie", "Salvidor");
    }

    @Test
    void distinctFilterOptions() {
        assertThat(userRepository.findDistinctProfessions())
                .containsExactly("developer", "doctor", "worker");
        assertThat(userRepository.findDistinctCountries()).hasSize(4);
    }
}
