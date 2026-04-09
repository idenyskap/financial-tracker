package com.example.financial_tracker.controller;

import com.example.financial_tracker.entity.User;
import com.example.financial_tracker.service.S3Service;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/files")
@org.springframework.boot.autoconfigure.condition.ConditionalOnExpression("!'${aws.access-key-id:}'.isEmpty()")
public class FileController {

    private final S3Service s3Service;

    public FileController(S3Service s3Service) {
        this.s3Service = s3Service;
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) throws IOException {

        String key = "users/" + user.getId() + "/" + file.getOriginalFilename();

        String url = s3Service.uploadFile(key, file.getBytes(), file.getContentType());

        return ResponseEntity.ok(Map.of(
                "url", url,
                "key", key
        ));
    }

    @GetMapping("/download/{*key}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable String key) {
        byte[] content = s3Service.downloadFile(key);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + key.substring(key.lastIndexOf('/') + 1) + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(content);
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteFile(@RequestParam String key) {
        s3Service.deleteFile(key);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/list")
    public ResponseEntity<List<String>> listFiles(@AuthenticationPrincipal User user) {
        List<String> files = s3Service.listFiles("users/" + user.getId() + "/");
        return ResponseEntity.ok(files);
    }
}