package com.spring.digiprint.dtos.requests;

import java.util.List;

/**
 * Cập nhật danh sách file sản phẩm hoàn thành (chỉ artist/admin).
 */
public record OrderCompletedDeliverablesRequest(List<String> paths) {}
