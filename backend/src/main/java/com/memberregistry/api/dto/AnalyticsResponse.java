package com.memberregistry.api.dto;

import java.util.List;

/**
 * Aggregated view of the directory. Every list is already sorted for display, and
 * {@code byMonth} is gap-filled so a timeline can be drawn without client-side guesswork.
 */
public record AnalyticsResponse(
        long totalUsers,
        int professionCount,
        int countryCount,
        int cityCount,
        List<LabelCount> byProfession,
        List<LabelCount> byCountry,
        List<CityCount> byCity,
        List<MonthCount> byMonth,
        List<YearProfessionCount> byYearAndProfession,
        List<MatrixCell> professionByCountry) {
}
