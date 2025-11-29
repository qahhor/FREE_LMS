package com.freelms.lms.enrollment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateDto {
    private Long id;
    private String certificateNumber;
    private Long userId;
    private Long courseId;
    private String courseTitle;
    private String userName;
    private LocalDateTime issuedAt;
    private LocalDateTime expiryAt;
    private String verificationUrl;
    private String pdfUrl;
    private boolean expired;
}
