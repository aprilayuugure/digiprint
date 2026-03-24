package com.spring.digiprint.dtos.responses;

import com.spring.digiprint.entities.Commission;
import com.spring.digiprint.entities.CommissionSnapshot;
import com.spring.digiprint.entities.OrderItem;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class OrderItemResponse {

    private Integer orderItemId;

    private Integer commissionId;

    /** Loại commission (dropdown / hiển thị). */
    private String commissionType;

    /** Genre của commission — quy định loại file đính kèm phía client. */
    private String genre;

    /** Đơn giá snapshot tại thời điểm đặt đơn/chỉnh draft. */
    private Integer unitPrice;

    /** Thành tiền dòng: unitPrice × quantity. */
    private Integer lineTotal;

    private Integer quantity;

    private String orderDescription;

    /** Đường dẫn file mẫu khách đính kèm khi đặt (samples). */
    private List<String> attachedImages;

    /** File sản phẩm hoàn thành do artist gửi (read-only cho khách; chỉ artist cập nhật). */
    private List<String> completedDeliverables;

    /** Username artist của commission (dòng này) — để UI biết ai được upload deliverables. */
    private String commissionArtistUsername;

    public OrderItemResponse(OrderItem item) {
        this.orderItemId = item.getOrderItemId();
        this.quantity = item.getQuantity();
        this.orderDescription = item.getOrderDescription();
        this.attachedImages = item.getAttachedImages();
        this.completedDeliverables = item.getCompletedDeliverables();

        // Ưu tiên snapshot để giữ nguyên dữ liệu orders cũ sau khi commission bị chỉnh sửa.
        CommissionSnapshot snapshot = item.getCommissionSnapshot();
        if (snapshot != null) {
            this.commissionType = snapshot.getCommissionType();
            this.genre = snapshot.getGenre();
            this.unitPrice = snapshot.getUnitPrice();
        }

        Commission c = item.getCommission();
        if (c != null) {
            this.commissionId = c.getCommissionId();
            if (this.commissionType == null || this.commissionType.isBlank()) {
                this.commissionType = c.getCommissionType();
            }
            if (this.unitPrice == null) {
                this.unitPrice = c.getCommissionPrice();
            }
            if ((this.genre == null || this.genre.isBlank()) && c.getGenre() != null) {
                this.genre = c.getGenre().name();
            }
            if (c.getUser() != null) {
                this.commissionArtistUsername = c.getUser().getUsername();
            }
        }
        if (this.unitPrice != null && this.quantity > 0) {
            this.lineTotal = this.unitPrice * this.quantity;
        }
    }
}

