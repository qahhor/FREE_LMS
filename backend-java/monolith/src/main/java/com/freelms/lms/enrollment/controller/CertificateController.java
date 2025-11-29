package com.freelms.lms.enrollment.controller;

import com.freelms.lms.common.dto.ApiResponse;
import com.freelms.lms.common.dto.PagedResponse;
import com.freelms.lms.common.security.CurrentUser;
import com.freelms.lms.common.security.UserPrincipal;
import com.freelms.lms.enrollment.dto.CertificateDto;
import com.freelms.lms.enrollment.service.CertificateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/certificates")
@RequiredArgsConstructor
@Tag(name = "Certificates", description = "Certificate management endpoints")
public class CertificateController {

    private final CertificateService certificateService;

    @GetMapping("/my")
    @Operation(summary = "Get my certificates")
    public ResponseEntity<ApiResponse<PagedResponse<CertificateDto>>> getMyCertificates(
            @CurrentUser UserPrincipal userPrincipal,
            @PageableDefault(size = 20, sort = "issuedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PagedResponse<CertificateDto> certificates = certificateService.getUserCertificates(
                userPrincipal.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(certificates));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get certificate by ID")
    public ResponseEntity<ApiResponse<CertificateDto>> getCertificateById(@PathVariable Long id) {
        CertificateDto certificate = certificateService.getCertificateById(id);
        return ResponseEntity.ok(ApiResponse.success(certificate));
    }

    @GetMapping("/enrollment/{enrollmentId}")
    @Operation(summary = "Get certificate by enrollment ID")
    public ResponseEntity<ApiResponse<CertificateDto>> getCertificateByEnrollment(@PathVariable Long enrollmentId) {
        CertificateDto certificate = certificateService.getCertificateByEnrollment(enrollmentId);
        return ResponseEntity.ok(ApiResponse.success(certificate));
    }

    @GetMapping("/verify/{certificateNumber}")
    @Operation(summary = "Verify certificate")
    public ResponseEntity<ApiResponse<CertificateDto>> verifyCertificate(@PathVariable String certificateNumber) {
        CertificateDto certificate = certificateService.verifyCertificate(certificateNumber);
        return ResponseEntity.ok(ApiResponse.success(certificate));
    }
}
