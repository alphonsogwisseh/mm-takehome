package com.memberregistry.api.spec;

import com.memberregistry.api.model.User;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public final class UserSpecifications {

    private UserSpecifications() {
    }

    public static Specification<User> withFilters(
            String search,
            Collection<String> professions,
            Collection<String> countries,
            LocalDate dateCreatedFrom,
            LocalDate dateCreatedTo) {
        return Specification
                .where(searchContains(search))
                .and(hasProfessions(professions))
                .and(hasCountries(countries))
                .and(dateCreatedOnOrAfter(dateCreatedFrom))
                .and(dateCreatedOnOrBefore(dateCreatedTo));
    }

    public static Specification<User> searchContains(String search) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(search)) {
                return cb.conjunction();
            }
            String pattern = "%" + search.trim().toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("firstName")), pattern),
                    cb.like(cb.lower(root.get("lastName")), pattern),
                    cb.like(cb.lower(root.get("email")), pattern));
        };
    }

    public static Specification<User> hasProfessions(Collection<String> professions) {
        return (root, query, cb) -> {
            if (professions == null || professions.isEmpty()) {
                return cb.conjunction();
            }
            List<String> normalized = professions.stream()
                    .filter(StringUtils::hasText)
                    .map(value -> value.trim().toLowerCase())
                    .distinct()
                    .toList();
            if (normalized.isEmpty()) {
                return cb.conjunction();
            }
            return cb.lower(root.get("profession")).in(normalized);
        };
    }

    public static Specification<User> hasCountries(Collection<String> countries) {
        return (root, query, cb) -> {
            if (countries == null || countries.isEmpty()) {
                return cb.conjunction();
            }
            List<String> normalized = countries.stream()
                    .filter(StringUtils::hasText)
                    .map(value -> value.trim().toLowerCase())
                    .distinct()
                    .toList();
            if (normalized.isEmpty()) {
                return cb.conjunction();
            }
            return cb.lower(root.get("country")).in(normalized);
        };
    }

    public static Specification<User> dateCreatedOnOrAfter(LocalDate from) {
        return (root, query, cb) -> {
            if (from == null) {
                return cb.conjunction();
            }
            return cb.greaterThanOrEqualTo(root.get("dateCreated"), from);
        };
    }

    public static Specification<User> dateCreatedOnOrBefore(LocalDate to) {
        return (root, query, cb) -> {
            if (to == null) {
                return cb.conjunction();
            }
            return cb.lessThanOrEqualTo(root.get("dateCreated"), to);
        };
    }
}
