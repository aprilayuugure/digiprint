package com.spring.digiprint.services.impl;

import com.spring.digiprint.enums.*;
import com.spring.digiprint.services.FileStorageService;
import org.jcodec.common.model.Picture;
import org.springframework.core.io.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.*;
import java.util.Set;
import java.util.UUID;
import org.jcodec.api.FrameGrab;
import org.jcodec.common.io.NIOUtils;
import org.jcodec.scale.AWTUtil;

@Service
public class FileStorageServiceImpl implements FileStorageService {

    private final String root = "../../storage/";

    @Override
    public String saveFile(MultipartFile file, Genre genre, Integer workId) throws IOException {

        if (file == null || file.isEmpty())
            throw new RuntimeException("File is empty");

        String extension = getExtension(file.getOriginalFilename());
        String filename = workId + "." + extension;

        Path folder = Paths.get(root, genre.name().toLowerCase());
        Files.createDirectories(folder);

        Path filePath = folder.resolve(filename);

        try (var input = file.getInputStream()) {
            Files.copy(input, filePath, StandardCopyOption.REPLACE_EXISTING);
        }

        generateThumbnail(filePath, genre, workId);

        return filename;
    }

    @Override
    public Resource loadFile(Genre genre, String filename) {

        Path filePath = Paths.get(root, genre.name().toLowerCase(), filename);

        return new FileSystemResource(filePath);
    }

    @Override
    public void deleteFile(Genre genre, Integer workId, String filename) {

        Path filePath = Paths.get(root, genre.name().toLowerCase(), filename);

        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        deleteThumbnail(workId);
    }

    @Override
    public String saveUserFile(MultipartFile file, UserMediaType type, Integer userId) throws IOException {

        if (file == null || file.isEmpty())
            throw new RuntimeException("File is empty");

        deleteUserFile(type, userId);

        String extension = getExtension(file.getOriginalFilename());
        String filename = type.name().toLowerCase() + "." + extension;

        Path folder = Paths.get(root, "users", String.valueOf(userId));
        Files.createDirectories(folder);

        Path filePath = folder.resolve(filename);

        try (var input = file.getInputStream()) {
            Files.copy(input, filePath, StandardCopyOption.REPLACE_EXISTING);
        }

        return "/storage/users/" + userId + "/" + filename;
    }

    @Override
    public Resource loadUserFile(UserMediaType type, Integer userId, String extension) {

        String filename = type.name().toLowerCase() + "." + extension;

        Path filePath = Paths.get(root, "users", String.valueOf(userId), filename);

        return new FileSystemResource(filePath);
    }

    @Override
    public String savePendingOrderAttachment(MultipartFile file, Integer accountId) throws IOException {

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        String extension = getExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID().toString().replace("-", "") + "." + extension;

        Path folder = Paths.get(root, "orders", "pending", String.valueOf(accountId));
        Files.createDirectories(folder);

        Path filePath = folder.resolve(filename);

        try (var input = file.getInputStream()) {
            Files.copy(input, filePath, StandardCopyOption.REPLACE_EXISTING);
        }

        return "/storage/orders/pending/" + accountId + "/" + filename;
    }

