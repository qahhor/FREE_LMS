package com.freelms.lms.auth.dto;

import com.freelms.lms.common.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String fullName;
    private String phoneNumber;
    private String avatarUrl;
    private String bio;
    private UserRole role;
    private boolean active;
    private boolean emailVerified;
    private Integer level;
    private Integer totalPoints;
    private Long organizationId;
    private String timezone;
    private String language;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
}
