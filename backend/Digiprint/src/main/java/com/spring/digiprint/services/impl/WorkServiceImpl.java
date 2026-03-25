package com.spring.digiprint.services.impl;

import com.spring.digiprint.dtos.requests.*;
import com.spring.digiprint.dtos.responses.*;
import com.spring.digiprint.entities.*;
import com.spring.digiprint.enums.Genre;
import com.spring.digiprint.enums.Rating;
import com.spring.digiprint.enums.Role;
import com.spring.digiprint.repositories.*;
import com.spring.digiprint.services.*;
import com.spring.digiprint.utils.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Transactional
@RequiredArgsConstructor
@Service
@Slf4j
public class WorkServiceImpl implements WorkService {
    private final WorkRepository workRepo;
    private final TagRepository tagRepo;
    private final UserRepository userRepo;
    private final CommentRepository commentRepo;
    private final AccountRepository accountRepo;

    private final FileStorageService fileStorageService;

    /** Chỉ tài khoản ARTIST hoặc ADMIN được tạo/sửa/xóa work (USER không được). */
    private void assertArtistOrAdmin(Account me) {
        if (me.getRole() != Role.ARTIST && me.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only artists and admins can manage works");
        }
    }

    /** Chỉ chủ work (cùng User) hoặc ADMIN được sửa/xóa; USER không được dù dù là chủ. */
    private void assertOwnerOrAdmin(Work w) {
        Integer accountId = SecurityUtil.getCurrentUserId();
        Account me = accountRepo.findById(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (me.getRole() == Role.ADMIN) {
            return;
        }
        assertArtistOrAdmin(me);
        User author = w.getUser();
        if (author == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Work has no author");
        }
        User meUser = userRepo.findByAccount_AccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (!author.getUserId().equals(meUser.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only modify your own works");
        }
    }

    @Override
    public PageResponse<WorkPreviewResponse> filterWorks(
            Genre genre,
            String artistName,
            LocalDate startDate,
            LocalDate endDate,
            List<String> tags,
            List<Rating> ratings,
            String sort,
            int page,
            int size
    )
    {
        Sort sortSpec;
        if ("popular".equalsIgnoreCase(sort)) {
            sortSpec = Sort.by(Sort.Direction.DESC, "likeCount");
        } else {
            sortSpec = Sort.by(Sort.Direction.DESC, "workUploadDate");
        }

        Pageable pageable = PageRequest.of(page, size, sortSpec);

        LocalDateTime startDateTime = null;
        LocalDateTime endDateTime = null;

        if (startDate != null) {
            startDateTime = startDate.atStartOfDay();
        }

        if (endDate != null) {
            endDateTime = endDate.atTime(23, 59, 59);
        }

        List<Rating> ratingFilter = (ratings == null || ratings.isEmpty()) ? null : ratings;

        List<String> tagFilter = (tags == null || tags.isEmpty())
                ? null
                : tags.stream().filter(t -> t != null && !t.isBlank()).distinct().toList();

        log.debug(
                "filterWorks conditions: genre={}, artistNamePresent={}, startDate={}, endDate={}, ratingFilterCount={}, tagFilterCount={}, sort={}",
                genre,
                artistName != null && !artistName.isBlank(),
                startDate,
                endDate,
                ratingFilter == null ? 0 : ratingFilter.size(),
                tagFilter == null ? 0 : tagFilter.size(),
                sort
        );

        var resultPage = workRepo.filterWorksByConditionsAndTags(
                genre,
                (artistName != null && !artistName.isBlank()) ? artistName : null,
                startDateTime,
                endDateTime,
                ratingFilter,
                tagFilter,
                tagFilter != null ? tagFilter.size() : 0,
                pageable
        );

        log.info("filterWorks result: page={}, size={}, totalElements={}, totalPages={}",
                resultPage.getNumber(), resultPage.getSize(), resultPage.getTotalElements(), resultPage.getTotalPages());

        return new PageResponse<>(resultPage);
    }

    @Override
    public WorkResponse getWorkById(Integer id) {
        Work work = workRepo.findByIdWithUserAndAccount(id)
                .orElseThrow(() -> new RuntimeException("Work not found"));

        WorkResponse response = new WorkResponse(work);
        response.setComments(
                commentRepo.findByWorkOrderByCommentDateAsc(work)
                        .stream()
                        .map(CommentResponse::new)
                        .toList()
        );
        return response;
    }

    @Override
    public WorkResponse addWork(AddWorkRequest request) {
        Integer id = SecurityUtil.getCurrentUserId();

        Account me = accountRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        assertArtistOrAdmin(me);

        User u = userRepo.findByAccount_AccountId(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Work w = new Work();

        w.setGenre(request.getGenre());
        w.setRating(request.getRating());
        w.setWorkUploadDate(LocalDateTime.now());
        w.setUser(u);

        workRepo.save(w);

        try {
            String filename = fileStorageService.saveFile(request.getFile(), request.getGenre(), w.getWorkId());

            w.setWorkSource("/storage/" + request.getGenre().name().toLowerCase() + "/" + filename);
            w.setThumbnail("/storage/thumbnails/" + w.getWorkId() + ".jpg");
        }
        catch (Exception e) {
            throw new RuntimeException("File upload failed");
        }

        w.setWorkTitle(request.getWorkTitle());
        w.setWorkDescription(request.getWorkDescription());

        List<WorkTag> workTags = processTags(request.getWorkTags(), request.getGenre(), w);

        w.setWorkTags(workTags);

        workRepo.save(w);

        return new WorkResponse(w);
    }

    @Override
    public WorkResponse updateWork(Integer id, UpdateWorkRequest request) {
        Work w = workRepo.findByIdWithUserAndAccount(id)
                .orElseThrow(() -> new RuntimeException("Work not found"));

        assertOwnerOrAdmin(w);

        Genre previousGenre = w.getGenre();

        w.setGenre(request.getGenre());
        w.setRating(request.getRating());

        if (request.getFile() != null && !request.getFile().isEmpty()) {
            fileStorageService.deleteFile(previousGenre, w.getWorkId(), w.getWorkSource());

            try {
                String filename = fileStorageService.saveFile(request.getFile(), request.getGenre(), w.getWorkId());

                w.setWorkSource("/storage/" + request.getGenre().name().toLowerCase() + "/" + filename);
                w.setThumbnail("/storage/thumbnails/" + w.getWorkId() + ".jpg");
            }
            catch (Exception e) {
                throw new RuntimeException("File upload failed");
            }
        }

        w.setWorkTitle(request.getWorkTitle());
        w.setWorkDescription(request.getWorkDescription());

        decrementTagCountsAndCleanup(w);
        w.getWorkTags().clear();

        List<WorkTag> workTags = processTags(request.getWorkTags(), request.getGenre(), w);

        w.getWorkTags().addAll(workTags);

        workRepo.save(w);

        return new WorkResponse(w);
    }

    @Override
    public void deleteWork(Integer id) {
        Work w = workRepo.findByIdWithUserAndAccount(id)
                .orElseThrow(() -> new RuntimeException("Work not found"));

        assertOwnerOrAdmin(w);

        fileStorageService.deleteFile(w.getGenre(), w.getWorkId(), w.getWorkSource());

        decrementTagCountsAndCleanup(w);
        workRepo.delete(w);
    }

    private List<WorkTag> processTags(List<String> tagNames, Genre genre, Work work) {
        if (tagNames == null || tagNames.isEmpty()) {
            return new ArrayList<>();
        }

        Set<String> uniqueTags = new HashSet<>(tagNames);

        List<WorkTag> workTags = new ArrayList<>();

        for (String tagName : uniqueTags) {

            Tag t = tagRepo.findByTagName(tagName)
                    .orElseGet(() -> {
                        Tag newTag = new Tag();
                        newTag.setTagName(tagName);
                        newTag.setTagWorkCount(0);
                        newTag.setTagGenre(genre);

                        return tagRepo.save(newTag);
                    });

            t.setTagWorkCount(t.getTagWorkCount() + 1);

            WorkTag wt = new WorkTag();
            wt.setWork(work);
            wt.setTag(t);

            workTags.add(wt);
        }

        return workTags;
    }

    private void decrementTagCountsAndCleanup(Work work) {
        for (WorkTag wt : work.getWorkTags()) {
            Tag t = wt.getTag();
            t.setTagWorkCount(t.getTagWorkCount() - 1);
            if (t.getTagWorkCount() <= 0) {
                tagRepo.delete(t);
            }
        }
    }

}
