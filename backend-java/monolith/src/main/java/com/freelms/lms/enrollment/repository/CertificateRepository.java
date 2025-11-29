package com.freelms.lms.enrollment.repository;

import com.freelms.lms.enrollment.entity.Certificate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Long> {

    Optional<Certificate> findByCertificateNumber(String certificateNumber);

    Optional<Certificate> findByEnrollmentId(Long enrollmentId);

    Page<Certificate> findByUserId(Long userId, Pageable pageable);

    Page<Certificate> findByCourseId(Long courseId, Pageable pageable);

    boolean existsByEnrollmentId(Long enrollmentId);

    long countByUserId(Long userId);

    long countByCourseId(Long courseId);
}
