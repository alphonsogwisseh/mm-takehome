package com.memberregistry.api.service;

import com.memberregistry.api.dto.AnalyticsResponse;
import com.memberregistry.api.dto.CreateUserRequest;
import com.memberregistry.api.dto.FilterOptionsResponse;
import com.memberregistry.api.dto.MonthCount;
import com.memberregistry.api.dto.PagedResponse;
import com.memberregistry.api.dto.UserResponse;
import com.memberregistry.api.exception.DuplicateEmailException;
import com.memberregistry.api.exception.ResourceNotFoundException;
import com.memberregistry.api.model.User;
import com.memberregistry.api.repository.UserRepository;
import com.memberregistry.api.spec.UserSpecifications;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@Transactional(readOnly = true)
public class UserService {

    /** Negative size means return every matching row (used by the UI "All" page size). */
    private static final int ALL_PAGE_SIZE = -1;
    private static final int MAX_PAGE_SIZE = 100;

    private static final Set<String> SORTABLE_FIELDS = Set.of(
            "id",
            "firstName",
            "lastName",
            "email",
            "profession",
            "dateCreated",
            "country",
            "city");

    private static final Map<String, String> SORT_ALIASES = Map.of(
            "firstname", "firstName",
            "lastname", "lastName",
            "datecreated", "dateCreated");

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public PagedResponse<UserResponse> findUsers(
            String search,
            List<String> professions,
            List<String> countries,
            LocalDate dateCreatedFrom,
            LocalDate dateCreatedTo,
            int page,
            int size,
            String sort) {
        Specification<User> spec = UserSpecifications.withFilters(
                search,
                normalizeLabels(professions),
                normalizeLabels(countries),
                dateCreatedFrom,
                dateCreatedTo);
        Pageable pageable = toPageable(page, size, parseSort(sort));
        Page<User> result = userRepository.findAll(spec, pageable);
        List<UserResponse> content = result.getContent().stream().map(this::toResponse).toList();
        return new PagedResponse<>(
                content,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    public UserResponse findById(Long id) {
        return toResponse(requireUser(id));
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new DuplicateEmailException(request.email());
        }

        LocalDate dateCreated = request.dateCreated() != null ? request.dateCreated() : LocalDate.now();
        String profession = canonicalizeProfession(request.profession());
        String country = canonicalizeCountry(request.country());
        User user = new User(
                request.firstName().trim(),
                request.lastName().trim(),
                request.email().trim(),
                profession,
                dateCreated,
                country,
                request.city().trim());
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void delete(Long id) {
        User user = requireUser(id);
        userRepository.delete(user);
    }

    public FilterOptionsResponse filterOptions() {
        return new FilterOptionsResponse(
                dedupeIgnoreCase(userRepository.findDistinctProfessions()),
                dedupeIgnoreCase(userRepository.findDistinctCountries()));
    }

    public AnalyticsResponse analytics(List<String> professions, List<String> countries) {
        List<String> professionFilters = normalizeLabels(professions);
        List<String> countryFilters = normalizeLabels(countries);
        boolean professionsEmpty = professionFilters.isEmpty();
        boolean countriesEmpty = countryFilters.isEmpty();
        // JPQL IN () is invalid; pass a dummy value when the list is unused.
        Collection<String> professionParam = professionsEmpty ? List.of("__none__") : professionFilters;
        Collection<String> countryParam = countriesEmpty ? List.of("__none__") : countryFilters;

        List<MonthCount> sparseMonths =
                userRepository.countByMonth(professionsEmpty, professionParam, countriesEmpty, countryParam);

        return new AnalyticsResponse(
                userRepository.countScoped(professionsEmpty, professionParam, countriesEmpty, countryParam),
                userRepository.countDistinctProfessionsScoped(
                        professionsEmpty, professionParam, countriesEmpty, countryParam),
                userRepository.countDistinctCountriesScoped(
                        professionsEmpty, professionParam, countriesEmpty, countryParam),
                userRepository.countDistinctCitiesScoped(
                        professionsEmpty, professionParam, countriesEmpty, countryParam),
                userRepository.countByProfession(professionsEmpty, professionParam, countriesEmpty, countryParam),
                userRepository.countByCountry(professionsEmpty, professionParam, countriesEmpty, countryParam),
                userRepository.countByCity(professionsEmpty, professionParam, countriesEmpty, countryParam),
                gapFillMonths(sparseMonths),
                userRepository.countByYearAndProfession(
                        professionsEmpty, professionParam, countriesEmpty, countryParam),
                userRepository.countProfessionByCountry(
                        professionsEmpty, professionParam, countriesEmpty, countryParam));
    }

    private static List<String> normalizeLabels(List<String> values) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }
        return values.stream()
                .filter(StringUtils::hasText)
                .map(value -> value.trim().toLowerCase())
                .distinct()
                .toList();
    }

