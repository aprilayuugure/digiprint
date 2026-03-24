package com.spring.digiprint.dtos.responses;

import com.spring.digiprint.entities.Account;
import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class LoginResponse {
    private String token;

    private Long expiresIn;

    private String email;

    private String username;

    private String role;

    private Integer accountId;

    /** user_id (bảng users) — khớp {@code WorkResponse.creatorUserId} để xác định chủ work trên client. */
    private Integer userId;

    /** Ảnh đại diện từ User (URL/path lưu server); null nếu chưa có. */
    private String image;

    /** Độ dài mật khẩu (chỉ để hiển thị mask); null nếu chưa có. */
    private Integer passwordLength;

    /**
     * {@code username} là tên hiển thị trên profile User (giống {@code WorkResponse.creator}),
     * không phải email đăng nhập — để client so khớp chủ sở hữu work.
     */
    public LoginResponse(String token, Long expiresIn, Account a, String profileImage, String profileUsername, Integer profileUserId) {
        this.token = token;
        this.expiresIn = expiresIn;
        this.email = a.getEmail();
        this.username = profileUsername;
        this.role = a.getRole().name();
        this.accountId = a.getAccountId();
        this.userId = profileUserId;
        this.image = profileImage;
        this.passwordLength = a.getPasswordLength();
    }
}
