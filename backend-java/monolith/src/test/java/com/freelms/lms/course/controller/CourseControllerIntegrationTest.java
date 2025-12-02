package com.freelms.lms.course.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.freelms.lms.TestUtils;
import com.freelms.lms.auth.entity.User;
import com.freelms.lms.auth.repository.UserRepository;
import com.freelms.lms.common.enums.CourseLevel;
import com.freelms.lms.common.enums.UserRole;
import com.freelms.lms.common.security.JwtTokenProvider;
import com.freelms.lms.course.dto.CreateCourseRequest;
import com.freelms.lms.course.entity.Course;
import com.freelms.lms.course.repository.CourseRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CourseControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User studentUser;
    private User instructorUser;
    private Course testCourse;
    private String studentToken;
    private String instructorToken;

    @BeforeEach
    void setUp() {
        // Clean up before each test
        courseRepository.deleteAll();
        userRepository.deleteAll();

        // Create test users
        studentUser = TestUtils.createTestUser(UserRole.STUDENT);
        studentUser.setPassword(passwordEncoder.encode("Password123!"));
        studentUser = userRepository.save(studentUser);

        instructorUser = TestUtils.createTestInstructor();
        instructorUser.setPassword(passwordEncoder.encode("Password123!"));
        instructorUser = userRepository.save(instructorUser);

        // Generate tokens
        studentToken = jwtTokenProvider.generateToken(studentUser.getId(), studentUser.getEmail(), studentUser.getRole());
        instructorToken = jwtTokenProvider.generateToken(instructorUser.getId(), instructorUser.getEmail(), instructorUser.getRole());

        // Create and save a test course
        testCourse = TestUtils.createPublishedTestCourse();
        testCourse.setInstructorId(instructorUser.getId());
        testCourse = courseRepository.save(testCourse);
    }

    @AfterEach
    void tearDown() {
        courseRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Should get all courses and return 200")
    void getAllCourses_Returns200() throws Exception {
        mockMvc.perform(get("/api/v1/courses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").exists())
                .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    @DisplayName("Should get course by ID when it exists and return 200")
    void getCourseById_Exists_Returns200() throws Exception {
        mockMvc.perform(get("/api/v1/courses/{id}", testCourse.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(testCourse.getId()))
                .andExpect(jsonPath("$.data.title").value(testCourse.getTitle()));
    }

    @Test
    @DisplayName("Should return 404 when course does not exist")
    void getCourseById_NotExists_Returns404() throws Exception {
        mockMvc.perform(get("/api/v1/courses/{id}", 999999L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Should create course when user is instructor and return 201")
    void createCourse_Instructor_Returns201() throws Exception {
        CreateCourseRequest request = CreateCourseRequest.builder()
                .title("New Course")
                .description("New course description")
                .level(CourseLevel.BEGINNER)
                .isFree(true)
                .build();

        mockMvc.perform(post("/api/v1/courses")
                        .header("Authorization", "Bearer " + instructorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("New Course"));
    }

    @Test
    @DisplayName("Should return 403 when student tries to create course")
    void createCourse_Student_Returns403() throws Exception {
        CreateCourseRequest request = CreateCourseRequest.builder()
                .title("New Course")
                .description("New course description")
                .level(CourseLevel.BEGINNER)
                .isFree(true)
                .build();

        mockMvc.perform(post("/api/v1/courses")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should return 401 when creating course without authentication")
    void createCourse_Unauthenticated_Returns401() throws Exception {
        CreateCourseRequest request = CreateCourseRequest.builder()
                .title("New Course")
                .description("New course description")
                .level(CourseLevel.BEGINNER)
                .isFree(true)
                .build();

        mockMvc.perform(post("/api/v1/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}
