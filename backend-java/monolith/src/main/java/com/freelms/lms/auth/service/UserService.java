package com.freelms.lms.auth.service;

import com.freelms.lms.auth.dto.UpdateUserRequest;
import com.freelms.lms.auth.dto.UserDto;
import com.freelms.lms.auth.entity.User;
import com.freelms.lms.auth.mapper.UserMapper;
import com.freelms.lms.auth.repository.UserRepository;
import com.freelms.lms.common.dto.PagedResponse;
import com.freelms.lms.common.enums.UserRole;
import com.freelms.lms.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Cacheable(value = "users", key = "#id")
    @Transactional(readOnly = true)
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return userMapper.toDto(user);
    }

    @Transactional(readOnly = true)
    public UserDto getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return userMapper.toDto(user);
    }

    @Transactional(readOnly = true)
    public PagedResponse<UserDto> getAllUsers(Pageable pageable) {
        Page<User> users = userRepository.findAll(pageable);
        List<UserDto> dtos = userMapper.toDtoList(users.getContent());
        return PagedResponse.of(users, dtos);
    }

    @Transactional(readOnly = true)
    public PagedResponse<UserDto> getUsersByRole(UserRole role, Pageable pageable) {
        Page<User> users = userRepository.findByRole(role, pageable);
        List<UserDto> dtos = userMapper.toDtoList(users.getContent());
        return PagedResponse.of(users, dtos);
    }

    @Transactional(readOnly = true)
    public PagedResponse<UserDto> getUsersByOrganization(Long organizationId, Pageable pageable) {
        Page<User> users = userRepository.findByOrganizationId(organizationId, pageable);
        List<UserDto> dtos = userMapper.toDtoList(users.getContent());
        return PagedResponse.of(users, dtos);
    }

    @Transactional(readOnly = true)
    public PagedResponse<UserDto> searchUsers(String query, Pageable pageable) {
        Page<User> users = userRepository.searchUsers(query, pageable);
        List<UserDto> dtos = userMapper.toDtoList(users.getContent());
        return PagedResponse.of(users, dtos);
    }

    @CacheEvict(value = "users", key = "#id")
    @Transactional
    public UserDto updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getTimezone() != null) {
            user.setTimezone(request.getTimezone());
        }
        if (request.getLanguage() != null) {
            user.setLanguage(request.getLanguage());
        }

        user = userRepository.save(user);
        log.info("User updated: {}", id);
        return userMapper.toDto(user);
    }

    @CacheEvict(value = "users", key = "#id")
    @Transactional
    public void deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setActive(false);
        userRepository.save(user);
        log.info("User deactivated: {}", id);
    }

    @CacheEvict(value = "users", key = "#id")
    @Transactional
    public void activateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setActive(true);
        userRepository.save(user);
        log.info("User activated: {}", id);
    }

    @CacheEvict(value = "users", key = "#id")
    @Transactional
    public void updateUserRole(Long id, UserRole newRole) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setRole(newRole);
        userRepository.save(user);
        log.info("User role updated: {} -> {}", id, newRole);
    }

    @Transactional
    public void addPoints(Long userId, int points) {
        userRepository.addPoints(userId, points);
        log.info("Added {} points to user: {}", points, userId);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getUsersByIds(List<Long> ids) {
        List<User> users = userRepository.findByIdIn(ids);
        return userMapper.toDtoList(users);
    }

    @Transactional(readOnly = true)
    public long countUsersByRole(UserRole role) {
        return userRepository.countByRole(role);
    }

    @Transactional(readOnly = true)
    public PagedResponse<UserDto> getTopUsers(UserRole role, Pageable pageable) {
        Page<User> users = userRepository.findTopUsersByRole(role, pageable);
        List<UserDto> dtos = userMapper.toDtoList(users.getContent());
        return PagedResponse.of(users, dtos);
    }
}
