package com.memberregistry.api.dto;

import java.util.List;

public record FilterOptionsResponse(List<String> professions, List<String> countries) {
}
