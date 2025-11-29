package com.freelms.lms.course.service;

import com.freelms.lms.common.dto.PagedResponse;
import com.freelms.lms.common.enums.CourseLevel;
import com.freelms.lms.common.enums.CourseStatus;
import com.freelms.lms.common.exception.BadRequestException;
import com.freelms.lms.common.exception.ForbiddenException;
import com.freelms.lms.common.exception.ResourceNotFoundException;
import com.freelms.lms.course.dto.*;
import com.freelms.lms.course.entity.Category;
import com.freelms.lms.course.entity.Course;
import com.freelms.lms.course.entity.Tag;
import com.freelms.lms.course.mapper.CourseMapper;
import com.freelms.lms.course.repository.CategoryRepository;
import com.freelms.lms.course.repository.CourseRepository;
import com.freelms.lms.course.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final CourseMapper courseMapper;

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    @Transactional
    public CourseDto createCourse(Long instructorId, CreateCourseRequest request) {
        log.info("Creating course: {} by instructor: {}", request.getTitle(), instructorId);

        Course course = courseMapper.toEntity(request);
        course.setInstructorId(instructorId);
        course.setSlug(generateSlug(request.getTitle()));

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
            course.setCategory(category);
        }

        if (request.getTags() != null && !request.getTags().isEmpty()) {
            Set<Tag> tags = getOrCreateTags(request.getTags());
            course.setTags(tags);
        }

        course = courseRepository.save(course);
        log.info("Course created with ID: {}", course.getId());

        return courseMapper.toDto(course);
    }

    @Cacheable(value = "courses", key = "#id")
    @Transactional(readOnly = true)
    public CourseDto getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));
        return courseMapper.toDto(course);
    }

    @Transactional(readOnly = true)
    public CourseDto getCourseBySlug(String slug) {
        Course course = courseRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "slug", slug));
        return courseMapper.toDto(course);
    }

    @Transactional(readOnly = true)
    public PagedResponse<CourseDto> getAllPublishedCourses(Pageable pageable) {
        Page<Course> courses = courseRepository.findByStatus(CourseStatus.PUBLISHED, pageable);
        List<CourseDto> dtos = courseMapper.toDtoList(courses.getContent());
        return PagedResponse.of(courses, dtos);
    }

    @Transactional(readOnly = true)
    public PagedResponse<CourseDto> getPopularCourses(Pageable pageable) {
        Page<Course> courses = courseRepository.findPopularCourses(pageable);
        List<CourseDto> dtos = courseMapper.toDtoList(courses.getContent());
        return PagedResponse.of(courses, dtos);
    }

    @Transactional(readOnly = true)
    public PagedResponse<CourseDto> getRecentCourses(Pageable pageable) {
        Page<Course> courses = courseRepository.findRecentCourses(pageable);
        List<CourseDto> dtos = courseMapper.toDtoList(courses.getContent());
        return PagedResponse.of(courses, dtos);
    }

    @Transactional(readOnly = true)
    public PagedResponse<CourseDto> getFeaturedCourses(Pageable pageable) {
        Page<Course> courses = courseRepository.findFeaturedCourses(pageable);
        List<CourseDto> dtos = courseMapper.toDtoList(courses.getContent());
        return PagedResponse.of(courses, dtos);
    }

    @Transactional(readOnly = true)
    public PagedResponse<CourseDto> searchCourses(String query, Pageable pageable) {
        Page<Course> courses = courseRepository.searchCourses(query, pageable);
        List<CourseDto> dtos = courseMapper.toDtoList(courses.getContent());
        return PagedResponse.of(courses, dtos);
    }

    @Transactional(readOnly = true)
    public PagedResponse<CourseDto> filterCourses(Long categoryId, CourseLevel level,
                                                   Boolean isFree, Pageable pageable) {
        Page<Course> courses = courseRepository.filterCourses(categoryId, level, isFree, pageable);
        List<CourseDto> dtos = courseMapper.toDtoList(courses.getContent());
        return PagedResponse.of(courses, dtos);
    }

    @Transactional(readOnly = true)
    public PagedResponse<CourseDto> getCoursesByInstructor(Long instructorId, Pageable pageable) {
        Page<Course> courses = courseRepository.findByInstructorId(instructorId, pageable);
        List<CourseDto> dtos = courseMapper.toDtoList(courses.getContent());
        return PagedResponse.of(courses, dtos);
    }

    @Transactional(readOnly = true)
    public PagedResponse<CourseDto> getCoursesByCategory(Long categoryId, Pageable pageable) {
        Page<Course> courses = courseRepository.findByCategoryId(categoryId, pageable);
        List<CourseDto> dtos = courseMapper.toDtoList(courses.getContent());
        return PagedResponse.of(courses, dtos);
    }

    @CacheEvict(value = "courses", key = "#id")
    @Transactional
    public CourseDto updateCourse(Long id, Long userId, UpdateCourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));

        if (!course.getInstructorId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to update this course");
        }

        courseMapper.updateCourseFromRequest(request, course);

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
            course.setCategory(category);
        }

        if (request.getTags() != null) {
            Set<Tag> tags = getOrCreateTags(request.getTags());
            course.setTags(tags);
        }

        course = courseRepository.save(course);
        log.info("Course updated: {}", id);

        return courseMapper.toDto(course);
    }

    @CacheEvict(value = "courses", key = "#id")
    @Transactional
    public CourseDto publishCourse(Long id, Long userId) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));

        if (!course.getInstructorId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to publish this course");
        }

        if (course.getModules().isEmpty()) {
            throw new BadRequestException("Course must have at least one module to be published");
        }

        course.publish();
        course = courseRepository.save(course);
        log.info("Course published: {}", id);

        return courseMapper.toDto(course);
    }

    @CacheEvict(value = "courses", key = "#id")
    @Transactional
    public void archiveCourse(Long id, Long userId) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));

        if (!course.getInstructorId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to archive this course");
        }

        course.archive();
        courseRepository.save(course);
        log.info("Course archived: {}", id);
    }

    @CacheEvict(value = "courses", key = "#id")
    @Transactional
    public void deleteCourse(Long id, Long userId) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));

        if (!course.getInstructorId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to delete this course");
        }

        courseRepository.delete(course);
        log.info("Course deleted: {}", id);
    }

    @Transactional
    public void incrementStudentCount(Long courseId) {
        courseRepository.incrementStudentCount(courseId);
    }

    private String generateSlug(String title) {
        String noWhitespace = WHITESPACE.matcher(title).replaceAll("-");
        String normalized = Normalizer.normalize(noWhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        slug = slug.toLowerCase(Locale.ENGLISH);

        // Ensure uniqueness
        String baseSlug = slug;
        int counter = 1;
        while (courseRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + counter++;
        }
        return slug;
    }

    private Set<Tag> getOrCreateTags(Set<String> tagNames) {
        Set<Tag> tags = new HashSet<>();
        for (String name : tagNames) {
            Tag tag = tagRepository.findByName(name.toLowerCase())
                    .orElseGet(() -> {
                        Tag newTag = Tag.builder()
                                .name(name.toLowerCase())
                                .slug(name.toLowerCase().replace(" ", "-"))
                                .build();
                        return tagRepository.save(newTag);
                    });
            tag.incrementUsageCount();
            tags.add(tag);
        }
        return tags;
    }
}
