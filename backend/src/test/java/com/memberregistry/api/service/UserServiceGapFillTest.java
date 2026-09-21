package com.memberregistry.api.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.memberregistry.api.dto.MonthCount;
import java.util.List;
import org.junit.jupiter.api.Test;

class UserServiceGapFillTest {

    @Test
    void gapFillInsertsZeroMonthsBetweenEnds() {
        List<MonthCount> sparse = List.of(
                new MonthCount(2020, 1, 4L),
                new MonthCount(2020, 3, 5L));

        List<MonthCount> filled = UserService.gapFillMonths(sparse);

        assertThat(filled).containsExactly(
                new MonthCount(2020, 1, 4L),
                new MonthCount(2020, 2, 0L),
                new MonthCount(2020, 3, 5L));
    }

    @Test
    void gapFillReturnsEmptyForEmptyInput() {
        assertThat(UserService.gapFillMonths(List.of())).isEmpty();
    }
}
