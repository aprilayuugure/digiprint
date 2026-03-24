package com.spring.digiprint.services.impl;

import com.spring.digiprint.dtos.requests.CommissionRequest;
import com.spring.digiprint.dtos.responses.CommissionResponse;
import com.spring.digiprint.entities.Account;
import com.spring.digiprint.entities.Commission;
import com.spring.digiprint.entities.Sample;
import com.spring.digiprint.entities.User;
import com.spring.digiprint.enums.Genre;
import com.spring.digiprint.enums.OrderStatus;
import com.spring.digiprint.enums.Role;
import com.spring.digiprint.repositories.AccountRepository;
import com.spring.digiprint.repositories.CommissionRepository;
import com.spring.digiprint.repositories.OrderItemRepository;
import com.spring.digiprint.repositories.UserRepository;
import com.spring.digiprint.services.CommissionService;
import com.spring.digiprint.services.FileStorageService;
import com.spring.digiprint.utils.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

@Transactional
@RequiredArgsConstructor
@Service
public class CommissionServiceImpl implements CommissionService {

    private final CommissionRepository commissionRepo;
    private final UserRepository userRepo;
    private final OrderItemRepository orderItemRepo;
    private final AccountRepository accountRepo;
    private final FileStorageService fileStorageService;

    private void assertArtistOrAdmin() {
        Integer accountId = SecurityUtil.getCurrentUserId();
        Account me = accountRepo.findById(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (me.getRole() != Role.ARTIST && me.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only artists and admins can manage commissions");
        }
    }

    @Override
    public CommissionResponse getCommissionById(Integer id) {
        Commission commission = commissionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Commission not found"));
        return new CommissionResponse(commission);
    }

    @Override
    public CommissionResponse addCommission(CommissionRequest request) {
        assertArtistOrAdmin();
        User user = userRepo.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Commission commission = new Commission();
        commission.setCommissionType(request.getCommissionType());
        commission.setCommissionPrice(request.getCommissionPrice());
        commission.setCommissionDescription(request.getCommissionDescription());
        commission.setGenre(request.getGenre());
        commission.setUser(user);

        Commission saved = commissionRepo.save(commission);
        return new CommissionResponse(saved);
    }

    @Override
    public String uploadCommissionAttachment(Integer commissionId, MultipartFile file, Genre genre) throws IOException {
        assertArtistOrAdmin();
        Commission commission = commissionRepo.findById(commissionId)
                .orElseThrow(() -> new RuntimeException("Commission not found"));
        assertCommissionOwnerOrAdmin(commission);

        if (commission.getGenre() != genre) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Genre does not match commission");
        }

        String path = fileStorageService.saveCommissionAttachment(file, genre, commissionId);

        int nextOrder = commission.getAttachments().stream()
                .mapToInt(Sample::getSortOrder)
                .max()
                .orElse(-1) + 1;

        Sample a = new Sample();
        a.setCommission(commission);
        a.setStoragePath(path);
        a.setSortOrder(nextOrder);
        commission.getAttachments().add(a);
        commissionRepo.save(commission);

        return path;
    }

    private void assertCommissionOwnerOrAdmin(Commission commission) {
        Integer accountId = SecurityUtil.getCurrentUserId();
        Account me = accountRepo.findById(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (me.getRole() == Role.ADMIN) {
            return;
        }
        User owner = commission.getUser();
        if (owner == null || owner.getAccount() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Commission has no owner");
        }
        if (!owner.getAccount().getAccountId().equals(me.getAccountId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your commission");
        }
    }

    @Override
    public CommissionResponse updateCommission(Integer id, CommissionRequest request) {
        assertArtistOrAdmin();
        Commission commission = commissionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Commission not found"));
        assertCommissionOwnerOrAdmin(commission);

        List<String> newPaths = request.getAttachedFiles() != null
                ? new ArrayList<>(request.getAttachedFiles())
                : new ArrayList<>();

        assertAttachmentPathsForCommission(newPaths, commission.getCommissionId());

        boolean genreChanged = commission.getGenre() != request.getGenre();

        if (genreChanged) {
            for (Sample a : new ArrayList<>(commission.getAttachments())) {
                fileStorageService.deleteByPublicStoragePath(a.getStoragePath());
            }
            commission.getAttachments().clear();
            for (int i = 0; i < newPaths.size(); i++) {
                Sample a = new Sample();
                a.setCommission(commission);
                a.setStoragePath(newPaths.get(i));
                a.setSortOrder(i);
                commission.getAttachments().add(a);
            }
        } else {
            Iterator<Sample> it = commission.getAttachments().iterator();
            while (it.hasNext()) {
                Sample a = it.next();
                if (!newPaths.contains(a.getStoragePath())) {
                    fileStorageService.deleteByPublicStoragePath(a.getStoragePath());
                    it.remove();
                }
            }
            Set<String> existing = new HashSet<>();
            for (Sample a : commission.getAttachments()) {
                existing.add(a.getStoragePath());
            }
            for (int i = 0; i < newPaths.size(); i++) {
                final int sortOrder = i;
                String p = newPaths.get(i);
                if (!existing.contains(p)) {
                    Sample a = new Sample();
                    a.setCommission(commission);
                    a.setStoragePath(p);
                    a.setSortOrder(sortOrder);
                    commission.getAttachments().add(a);
                    existing.add(p);
                } else {
                    commission.getAttachments().stream()
                            .filter(x -> x.getStoragePath().equals(p))
                            .findFirst()
                            .ifPresent(x -> x.setSortOrder(sortOrder));
                }
            }
        }

        commission.setCommissionType(request.getCommissionType());
        commission.setCommissionPrice(request.getCommissionPrice());
        commission.setCommissionDescription(request.getCommissionDescription());
        commission.setGenre(request.getGenre());

        Commission saved = commissionRepo.save(commission);
        return new CommissionResponse(saved);
    }

    @Override
    public List<CommissionResponse> getCommissionsByUser(Integer userId) {
        return commissionRepo.findByUser_UserId(userId)
                .stream()
                .map(CommissionResponse::new)
                .toList();
    }

    @Override
    public List<CommissionResponse> getCommissionsByGenre(Genre genre) {
        return commissionRepo.findByGenre(genre)
                .stream()
                .map(CommissionResponse::new)
                .toList();
    }

    @Override
    public void deleteCommission(Integer id) {
        assertArtistOrAdmin();
        ensureEditable(id);

        Commission commission = commissionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Commission not found"));
        for (Sample a : new ArrayList<>(commission.getAttachments())) {
            fileStorageService.deleteByPublicStoragePath(a.getStoragePath());
        }

        commissionRepo.deleteById(id);
    }

    private void ensureEditable(Integer commissionId) {
        // Only allow update/delete when all related orders (if any) are REJECTED
        boolean locked = orderItemRepo
                .existsByCommission_CommissionIdAndOrder_OrderStatusNot(commissionId, OrderStatus.REJECTED);
        if (locked) {
            throw new RuntimeException("Cannot modify commission that is not fully rejected");
        }
    }

    private void assertAttachmentPathsForCommission(List<String> paths, Integer commissionId) {
        if (paths == null || paths.isEmpty()) {
            return;
        }
        String prefix = "/storage/commissions/" + commissionId + "/";
        for (String p : paths) {
            if (p == null || !p.startsWith(prefix)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Each attachment path must be under /storage/commissions/" + commissionId + "/"
                );
            }
        }
    }
}

