package com.freelms.lms.enrollment.service;

import com.freelms.lms.common.dto.PagedResponse;
import com.freelms.lms.common.enums.EnrollmentStatus;
import com.freelms.lms.common.exception.BadRequestException;
import com.freelms.lms.common.exception.ResourceNotFoundException;
import com.freelms.lms.enrollment.dto.CertificateDto;
import com.freelms.lms.enrollment.entity.Certificate;
import com.freelms.lms.enrollment.entity.Enrollment;
import com.freelms.lms.enrollment.repository.CertificateRepository;
import com.freelms.lms.enrollment.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final EnrollmentRepository enrollmentRepository;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    @Transactional
    public CertificateDto issueCertificate(Long enrollmentId, String courseTitle, String userName) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", "id", enrollmentId));

        if (enrollment.getStatus() != EnrollmentStatus.COMPLETED) {
            throw new BadRequestException("Certificate can only be issued for completed enrollments");
        }

        if (certificateRepository.existsByEnrollmentId(enrollmentId)) {
            throw new BadRequestException("Certificate already issued for this enrollment");
        }

        Certificate certificate = Certificate.builder()
                .enrollment(enrollment)
                .userId(enrollment.getUserId())
                .courseId(enrollment.getCourseId())
                .courseTitle(courseTitle)
                .userName(userName)
                .build();

        certificate = certificateRepository.save(certificate);

        // Set verification URL
        certificate.setVerificationUrl(baseUrl + "/api/v1/certificates/verify/" + certificate.getCertificateNumber());
        certificate = certificateRepository.save(certificate);

        log.info("Certificate issued: {} for enrollment {}", certificate.getCertificateNumber(), enrollmentId);
        return toDto(certificate);
    }

    @Transactional(readOnly = true)
    public CertificateDto getCertificateById(Long id) {
        Certificate certificate = certificateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate", "id", id));
        return toDto(certificate);
    }

    @Transactional(readOnly = true)
    public CertificateDto getCertificateByNumber(String certificateNumber) {
        Certificate certificate = certificateRepository.findByCertificateNumber(certificateNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate", "number", certificateNumber));
        return toDto(certificate);
    }

    @Transactional(readOnly = true)
    public CertificateDto getCertificateByEnrollment(Long enrollmentId) {
        Certificate certificate = certificateRepository.findByEnrollmentId(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found for enrollment"));
        return toDto(certificate);
    }

    @Transactional(readOnly = true)
    public PagedResponse<CertificateDto> getUserCertificates(Long userId, Pageable pageable) {
        Page<Certificate> certificates = certificateRepository.findByUserId(userId, pageable);
        List<CertificateDto> dtos = certificates.getContent().stream().map(this::toDto).toList();
        return PagedResponse.of(certificates, dtos);
    }

    @Transactional(readOnly = true)
    public CertificateDto verifyCertificate(String certificateNumber) {
        Certificate certificate = certificateRepository.findByCertificateNumber(certificateNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate", "number", certificateNumber));
        return toDto(certificate);
    }

    private CertificateDto toDto(Certificate certificate) {
        return CertificateDto.builder()
                .id(certificate.getId())
                .certificateNumber(certificate.getCertificateNumber())
                .userId(certificate.getUserId())
                .courseId(certificate.getCourseId())
                .courseTitle(certificate.getCourseTitle())
                .userName(certificate.getUserName())
                .issuedAt(certificate.getIssuedAt())
                .expiryAt(certificate.getExpiryAt())
                .verificationUrl(certificate.getVerificationUrl())
                .pdfUrl(certificate.getPdfUrl())
                .expired(certificate.isExpired())
                .build();
    }
}