    private static final Set<String> COMPLETED_DELIVERABLE_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "gif", "webp", "bmp", "svg",
            "pdf", "txt", "md",
            "mp4", "webm", "mov", "mkv",
            "mp3", "wav", "ogg", "flac", "aac",
            "zip", "rar", "7z",
            "doc", "docx", "psd", "ai", "blend"
    );

    private void validateCompletedDeliverableExtension(String extension) {
        String ext = extension.toLowerCase();
        if (!COMPLETED_DELIVERABLE_EXTENSIONS.contains(ext)) {
            throw new RuntimeException(
                    "File type not allowed for completed deliverables. Allowed: images, pdf, audio, video, zip, office/creative formats.");
        }
    }

    @Override
    public String saveOrderItemCompletedDeliverable(MultipartFile file, Integer orderItemId) throws IOException {

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }
        if (orderItemId == null) {
            throw new RuntimeException("Order item id is required");
        }

        String extension = getExtension(file.getOriginalFilename());
        validateCompletedDeliverableExtension(extension);

        String filename = UUID.randomUUID().toString().replace("-", "") + "." + extension;

        Path folder = Paths.get(root, "orders", "deliverables", String.valueOf(orderItemId));
        Files.createDirectories(folder);

        Path filePath = folder.resolve(filename);

        try (var input = file.getInputStream()) {
            Files.copy(input, filePath, StandardCopyOption.REPLACE_EXISTING);
        }

        return "/storage/orders/deliverables/" + orderItemId + "/" + filename;
    }

    @Override
    public String saveCommissionAttachment(MultipartFile file, Genre genre, Integer commissionId) throws IOException {

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }
        if (commissionId == null) {
            throw new RuntimeException("Commission id is required");
        }

        String extension = getExtension(file.getOriginalFilename());
        validateExtensionForGenre(extension, genre);

        String filename = UUID.randomUUID().toString().replace("-", "") + "." + extension;

        Path folder = Paths.get(root, "commissions", String.valueOf(commissionId));
        Files.createDirectories(folder);

        Path filePath = folder.resolve(filename);

        try (var input = file.getInputStream()) {
            Files.copy(input, filePath, StandardCopyOption.REPLACE_EXISTING);
        }

        return "/storage/commissions/" + commissionId + "/" + filename;
    }

    private void validateExtensionForGenre(String extension, Genre genre) {
        String ext = extension.toLowerCase();
        // Dùng if-else thay vì switch(genre) để tránh lớp tổng hợp FileStorageServiceImpl$1 (NoClassDefFoundError khi build lệch).
        if (genre == Genre.ART) {
            if (!Set.of("jpg", "jpeg", "png", "gif", "webp").contains(ext)) {
                throw new RuntimeException("Art commissions only allow image files (jpg, jpeg, png, gif, webp)");
            }
        } else if (genre == Genre.MUSIC) {
            if (!Set.of("mp4", "webm").contains(ext)) {
                throw new RuntimeException("Music commissions only allow mp4 or webm");
            }
        } else if (genre == Genre.LITERATURE) {
            if (!"pdf".equals(ext)) {
                throw new RuntimeException("Literature commissions only allow PDF");
            }
        } else {
            throw new RuntimeException("Invalid genre");
        }
    }

    @Override
    public void deleteByPublicStoragePath(String publicPath) {
        if (publicPath == null || !publicPath.startsWith("/storage/")) {
            return;
        }
        String relative = publicPath.substring("/storage/".length());
        Path filePath = Paths.get(root, relative.split("/"));
        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void deleteUserFile(UserMediaType type, Integer userId) {

        Path dir = Paths.get(root, "users", String.valueOf(userId));

        if (!Files.exists(dir))
            return;

        try (var paths = Files.list(dir)) {

            paths.filter(path -> path.getFileName().toString()
                            .startsWith(type.name().toLowerCase() + "."))
                    .forEach(path -> {
                        try {
                            Files.deleteIfExists(path);
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    });

        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private String getExtension(String filename) {

        if (filename == null)
            throw new RuntimeException("Invalid file");

        int index = filename.lastIndexOf('.');

        if (index == -1)
            throw new RuntimeException("Invalid file");

        return filename.substring(index + 1).toLowerCase();
    }

    private void generateThumbnail(Path filePath, Genre genre, Integer workId) {

        try {
            if (genre == Genre.ART) {
                generateArtThumbnail(filePath, workId);
            } else if (genre == Genre.MUSIC) {
                generateVideoThumbnail(filePath, workId);
            } else if (genre == Genre.LITERATURE) {
                generateLiteratureThumbnail(filePath, workId);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void generateArtThumbnail(Path imagePath, Integer workId) throws Exception {

        BufferedImage original = ImageIO.read(imagePath.toFile());

        BufferedImage thumbnail = resizeThumbnail(original, 400);

        Path thumbnailPath = Paths.get(root, "thumbnails", workId + ".jpg");

        Files.createDirectories(thumbnailPath.getParent());

        ImageIO.write(thumbnail, "jpg", thumbnailPath.toFile());
    }

    private void generateVideoThumbnail(Path videoPath, Integer workId) throws Exception {

        try (var channel = NIOUtils.readableChannel(videoPath.toFile())) {

            FrameGrab grab = FrameGrab.createFrameGrab(channel).seekToSecondPrecise(1);

            Picture picture = grab.getNativeFrame();

            if (picture == null) throw new RuntimeException("Cannot extract frame");

            BufferedImage frame = AWTUtil.toBufferedImage(picture);

            BufferedImage thumbnail = resizeThumbnail(frame, 400);

            Path thumbnailPath = Paths.get(root, "thumbnails", workId + ".jpg");

            Files.createDirectories(thumbnailPath.getParent());

            ImageIO.write(thumbnail, "jpg", thumbnailPath.toFile());
        }
    }

    private void generateLiteratureThumbnail(Path pdfPath, Integer workId) throws Exception {

        var document = org.apache.pdfbox.pdmodel.PDDocument.load(pdfPath.toFile());

        var renderer = new org.apache.pdfbox.rendering.PDFRenderer(document);

        BufferedImage image = renderer.renderImageWithDPI(0, 300);

        BufferedImage thumbnail = resizeThumbnail(image, 400);

        Path thumbnailPath = Paths.get(root, "thumbnails", workId + ".jpg");

        Files.createDirectories(thumbnailPath.getParent());

        ImageIO.write(thumbnail, "jpg", thumbnailPath.toFile());

        document.close();
    }

    private void deleteThumbnail(Integer workId) {

        Path thumbnail = Paths.get(root, "thumbnails", workId + ".jpg");

        try {
            Files.deleteIfExists(thumbnail);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private BufferedImage resizeThumbnail(BufferedImage original, int width) {

        int height = (int) (((double) width / original.getWidth()) * original.getHeight());

        Image resized = original.getScaledInstance(width, height, Image.SCALE_SMOOTH);

        BufferedImage thumbnail = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);

        Graphics2D g = thumbnail.createGraphics();
        g.drawImage(resized, 0, 0, null);
        g.dispose();

        return thumbnail;
    }
}