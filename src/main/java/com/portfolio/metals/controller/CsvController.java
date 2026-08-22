package com.portfolio.metals.controller;

import com.portfolio.metals.service.CsvService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

/**
 * Controller for CSV operations: template download, portfolio export, and bulk import.
 */
@RestController
@RequestMapping("/api/csv")
@CrossOrigin(origins = "*")
public class CsvController {

    private final CsvService csvService;

    public CsvController(CsvService csvService) {
        this.csvService = csvService;
    }

    @GetMapping("/template")
    public ResponseEntity<byte[]> downloadTemplate() {
        String csv = csvService.generateTemplateCsv();
        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=precious_metals_template.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportPortfolio(
            @RequestParam(defaultValue = "default_user") String userId) {
        String csv = csvService.exportPortfolioCsv(userId);
        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);
        String filename = "metals_portfolio_backup_" + LocalDate.now() + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CsvService.ImportResult> importPortfolio(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "default_user") String userId) {
        try {
            CsvService.ImportResult result = csvService.importCsv(file.getInputStream(), userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new CsvService.ImportResult(0, 0, java.util.List.of("Error processing file: " + e.getMessage()))
            );
        }
    }
}