    /** Fills every month between the first and last observed signup so charts don't invent gaps. */
    static List<MonthCount> gapFillMonths(List<MonthCount> sparse) {
        if (sparse.isEmpty()) {
            return List.of();
        }

        Map<String, Long> counts = new HashMap<>();
        for (MonthCount entry : sparse) {
            counts.put(entry.year() + "-" + entry.month(), entry.count());
        }

        MonthCount first = sparse.get(0);
        MonthCount last = sparse.get(sparse.size() - 1);
        LocalDate cursor = LocalDate.of(first.year(), first.month(), 1);
        LocalDate end = LocalDate.of(last.year(), last.month(), 1);

        List<MonthCount> filled = new ArrayList<>();
        while (!cursor.isAfter(end)) {
            String key = cursor.getYear() + "-" + cursor.getMonthValue();
            filled.add(new MonthCount(cursor.getYear(), cursor.getMonthValue(), counts.getOrDefault(key, 0L)));
            cursor = cursor.plusMonths(1);
        }
        return filled;
    }

    private User requireUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getProfession(),
                user.getDateCreated(),
                user.getCountry(),
                user.getCity());
    }

    private Pageable toPageable(int page, int size, Sort sort) {
        if (size == ALL_PAGE_SIZE) {
            return Pageable.unpaged(sort);
        }
        return PageRequest.of(Math.max(page, 0), clampSize(size), sort);
    }

    private int clampSize(int size) {
        if (size < 1) {
            return 20;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }

    private Sort parseSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.ASC, "id");
        }

        String[] parts = sort.split(",", 2);
        String rawField = parts[0].trim();
        String normalized = SORT_ALIASES.getOrDefault(rawField.toLowerCase(), rawField);

        if (!SORTABLE_FIELDS.contains(normalized)) {
            throw new IllegalArgumentException(
                    "Sort field '" + rawField + "' is not allowed. Allowed: " + SORTABLE_FIELDS);
        }

        Sort.Direction direction = Sort.Direction.ASC;
        if (parts.length == 2 && parts[1].trim().equalsIgnoreCase("desc")) {
            direction = Sort.Direction.DESC;
        }
        return Sort.by(direction, normalized);
    }

    /** Reuse an existing profession's casing when the typed value only differs by case. */
    private String canonicalizeProfession(String value) {
        String trimmed = value.trim();
        return matchIgnoreCase(trimmed, userRepository.findDistinctProfessions())
                .orElse(trimmed.toLowerCase());
    }

    private String canonicalizeCountry(String value) {
        String trimmed = value.trim();
        return matchIgnoreCase(trimmed, userRepository.findDistinctCountries()).orElse(trimmed);
    }

    private static java.util.Optional<String> matchIgnoreCase(String value, List<String> existing) {
        return existing.stream().filter(item -> item.equalsIgnoreCase(value)).findFirst();
    }

    private static List<String> dedupeIgnoreCase(List<String> values) {
        Map<String, String> unique = new java.util.LinkedHashMap<>();
        for (String value : values) {
            unique.putIfAbsent(value.toLowerCase(), value);
        }
        return List.copyOf(unique.values());
    }
}
