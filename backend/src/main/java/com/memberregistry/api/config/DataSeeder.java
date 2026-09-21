package com.memberregistry.api.config;

import com.memberregistry.api.repository.UserRepository;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String CSV_PATH = "UserInformation.csv";
    private static final String INSERT_SQL = """
            INSERT INTO users (id, first_name, last_name, email, profession, date_created, country, city)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """;

    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    public DataSeeder(UserRepository userRepository, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        if (userRepository.count() > 0) {
            log.info("Users already present; skipping CSV seed");
            return;
        }

        List<Object[]> rows = readCsvRows();
        if (rows.isEmpty()) {
            log.warn("CSV contained no user rows");
            return;
        }

        jdbcTemplate.batchUpdate(INSERT_SQL, rows);

        long maxId = rows.stream()
                .mapToLong(row -> ((Number) row[0]).longValue())
                .max()
                .orElse(0L);

        jdbcTemplate.update("ALTER TABLE users ALTER COLUMN id RESTART WITH " + (maxId + 1));

        log.info("Seeded {} users from {}; identity restarts at {}", rows.size(), CSV_PATH, maxId + 1);
    }

    private List<Object[]> readCsvRows() throws Exception {
        ClassPathResource resource = new ClassPathResource(CSV_PATH);
        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreEmptyLines(true)
                .setTrim(true)
                .build();

        List<Object[]> rows = new ArrayList<>();
        try (Reader reader = new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8);
             CSVParser parser = format.parse(reader)) {
            for (CSVRecord record : parser) {
                rows.add(new Object[] {
                        Long.parseLong(record.get("id")),
                        record.get("firstname"),
                        record.get("lastname"),
                        record.get("email"),
                        record.get("profession"),
                        Date.valueOf(LocalDate.parse(record.get("dateCreated"))),
                        record.get("country"),
                        record.get("city")
                });
            }
        }
        return rows;
    }
}
