package com.spring.digiprint.services;

import com.spring.digiprint.enums.*;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface FileStorageService {
    public String saveFile(MultipartFile file, Genre genre, Integer workId) throws IOException;

    public Resource loadFile(Genre genre, String filename);

    public void deleteFile(Genre genre, Integer workId, String filename);

    public String saveUserFile(MultipartFile file, UserMediaType type, Integer userId) throws IOException;

    public Resource loadUserFile(UserMediaType type, Integer userId, String extension);

    void deleteUserFile(UserMediaType type, Integer userId);

    /**
     * Lưu file đính kèm cho order item (upload trước khi tạo order JSON).
     * Trả về path tương đối (vd. {@code /storage/orders/pending/1/uuid.png}) để đưa vào {@code OrderItemRequest.attachedImages}.
     */
    String savePendingOrderAttachment(MultipartFile file, Integer accountId) throws IOException;

    /**
     * File sản phẩm hoàn thành do artist upload (nhiều loại extension được phép).
     * Trả về path dạng {@code /storage/orders/deliverables/{orderItemId}/...}.
     */
    String saveOrderItemCompletedDeliverable(MultipartFile file, Integer orderItemId) throws IOException;

    /**
     * Lưu đính kèm commission trực tiếp dưới {@code commissions/{commissionId}/} (không có thư mục pending).
     * Trả về path dạng {@code /storage/commissions/{commissionId}/uuid.ext}.
     */
    String saveCommissionAttachment(MultipartFile file, Genre genre, Integer commissionId) throws IOException;

    /** Xóa file trong {@code storage/} từ path public dạng {@code /storage/...}. */
    void deleteByPublicStoragePath(String publicPath);
}
