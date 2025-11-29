package com.freelms.lms.course.service;

import com.freelms.lms.common.exception.ConflictException;
import com.freelms.lms.common.exception.ResourceNotFoundException;
import com.freelms.lms.course.dto.CategoryDto;
import com.freelms.lms.course.entity.Category;
import com.freelms.lms.course.mapper.CourseMapper;
import com.freelms.lms.course.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CourseMapper courseMapper;

    @Cacheable(value = "categories", key = "'all'")
    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        List<Category> categories = categoryRepository.findByIsActiveTrueOrderBySortOrderAsc();
        return courseMapper.toCategoryDtoList(categories);
    }

    @Cacheable(value = "categories", key = "'root'")
    @Transactional(readOnly = true)
    public List<CategoryDto> getRootCategories() {
        List<Category> categories = categoryRepository.findByParentIsNullAndIsActiveTrueOrderBySortOrderAsc();
        return courseMapper.toCategoryDtoList(categories);
    }

    @Transactional(readOnly = true)
    public CategoryDto getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        return courseMapper.toCategoryDto(category);
    }

    @Transactional(readOnly = true)
    public CategoryDto getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "slug", slug));
        return courseMapper.toCategoryDto(category);
    }

    @Transactional(readOnly = true)
    public List<CategoryDto> getSubcategories(Long parentId) {
        List<Category> categories = categoryRepository.findByParentIdAndIsActiveTrueOrderBySortOrderAsc(parentId);
        return courseMapper.toCategoryDtoList(categories);
    }

    @CacheEvict(value = "categories", allEntries = true)
    @Transactional
    public CategoryDto createCategory(String name, String description, Long parentId, String iconUrl, String color) {
        if (categoryRepository.existsByName(name)) {
            throw new ConflictException("Category", "name", name);
        }

        Category category = Category.builder()
                .name(name)
                .slug(generateSlug(name))
                .description(description)
                .iconUrl(iconUrl)
                .color(color)
                .build();

        if (parentId != null) {
            Category parent = categoryRepository.findById(parentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", parentId));
            category.setParent(parent);
        }

        category = categoryRepository.save(category);
        log.info("Category created: {}", category.getId());

        return courseMapper.toCategoryDto(category);
    }

    @CacheEvict(value = "categories", allEntries = true)
    @Transactional
    public CategoryDto updateCategory(Long id, String name, String description, String iconUrl, String color) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        if (name != null && !name.equals(category.getName())) {
            if (categoryRepository.existsByName(name)) {
                throw new ConflictException("Category", "name", name);
            }
            category.setName(name);
            category.setSlug(generateSlug(name));
        }

        if (description != null) category.setDescription(description);
        if (iconUrl != null) category.setIconUrl(iconUrl);
        if (color != null) category.setColor(color);

        category = categoryRepository.save(category);
        log.info("Category updated: {}", id);

        return courseMapper.toCategoryDto(category);
    }

    @CacheEvict(value = "categories", allEntries = true)
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        category.setActive(false);
        categoryRepository.save(category);
        log.info("Category deactivated: {}", id);
    }

    private String generateSlug(String name) {
        String slug = name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-");

        String baseSlug = slug;
        int counter = 1;
        while (categoryRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + counter++;
        }
        return slug;
    }
}
