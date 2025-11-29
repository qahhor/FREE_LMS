package com.freelms.lms.auth.controller;

import com.freelms.lms.auth.dto.UpdateUserRequest;
import com.freelms.lms.auth.dto.UserDto;
import com.freelms.lms.auth.service.UserService;
import com.freelms.lms.common.dto.ApiResponse;
import com.freelms.lms.common.dto.PagedResponse;
import com.freelms.lms.common.enums.UserRole;
import com.freelms.lms.common.security.CurrentUser;
import com.freelms.lms.common.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management endpoints")
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(@PathVariable Long id) {
        UserDto user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all users (Admin only)")
    public ResponseEntity<ApiResponse<PagedResponse<UserDto>>> getAllUsers(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PagedResponse<UserDto> users = userService.getAllUsers(pageable);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/role/{role}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get users by role (Admin only)")
    public ResponseEntity<ApiResponse<PagedResponse<UserDto>>> getUsersByRole(
            @PathVariable UserRole role,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<UserDto> users = userService.getUsersByRole(role, pageable);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/organization/{organizationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Get users by organization")
    public ResponseEntity<ApiResponse<PagedResponse<UserDto>>> getUsersByOrganization(
            @PathVariable Long organizationId,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<UserDto> users = userService.getUsersByOrganization(organizationId, pageable);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Search users")
    public ResponseEntity<ApiResponse<PagedResponse<UserDto>>> searchUsers(
            @RequestParam String query,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<UserDto> users = userService.searchUsers(query, pageable);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile")
    public ResponseEntity<ApiResponse<UserDto>> updateCurrentUser(
            @CurrentUser UserPrincipal userPrincipal,
            @Valid @RequestBody UpdateUserRequest request) {
        UserDto user = userService.updateUser(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(user, "Profile updated successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update user by ID (Admin only)")
    public ResponseEntity<ApiResponse<UserDto>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        UserDto user = userService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success(user, "User updated successfully"));
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update user role (Admin only)")
    public ResponseEntity<ApiResponse<Void>> updateUserRole(
            @PathVariable Long id,
            @RequestParam UserRole role) {
        userService.updateUserRole(id, role);
        return ResponseEntity.ok(ApiResponse.success(null, "User role updated successfully"));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate user (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(@PathVariable Long id) {
        userService.deactivateUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User deactivated successfully"));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activate user (Admin only)")
    public ResponseEntity<ApiResponse<Void>> activateUser(@PathVariable Long id) {
        userService.activateUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User activated successfully"));
    }

    @GetMapping("/leaderboard")
    @Operation(summary = "Get user leaderboard")
    public ResponseEntity<ApiResponse<PagedResponse<UserDto>>> getLeaderboard(
            @RequestParam(defaultValue = "STUDENT") UserRole role,
            @PageableDefault(size = 10) Pageable pageable) {
        PagedResponse<UserDto> users = userService.getTopUsers(role, pageable);
        return ResponseEntity.ok(ApiResponse.success(users));
    }
}
