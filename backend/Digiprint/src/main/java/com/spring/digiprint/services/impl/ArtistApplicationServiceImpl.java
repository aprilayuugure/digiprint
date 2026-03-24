package com.spring.digiprint.services.impl;

import com.spring.digiprint.dtos.requests.ApplyToArtistRequest;
import com.spring.digiprint.dtos.requests.UpdateArtistApplicationStatusRequest;
import com.spring.digiprint.dtos.responses.ArtistApplicationResponse;
import com.spring.digiprint.entities.Account;
import com.spring.digiprint.entities.ArtistApplication;
import com.spring.digiprint.entities.User;
import com.spring.digiprint.enums.ArtistApplicationStatus;
import com.spring.digiprint.enums.Role;
import com.spring.digiprint.repositories.AccountRepository;
import com.spring.digiprint.repositories.ArtistApplicationRepository;
import com.spring.digiprint.repositories.UserRepository;
import com.spring.digiprint.services.ArtistApplicationService;
import com.spring.digiprint.utils.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
@Service
public class ArtistApplicationServiceImpl implements ArtistApplicationService {

    private static final int MAX_MESSAGE_LEN = 2000;

    private final ArtistApplicationRepository applicationRepo;
    private final AccountRepository accountRepo;
    private final UserRepository userRepo;

    @Override
    @Transactional
    public ArtistApplicationResponse submitApplication(ApplyToArtistRequest request) {
        Integer accountId = SecurityUtil.getCurrentUserId();
        Account account = accountRepo.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        if (account.getRole() == Role.ARTIST) {
            throw new IllegalStateException("Tài khoản đã là nghệ sĩ");
        }
        if (account.getRole() == Role.ADMIN) {
            throw new IllegalStateException("Admin không cần gửi đơn trở thành nghệ sĩ");
        }
        if (account.getRole() != Role.USER) {
            throw new IllegalStateException("Chỉ tài khoản USER mới có thể gửi đơn");
        }

        if (applicationRepo.existsByAccount_AccountIdAndStatus(accountId, ArtistApplicationStatus.PENDING)) {
            throw new IllegalStateException("Bạn đã có đơn đang chờ duyệt");
        }

        String message = resolveApplicantText(request);
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Reason is required");
        }
        message = truncate(message.trim(), MAX_MESSAGE_LEN);

        ArtistApplication app = new ArtistApplication();
        app.setAccount(account);
        app.setStatus(ArtistApplicationStatus.PENDING);
        app.setReason(message);
        app.setRequestedAt(LocalDateTime.now());

        applicationRepo.save(app);

        return ArtistApplicationResponse.from(app, resolveUsername(accountId));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ArtistApplicationResponse> getMyLatestApplication() {
        Integer accountId = SecurityUtil.getCurrentUserId();
        return applicationRepo.findFirstByAccount_AccountIdOrderByRequestedAtDesc(accountId)
                .map(a -> ArtistApplicationResponse.from(a, resolveUsername(accountId)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ArtistApplicationResponse> listForAdmin(ArtistApplicationStatus status) {
        List<ArtistApplication> list = status == null
                ? applicationRepo.findAllByOrderByRequestedAtDesc()
                : applicationRepo.findByStatusOrderByRequestedAtDesc(status);
        return list.stream()
                .map(a -> ArtistApplicationResponse.from(a, resolveUsername(a.getAccount().getAccountId())))
                .toList();
    }

    @Override
    @Transactional
    public ArtistApplicationResponse updateApplicationStatus(
            Integer applicationId,
            UpdateArtistApplicationStatusRequest request) {
        ArtistApplicationStatus newStatus = request.getStatus();
        if (newStatus == ArtistApplicationStatus.PENDING) {
            throw new IllegalArgumentException("Chỉ được đặt status APPROVED hoặc REJECTED");
        }

        ArtistApplication app = applicationRepo.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn"));

        if (app.getStatus() != ArtistApplicationStatus.PENDING) {
            throw new IllegalStateException("Đơn không ở trạng thái chờ duyệt");
        }

        if (newStatus == ArtistApplicationStatus.APPROVED) {
            Account account = accountRepo.findById(app.getAccount().getAccountId())
                    .orElseThrow(() -> new IllegalArgumentException("Account not found"));

            if (account.getRole() != Role.USER) {
                throw new IllegalStateException(
                        "Chỉ có thể duyệt đơn của tài khoản USER (role hiện tại: " + account.getRole() + ")");
            }

            account.setRole(Role.ARTIST);
            accountRepo.save(account);

            app.setStatus(ArtistApplicationStatus.APPROVED);
            app.setProcessedAt(LocalDateTime.now());
            applicationRepo.save(app);

            return ArtistApplicationResponse.from(app, resolveUsername(account.getAccountId()));
        }

        // REJECTED
        app.setStatus(ArtistApplicationStatus.REJECTED);
        app.setProcessedAt(LocalDateTime.now());
        applicationRepo.save(app);

        return ArtistApplicationResponse.from(app, resolveUsername(app.getAccount().getAccountId()));
    }

    private String resolveUsername(Integer accountId) {
        return userRepo.findByAccount_AccountId(accountId)
                .map(User::getUsername)
                .orElse(null);
    }

    private static String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max);
    }

    /** Ưu tiên {@code reason}, sau đó {@code message} (legacy). */
    private static String resolveApplicantText(ApplyToArtistRequest request) {
        if (request == null) {
            return null;
        }
        if (request.getReason() != null && !request.getReason().isBlank()) {
            return request.getReason();
        }
        if (request.getMessage() != null && !request.getMessage().isBlank()) {
            return request.getMessage();
        }
        return null;
    }
}
