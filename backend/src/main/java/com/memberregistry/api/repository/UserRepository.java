package com.memberregistry.api.repository;

import com.memberregistry.api.dto.CityCount;
import com.memberregistry.api.dto.LabelCount;
import com.memberregistry.api.dto.MatrixCell;
import com.memberregistry.api.dto.MonthCount;
import com.memberregistry.api.dto.YearProfessionCount;
import com.memberregistry.api.model.User;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    @Query("select distinct u.profession from User u order by u.profession")
    List<String> findDistinctProfessions();

    @Query("select distinct u.country from User u order by u.country")
    List<String> findDistinctCountries();

    @Query("""
            select count(u) from User u
            where (:professionsEmpty = true or lower(u.profession) in :professions)
              and (:countriesEmpty = true or lower(u.country) in :countries)
            """)
    long countScoped(
            @Param("professionsEmpty") boolean professionsEmpty,
            @Param("professions") Collection<String> professions,
            @Param("countriesEmpty") boolean countriesEmpty,
            @Param("countries") Collection<String> countries);

    @Query("""
            select count(distinct lower(u.profession)) from User u
            where (:professionsEmpty = true or lower(u.profession) in :professions)
              and (:countriesEmpty = true or lower(u.country) in :countries)
            """)
    int countDistinctProfessionsScoped(
            @Param("professionsEmpty") boolean professionsEmpty,
            @Param("professions") Collection<String> professions,
            @Param("countriesEmpty") boolean countriesEmpty,
            @Param("countries") Collection<String> countries);

    @Query("""
            select count(distinct lower(u.country)) from User u
            where (:professionsEmpty = true or lower(u.profession) in :professions)
              and (:countriesEmpty = true or lower(u.country) in :countries)
            """)
    int countDistinctCountriesScoped(
            @Param("professionsEmpty") boolean professionsEmpty,
            @Param("professions") Collection<String> professions,
            @Param("countriesEmpty") boolean countriesEmpty,
            @Param("countries") Collection<String> countries);

    @Query("""
            select count(distinct u.city) from User u
            where (:professionsEmpty = true or lower(u.profession) in :professions)
              and (:countriesEmpty = true or lower(u.country) in :countries)
            """)
    int countDistinctCitiesScoped(
            @Param("professionsEmpty") boolean professionsEmpty,
            @Param("professions") Collection<String> professions,
            @Param("countriesEmpty") boolean countriesEmpty,
            @Param("countries") Collection<String> countries);

    @Query("""
            select new com.memberregistry.api.dto.LabelCount(min(u.profession), count(u))
            from User u
            where (:professionsEmpty = true or lower(u.profession) in :professions)
              and (:countriesEmpty = true or lower(u.country) in :countries)
            group by lower(u.profession)
            order by count(u) desc, min(u.profession) asc
            """)
    List<LabelCount> countByProfession(
            @Param("professionsEmpty") boolean professionsEmpty,
            @Param("professions") Collection<String> professions,
            @Param("countriesEmpty") boolean countriesEmpty,
            @Param("countries") Collection<String> countries);

    @Query("""
            select new com.memberregistry.api.dto.LabelCount(min(u.country), count(u))
            from User u
            where (:professionsEmpty = true or lower(u.profession) in :professions)
              and (:countriesEmpty = true or lower(u.country) in :countries)
            group by lower(u.country)
            order by count(u) desc, min(u.country) asc
            """)
    List<LabelCount> countByCountry(
            @Param("professionsEmpty") boolean professionsEmpty,
            @Param("professions") Collection<String> professions,
            @Param("countriesEmpty") boolean countriesEmpty,
            @Param("countries") Collection<String> countries);

    @Query("""
            select new com.memberregistry.api.dto.CityCount(u.city, u.country, count(u))
            from User u
            where (:professionsEmpty = true or lower(u.profession) in :professions)
              and (:countriesEmpty = true or lower(u.country) in :countries)
            group by u.city, u.country
            order by count(u) desc, u.city asc
            """)
    List<CityCount> countByCity(
            @Param("professionsEmpty") boolean professionsEmpty,
            @Param("professions") Collection<String> professions,
            @Param("countriesEmpty") boolean countriesEmpty,
            @Param("countries") Collection<String> countries);

    @Query("""
            select new com.memberregistry.api.dto.MonthCount(
                year(u.dateCreated), month(u.dateCreated), count(u))
            from User u
            where (:professionsEmpty = true or lower(u.profession) in :professions)
              and (:countriesEmpty = true or lower(u.country) in :countries)
            group by year(u.dateCreated), month(u.dateCreated)
            order by year(u.dateCreated) asc, month(u.dateCreated) asc
            """)
    List<MonthCount> countByMonth(
            @Param("professionsEmpty") boolean professionsEmpty,
            @Param("professions") Collection<String> professions,
            @Param("countriesEmpty") boolean countriesEmpty,
            @Param("countries") Collection<String> countries);

    @Query("""
            select new com.memberregistry.api.dto.YearProfessionCount(
                year(u.dateCreated), min(u.profession), count(u))
            from User u
            where (:professionsEmpty = true or lower(u.profession) in :professions)
              and (:countriesEmpty = true or lower(u.country) in :countries)
            group by year(u.dateCreated), lower(u.profession)
            order by year(u.dateCreated) asc, count(u) desc
            """)
    List<YearProfessionCount> countByYearAndProfession(
            @Param("professionsEmpty") boolean professionsEmpty,
            @Param("professions") Collection<String> professions,
            @Param("countriesEmpty") boolean countriesEmpty,
            @Param("countries") Collection<String> countries);

    @Query("""
            select new com.memberregistry.api.dto.MatrixCell(min(u.country), min(u.profession), count(u))
            from User u
            where (:professionsEmpty = true or lower(u.profession) in :professions)
              and (:countriesEmpty = true or lower(u.country) in :countries)
            group by lower(u.country), lower(u.profession)
            order by count(u) desc
            """)
    List<MatrixCell> countProfessionByCountry(
            @Param("professionsEmpty") boolean professionsEmpty,
            @Param("professions") Collection<String> professions,
            @Param("countriesEmpty") boolean countriesEmpty,
            @Param("countries") Collection<String> countries);
}
