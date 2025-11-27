package com.freelms.onboarding.service;

import com.freelms.onboarding.entity.*;
import com.freelms.onboarding.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Smartup LMS - Onboarding Template Service
 *
 * Creates and manages default onboarding templates for different user roles.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OnboardingTemplateService {

    private final OnboardingFlowRepository flowRepository;
    private final ChecklistRepository checklistRepository;

    @EventListener(ApplicationReadyEvent.class)
    public void initializeDefaultTemplates() {
        log.info("Initializing default onboarding templates...");

        // Create templates for each role
        createLearnerOnboarding();
        createInstructorOnboarding();
        createManagerOnboarding();
        createAdminOnboarding();

        // Create checklists
        createLearnerChecklist();
        createInstructorChecklist();

        log.info("Default onboarding templates initialized");
    }

    // ================== Learner Onboarding ==================

    private void createLearnerOnboarding() {
        if (flowRepository.findBySlug("learner-welcome").isPresent()) {
            return;
        }

        OnboardingFlow flow = OnboardingFlow.builder()
                .slug("learner-welcome")
                .name("Добро пожаловать в Smartup LMS!")
                .nameUz("Smartup LMS ga xush kelibsiz!")
                .nameRu("Добро пожаловать в Smartup LMS!")
                .nameEn("Welcome to Smartup LMS!")
                .description("Краткое знакомство с платформой обучения")
                .descriptionUz("Ta'lim platformasi bilan qisqacha tanishish")
                .descriptionRu("Краткое знакомство с платформой обучения")
                .descriptionEn("A quick introduction to the learning platform")
                .targetRole(OnboardingFlow.TargetRole.LEARNER)
                .estimatedMinutes(5)
                .completionPoints(100)
                .mandatory(true)
                .canSkip(false)
                .showProgress(true)
                .autoStart(true)
                .active(true)
                .published(true)
                .build();

        // Step 1: Welcome
        OnboardingStep welcome = OnboardingStep.builder()
                .title("Добро пожаловать!")
                .titleUz("Xush kelibsiz!")
                .titleRu("Добро пожаловать!")
                .titleEn("Welcome!")
                .content("Мы рады видеть вас на нашей платформе! Давайте познакомимся с основными функциями.")
                .contentUz("Sizni platformamizda ko'rib turganimizdan xursandmiz! Keling, asosiy funktsiyalar bilan tanishamiz.")
                .contentRu("Мы рады видеть вас на нашей платформе! Давайте познакомимся с основными функциями.")
                .contentEn("We're glad to see you on our platform! Let's explore the main features.")
                .stepType(OnboardingStep.StepType.WELCOME)
                .actionType(OnboardingStep.ActionType.NEXT)
                .position(OnboardingStep.TooltipPosition.CENTER)
                .icon("wave")
                .completionTrigger(OnboardingStep.CompletionTrigger.BUTTON_CLICK)
                .points(10)
                .canSkip(false)
                .showBackButton(false)
                .showSkipButton(false)
                .active(true)
                .build();
        flow.addStep(welcome);

        // Step 2: Dashboard
        OnboardingStep dashboard = OnboardingStep.builder()
                .title("Ваша панель управления")
                .titleUz("Boshqaruv panelingiz")
                .titleRu("Ваша панель управления")
                .titleEn("Your Dashboard")
                .content("Здесь вы найдёте все ваши курсы, задания и прогресс обучения.")
                .contentUz("Bu yerda barcha kurslaringiz, topshiriqlaringiz va o'quv jarayoningizni topasiz.")
                .contentRu("Здесь вы найдёте все ваши курсы, задания и прогресс обучения.")
                .contentEn("Here you'll find all your courses, assignments, and learning progress.")
                .stepType(OnboardingStep.StepType.SPOTLIGHT)
                .actionType(OnboardingStep.ActionType.NEXT)
                .targetElement("#dashboard-main")
                .targetPage("/dashboard")
                .position(OnboardingStep.TooltipPosition.BOTTOM)
                .icon("home")
                .completionTrigger(OnboardingStep.CompletionTrigger.BUTTON_CLICK)
                .points(10)
                .canSkip(true)
                .showBackButton(true)
                .showSkipButton(true)
                .scrollToElement(true)
                .active(true)
                .build();
        flow.addStep(dashboard);

        // Step 3: Course Catalog
        OnboardingStep catalog = OnboardingStep.builder()
                .title("Каталог курсов")
                .titleUz("Kurslar katalogi")
                .titleRu("Каталог курсов")
                .titleEn("Course Catalog")
                .content("Изучите доступные курсы и запишитесь на интересующие вас программы.")
                .contentUz("Mavjud kurslarni o'rganing va sizni qiziqtirgan dasturlarga yozilin.")
                .contentRu("Изучите доступные курсы и запишитесь на интересующие вас программы.")
                .contentEn("Explore available courses and enroll in programs that interest you.")
                .stepType(OnboardingStep.StepType.TOOLTIP)
                .actionType(OnboardingStep.ActionType.NAVIGATE)
                .targetElement("#nav-courses")
                .targetPage("/courses")
                .position(OnboardingStep.TooltipPosition.RIGHT)
                .icon("book")
                .completionTrigger(OnboardingStep.CompletionTrigger.ELEMENT_CLICK)
                .points(15)
                .canSkip(true)
                .showBackButton(true)
                .showSkipButton(true)
                .active(true)
                .build();
        flow.addStep(catalog);

        // Step 4: Profile
        OnboardingStep profile = OnboardingStep.builder()
                .title("Ваш профиль")
                .titleUz("Profilingiz")
                .titleRu("Ваш профиль")
                .titleEn("Your Profile")
                .content("Настройте свой профиль, добавьте фото и личную информацию.")
                .contentUz("Profilingizni sozlang, rasm va shaxsiy ma'lumotlarni qo'shing.")
                .contentRu("Настройте свой профиль, добавьте фото и личную информацию.")
                .contentEn("Customize your profile, add a photo and personal information.")
                .stepType(OnboardingStep.StepType.TOOLTIP)
                .actionType(OnboardingStep.ActionType.NAVIGATE)
                .targetElement("#user-menu")
                .targetPage("/profile")
                .position(OnboardingStep.TooltipPosition.BOTTOM_LEFT)
                .icon("user")
                .completionTrigger(OnboardingStep.CompletionTrigger.ELEMENT_CLICK)
                .points(15)
                .canSkip(true)
                .showBackButton(true)
                .showSkipButton(true)
                .active(true)
                .build();
        flow.addStep(profile);

        // Step 5: Complete
        OnboardingStep complete = OnboardingStep.builder()
                .title("Отлично!")
                .titleUz("Ajoyib!")
                .titleRu("Отлично!")
                .titleEn("Great!")
                .content("Вы готовы начать обучение! Выберите курс и начните свой путь к знаниям.")
                .contentUz("Siz o'qishni boshlashga tayyorsiz! Kursni tanlang va bilim yo'lingizni boshlang.")
                .contentRu("Вы готовы начать обучение! Выберите курс и начните свой путь к знаниям.")
                .contentEn("You're ready to start learning! Choose a course and begin your journey to knowledge.")
                .stepType(OnboardingStep.StepType.CELEBRATION)
                .actionType(OnboardingStep.ActionType.COMPLETE)
                .position(OnboardingStep.TooltipPosition.CENTER)
                .icon("trophy")
                .completionTrigger(OnboardingStep.CompletionTrigger.BUTTON_CLICK)
                .points(50)
                .canSkip(false)
                .showBackButton(true)
                .showSkipButton(false)
                .active(true)
                .build();
        flow.addStep(complete);

        flowRepository.save(flow);
        log.info("Created learner onboarding flow: {}", flow.getSlug());
    }

    // ================== Instructor Onboarding ==================

    private void createInstructorOnboarding() {
        if (flowRepository.findBySlug("instructor-welcome").isPresent()) {
            return;
        }

        OnboardingFlow flow = OnboardingFlow.builder()
                .slug("instructor-welcome")
                .name("Руководство инструктора")
                .nameUz("Instruktor qo'llanmasi")
                .nameRu("Руководство инструктора")
                .nameEn("Instructor Guide")
                .description("Научитесь создавать и управлять курсами")
                .descriptionUz("Kurslarni yaratish va boshqarishni o'rganing")
                .descriptionRu("Научитесь создавать и управлять курсами")
                .descriptionEn("Learn to create and manage courses")
                .targetRole(OnboardingFlow.TargetRole.INSTRUCTOR)
                .estimatedMinutes(10)
                .completionPoints(200)
                .mandatory(true)
                .canSkip(false)
                .showProgress(true)
                .autoStart(true)
                .active(true)
                .published(true)
                .build();

        // Step 1: Welcome
        OnboardingStep welcome = OnboardingStep.builder()
                .title("Добро пожаловать, преподаватель!")
                .titleUz("Xush kelibsiz, o'qituvchi!")
                .titleRu("Добро пожаловать, преподаватель!")
                .titleEn("Welcome, Instructor!")
                .content("Давайте познакомим вас с инструментами для создания эффективных курсов.")
                .contentUz("Keling, sizni samarali kurslar yaratish vositalari bilan tanishtiramiz.")
                .contentRu("Давайте познакомим вас с инструментами для создания эффективных курсов.")
                .contentEn("Let us introduce you to the tools for creating effective courses.")
                .stepType(OnboardingStep.StepType.WELCOME)
                .actionType(OnboardingStep.ActionType.NEXT)
                .position(OnboardingStep.TooltipPosition.CENTER)
                .icon("graduation-cap")
                .completionTrigger(OnboardingStep.CompletionTrigger.BUTTON_CLICK)
                .points(10)
                .canSkip(false)
                .showBackButton(false)
                .showSkipButton(false)
                .active(true)
                .build();
        flow.addStep(welcome);

        // Step 2: Course Builder
        OnboardingStep courseBuilder = OnboardingStep.builder()
                .title("Конструктор курсов")
                .titleUz("Kurs konstruktori")
                .titleRu("Конструктор курсов")
                .titleEn("Course Builder")
                .content("Здесь вы создаёте курсы, добавляете уроки, тесты и задания.")
                .contentUz("Bu yerda kurslar yaratasiz, darslar, testlar va topshiriqlar qo'shasiz.")
                .contentRu("Здесь вы создаёте курсы, добавляете уроки, тесты и задания.")
                .contentEn("Here you create courses, add lessons, tests, and assignments.")
                .stepType(OnboardingStep.StepType.SPOTLIGHT)
                .actionType(OnboardingStep.ActionType.NEXT)
                .targetElement("#course-builder-btn")
                .targetPage("/instructor/courses")
                .position(OnboardingStep.TooltipPosition.BOTTOM)
                .icon("edit")
                .completionTrigger(OnboardingStep.CompletionTrigger.BUTTON_CLICK)
                .points(20)
                .canSkip(true)
                .showBackButton(true)
                .showSkipButton(true)
                .scrollToElement(true)
                .active(true)
                .build();
        flow.addStep(courseBuilder);

        // Step 3: Content Library
        OnboardingStep library = OnboardingStep.builder()
                .title("Библиотека контента")
                .titleUz("Kontent kutubxonasi")
                .titleRu("Библиотека контента")
                .titleEn("Content Library")
                .content("Загружайте видео, документы и другие материалы для ваших курсов.")
                .contentUz("Kurslaringiz uchun video, hujjatlar va boshqa materiallarni yuklang.")
                .contentRu("Загружайте видео, документы и другие материалы для ваших курсов.")
                .contentEn("Upload videos, documents, and other materials for your courses.")
                .stepType(OnboardingStep.StepType.TOOLTIP)
                .actionType(OnboardingStep.ActionType.NEXT)
                .targetElement("#content-library")
                .position(OnboardingStep.TooltipPosition.RIGHT)
                .icon("folder")
                .completionTrigger(OnboardingStep.CompletionTrigger.BUTTON_CLICK)
                .points(20)
                .canSkip(true)
                .showBackButton(true)
                .showSkipButton(true)
                .active(true)
                .build();
        flow.addStep(library);

        // Step 4: Analytics
        OnboardingStep analytics = OnboardingStep.builder()
                .title("Аналитика обучения")
                .titleUz("O'quv tahlili")
                .titleRu("Аналитика обучения")
                .titleEn("Learning Analytics")
                .content("Отслеживайте прогресс студентов и эффективность ваших курсов.")
                .contentUz("Talabalar taraqqiyotini va kurslaringiz samaradorligini kuzating.")
                .contentRu("Отслеживайте прогресс студентов и эффективность ваших курсов.")
                .contentEn("Track student progress and the effectiveness of your courses.")
                .stepType(OnboardingStep.StepType.TOOLTIP)
                .actionType(OnboardingStep.ActionType.NEXT)
                .targetElement("#instructor-analytics")
                .position(OnboardingStep.TooltipPosition.LEFT)
                .icon("chart-bar")
                .completionTrigger(OnboardingStep.CompletionTrigger.BUTTON_CLICK)
                .points(20)
                .canSkip(true)
                .showBackButton(true)
                .showSkipButton(true)
                .active(true)
                .build();
        flow.addStep(analytics);

        // Step 5: Create First Course (Interactive)
        OnboardingStep createCourse = OnboardingStep.builder()
                .title("Создайте свой первый курс")
                .titleUz("Birinchi kursingizni yarating")
                .titleRu("Создайте свой первый курс")
                .titleEn("Create Your First Course")
                .content("Нажмите кнопку 'Создать курс', чтобы начать.")
                .contentUz("'Kurs yaratish' tugmasini bosing va boshlang.")
                .contentRu("Нажмите кнопку 'Создать курс', чтобы начать.")
                .contentEn("Click 'Create Course' to get started.")
                .stepType(OnboardingStep.StepType.INTERACTIVE)
                .actionType(OnboardingStep.ActionType.CLICK)
                .targetElement("#create-course-btn")
                .clickTarget("#create-course-btn")
                .position(OnboardingStep.TooltipPosition.BOTTOM)
                .icon("plus")
                .completionTrigger(OnboardingStep.CompletionTrigger.ELEMENT_CLICK)
                .points(30)
                .canSkip(true)
                .showBackButton(true)
                .showSkipButton(true)
                .blockUi(true)
                .active(true)
                .build();
        flow.addStep(createCourse);

        // Step 6: Complete
        OnboardingStep complete = OnboardingStep.builder()
                .title("Вы готовы!")
                .titleUz("Siz tayyorsiz!")
                .titleRu("Вы готовы!")
                .titleEn("You're Ready!")
                .content("Теперь вы знаете основы. Создавайте увлекательные курсы!")
                .contentUz("Endi asoslarni bilasiz. Qiziqarli kurslar yarating!")
                .contentRu("Теперь вы знаете основы. Создавайте увлекательные курсы!")
                .contentEn("Now you know the basics. Create engaging courses!")
                .stepType(OnboardingStep.StepType.CELEBRATION)
                .actionType(OnboardingStep.ActionType.COMPLETE)
                .position(OnboardingStep.TooltipPosition.CENTER)
                .icon("star")
                .completionTrigger(OnboardingStep.CompletionTrigger.BUTTON_CLICK)
                .points(100)
                .canSkip(false)
                .showBackButton(true)
                .showSkipButton(false)
                .active(true)
                .build();
        flow.addStep(complete);

        flowRepository.save(flow);
        log.info("Created instructor onboarding flow: {}", flow.getSlug());
    }

    // ================== Manager Onboarding ==================

    private void createManagerOnboarding() {
        if (flowRepository.findBySlug("manager-welcome").isPresent()) {
            return;
        }

        OnboardingFlow flow = OnboardingFlow.builder()
                .slug("manager-welcome")
                .name("Руководство менеджера")
                .nameUz("Menejer qo'llanmasi")
                .nameRu("Руководство менеджера")
                .nameEn("Manager Guide")
                .description("Управляйте обучением вашей команды эффективно")
                .descriptionUz("Jamoangiz ta'limini samarali boshqaring")
                .descriptionRu("Управляйте обучением вашей команды эффективно")
                .descriptionEn("Manage your team's learning effectively")
                .targetRole(OnboardingFlow.TargetRole.MANAGER)
                .estimatedMinutes(8)
                .completionPoints(150)
                .mandatory(true)
                .canSkip(false)
                .showProgress(true)
                .autoStart(true)
                .active(true)
                .published(true)
                .build();

        // Step 1: Welcome
        OnboardingStep welcome = OnboardingStep.builder()
                .title("Добро пожаловать, руководитель!")
                .titleUz("Xush kelibsiz, rahbar!")
                .titleRu("Добро пожаловать, руководитель!")
                .titleEn("Welcome, Manager!")
                .content("Познакомьтесь с инструментами управления обучением вашей команды.")
                .contentUz("Jamoangiz ta'limini boshqarish vositalari bilan tanishing.")
                .contentRu("Познакомьтесь с инструментами управления обучением вашей команды.")
                .contentEn("Get to know the tools for managing your team's learning.")
                .stepType(OnboardingStep.StepType.WELCOME)
                .actionType(OnboardingStep.ActionType.NEXT)
                .position(OnboardingStep.TooltipPosition.CENTER)
                .icon("users")
                .completionTrigger(OnboardingStep.CompletionTrigger.BUTTON_CLICK)
                .points(10)
                .canSkip(false)
                .showBackButton(false)
                .showSkipButton(false)
                .active(true)
                .build();
        flow.addStep(welcome);

        // Step 2: Team Dashboard
        OnboardingStep teamDashboard = OnboardingStep.builder()
                .title("Панель команды")
                .titleUz("Jamoa paneli")
                .titleRu("Панель команды")
                .titleEn("Team Dashboard")
                .content("Отслеживайте прогресс обучения всех членов вашей команды.")
                .contentUz("Jamoa a'zolarining o'quv jarayonini kuzating.")
                .contentRu("Отслеживайте прогресс обучения всех членов вашей команды.")
                .contentEn("Track the learning progress of all your team members.")
                .stepType(OnboardingStep.StepType.SPOTLIGHT)
                .actionType(OnboardingStep.ActionType.NEXT)
                .targetElement("#team-dashboard")
                .targetPage("/manager/team")
                .position(OnboardingStep.TooltipPosition.BOTTOM)
                .icon("chart-line")
                .completionTrigger(OnboardingStep.CompletionTrigger.BUTTON_CLICK)
                .points(20)
                .canSkip(true)
                .showBackButton(true)
                .showSkipButton(true)
                .active(true)
                .build();
        flow.addStep(teamDashboard);

        // Step 3: Assign Learning
        OnboardingStep assignLearning = OnboardingStep.builder()
                .title("Назначение обучения")
                .titleUz("Ta'limni tayinlash")
                .titleRu("Назначение обучения")
                .titleEn("Assign Learning")
                .content("Назначайте курсы и программы обучения членам команды.")
                .contentUz("Jamoa a'zolariga kurslar va ta'lim dasturlarini tayinlang.")
                .contentRu("Назначайте курсы и программы обучения членам команды.")
                .contentEn("Assign courses and learning programs to team members.")
                .stepType(OnboardingStep.StepType.TOOLTIP)
                .actionType(OnboardingStep.ActionType.NEXT)
                .targetElement("#assign-learning-btn")
                .position(OnboardingStep.TooltipPosition.BOTTOM)
                .icon("clipboard-list")
                .completionTrigger(OnboardingStep.CompletionTrigger.BUTTON_CLICK)
                .points(20)
                .canSkip(true)
                .showBackButton(true)
                .showSkipButton(true)
                .active(true)
                .build();
        flow.addStep(assignLearning);

        // Step 4: Reports
        OnboardingStep reports = OnboardingStep.builder()
                .title("Отчёты и аналитика")
                .titleUz("Hisobotlar va tahlillar")
                .titleRu("Отчёты и аналитика")
                .titleEn("Reports and Analytics")
                .content("Получайте детальные отчёты об обучении вашей команды.")
                .contentUz("Jamoangiz ta'limi haqida batafsil hisobotlarni oling.")
                .contentRu("Получайте детальные отчёты об обучении вашей команды.")
                .contentEn("Get detailed reports on your team's learning.")
                .stepType(OnboardingStep.StepType.TOOLTIP)
                .actionType(OnboardingStep.ActionType.NEXT)
                .targetElement("#reports-menu")
                .position(OnboardingStep.TooltipPosition.RIGHT)
                .icon("file-chart-line")
                .completionTrigger(OnboardingStep.CompletionTrigger.BUTTON_CLICK)
                .points(20)
                .canSkip(true)
                .showBackButton(true)
                .showSkipButton(true)
                .active(true)
                .build();
        flow.addStep(reports);

        // Step 5: Complete
        OnboardingStep complete = OnboardingStep.builder()
                .title("Всё готово!")
                .titleUz("Hammasi tayyor!")
                .titleRu("Всё готово!")
                .titleEn("All Set!")
                .content("Вы готовы управлять обучением вашей команды эффективно!")
                .contentUz("Jamoangiz ta'limini samarali boshqarishga tayyorsiz!")
                .contentRu("Вы готовы управлять обучением вашей команды эффективно!")
                .contentEn("You're ready to manage your team's learning effectively!")
                .stepType(OnboardingStep.StepType.CELEBRATION)
                .actionType(OnboardingStep.ActionType.COMPLETE)
                .position(OnboardingStep.TooltipPosition.CENTER)
                .icon("check-circle")
                .completionTrigger(OnboardingStep.CompletionTrigger.BUTTON_CLICK)
                .points(80)
                .canSkip(false)
                .showBackButton(true)
                .showSkipButton(false)
                .active(true)
                .build();
        flow.addStep(complete);

        flowRepository.save(flow);
        log.info("Created manager onboarding flow: {}", flow.getSlug());
    }

    // ================== Admin Onboarding ==================

    private void createAdminOnboarding() {
        if (flowRepository.findBySlug("admin-welcome").isPresent()) {
            return;
        }

        OnboardingFlow flow = OnboardingFlow.builder()
                .slug("admin-welcome")
                .name("Руководство администратора")
                .nameUz("Administrator qo'llanmasi")
                .nameRu("Руководство администратора")
                .nameEn("Administrator Guide")
                .description("Полный контроль над платформой обучения")
                .descriptionUz("Ta'lim platformasini to'liq nazorat qilish")
                .descriptionRu("Полный контроль над платформой обучения")
                .descriptionEn("Complete control over the learning platform")
                .targetRole(OnboardingFlow.TargetRole.SYSTEM_ADMIN)
                .estimatedMinutes(15)
                .completionPoints(300)
                .mandatory(true)
                .canSkip(false)
                .showProgress(true)
                .autoStart(true)
                .active(true)
                .published(true)
                .build();

        // Step 1: Welcome
        OnboardingStep welcome = OnboardingStep.builder()
                .title("Добро пожаловать, администратор!")
                .titleUz("Xush kelibsiz, administrator!")
                .titleRu("Добро пожаловать, администратор!")
                .titleEn("Welcome, Administrator!")
                .content("Давайте настроим платформу для вашей организации.")
                .contentUz("Keling, platformani tashkilotingiz uchun sozlaymiz.")
                .contentRu("Давайте настроим платформу для вашей организации.")
                .contentEn("Let's configure the platform for your organization.")
                .stepType(OnboardingStep.StepType.WELCOME)
                .actionType(OnboardingStep.ActionType.NEXT)
                .position(OnboardingStep.TooltipPosition.CENTER)
                .icon("shield")
                .completionTrigger(OnboardingStep.CompletionTrigger.BUTTON_CLICK)
                .points(10)
                .canSkip(false)
                .showBackButton(false)
                .showSkipButton(false)
                .active(true)
                .build();
        flow.addStep(welcome);

        // Step 2: Organization Settings
        OnboardingStep orgSettings = OnboardingStep.builder()
                .title("Настройки организации")
                .titleUz("Tashkilot sozlamalari")
                .titleRu("Настройки организации")
                .titleEn("Organization Settings")
                .content("Настройте логотип, цвета бренда и основные параметры.")
                .contentUz("Logotip, brend ranglarini va asosiy parametrlarni sozlang.")
                .contentRu("Настройте логотип, цвета бренда и основные параметры.")
                .contentEn("Configure logo, brand colors, and basic settings.")
                .stepType(OnboardingStep.StepType.SPOTLIGHT)
                .actionType(OnboardingStep.ActionType.NEXT)
                .targetElement("#org-settings")
                .targetPage("/admin/settings")
                .position(OnboardingStep.TooltipPosition.BOTTOM)
                .icon("building")
                .completionTrigger(OnboardingStep.CompletionTrigger.BUTTON_CLICK)
                .points(30)
                .canSkip(true)
                .showBackButton(true)
                .showSkipButton(true)
                .active(true)
                .build();
        flow.addStep(orgSettings);

        // Step 3: User Management
        OnboardingStep userMgmt = OnboardingStep.builder()
                .title("Управление пользователями")
                .titleUz("Foydalanuvchilarni boshqarish")
                .titleRu("Управление пользователями")
                .titleEn("User Management")
                .content("Добавляйте пользователей, настраивайте роли и права доступа.")
                .contentUz("Foydalanuvchilarni qo'shing, rollar va ruxsatlarni sozlang.")
                .contentRu("Добавляйте пользователей, настраивайте роли и права доступа.")
                .contentEn("Add users, configure roles and access permissions.")
                .stepType(OnboardingStep.StepType.SPOTLIGHT)
                .actionType(OnboardingStep.ActionType.NEXT)
                .targetElement("#user-management")
                .targetPage("/admin/users")
                .position(OnboardingStep.TooltipPosition.BOTTOM)
                .icon("users-cog")
                .completionTrigger(OnboardingStep.CompletionTrigger.BUTTON_CLICK)
                .points(30)
                .canSkip(true)
                .showBackButton(true)
                .showSkipButton(true)
                .active(true)
                .build();
        flow.addStep(userMgmt);

        // Step 4: Integrations
        OnboardingStep integrations = OnboardingStep.builder()
                .title("Интеграции")
                .titleUz("Integratsiyalar")
                .titleRu("Интеграции")
                .titleEn("Integrations")
                .content("Подключите внешние системы: HR, CRM, SSO и другие.")
                .contentUz("Tashqi tizimlarni ulang: HR, CRM, SSO va boshqalar.")
                .contentRu("Подключите внешние системы: HR, CRM, SSO и другие.")
                .contentEn("Connect external systems: HR, CRM, SSO, and others.")
                .stepType(OnboardingStep.StepType.TOOLTIP)
                .actionType(OnboardingStep.ActionType.NEXT)
                .targetElement("#integrations")
                .position(OnboardingStep.TooltipPosition.RIGHT)
                .icon("plug")
                .completionTrigger(OnboardingStep.CompletionTrigger.BUTTON_CLICK)
                .points(30)
                .canSkip(true)
                .showBackButton(true)
                .showSkipButton(true)
                .active(true)
                .build();
        flow.addStep(integrations);

        // Step 5: Security
        OnboardingStep security = OnboardingStep.builder()
                .title("Безопасность")
                .titleUz("Xavfsizlik")
                .titleRu("Безопасность")
                .titleEn("Security")
                .content("Настройте политики паролей, двухфакторную аутентификацию и аудит.")
                .contentUz("Parol siyosatlari, ikki faktorli autentifikatsiya va auditni sozlang.")
                .contentRu("Настройте политики паролей, двухфакторную аутентификацию и аудит.")
                .contentEn("Configure password policies, two-factor authentication, and auditing.")
                .stepType(OnboardingStep.StepType.TOOLTIP)
                .actionType(OnboardingStep.ActionType.NEXT)
                .targetElement("#security-settings")
                .position(OnboardingStep.TooltipPosition.LEFT)
                .icon("lock")
                .completionTrigger(OnboardingStep.CompletionTrigger.BUTTON_CLICK)
                .points(30)
                .canSkip(true)
                .showBackButton(true)
                .showSkipButton(true)
                .active(true)
                .build();
        flow.addStep(security);

        // Step 6: Complete
        OnboardingStep complete = OnboardingStep.builder()
                .title("Платформа готова!")
                .titleUz("Platforma tayyor!")
                .titleRu("Платформа готова!")
                .titleEn("Platform Ready!")
                .content("Вы настроили основные параметры. Платформа готова к работе!")
                .contentUz("Asosiy parametrlarni sozladingiz. Platforma ishga tayyor!")
                .contentRu("Вы настроили основные параметры. Платформа готова к работе!")
                .contentEn("You've configured the basic settings. The platform is ready to use!")
                .stepType(OnboardingStep.StepType.CELEBRATION)
                .actionType(OnboardingStep.ActionType.COMPLETE)
                .position(OnboardingStep.TooltipPosition.CENTER)
                .icon("rocket")
                .completionTrigger(OnboardingStep.CompletionTrigger.BUTTON_CLICK)
                .points(170)
                .canSkip(false)
                .showBackButton(true)
                .showSkipButton(false)
                .active(true)
                .build();
        flow.addStep(complete);

        flowRepository.save(flow);
        log.info("Created admin onboarding flow: {}", flow.getSlug());
    }

    // ================== Checklists ==================

    private void createLearnerChecklist() {
        if (checklistRepository.findBySlug("learner-getting-started").isPresent()) {
            return;
        }

        Checklist checklist = Checklist.builder()
                .slug("learner-getting-started")
                .name("Первые шаги")
                .nameUz("Birinchi qadamlar")
                .nameRu("Первые шаги")
                .nameEn("Getting Started")
                .description("Выполните эти действия, чтобы начать обучение")
                .targetRole(OnboardingFlow.TargetRole.LEARNER)
                .icon("rocket")
                .color("#10B981")
                .completionPoints(100)
                .showInDashboard(true)
                .collapsible(true)
                .autoDismissOnComplete(false)
                .active(true)
                .build();

        // Item 1: Complete Profile
        ChecklistItem profile = ChecklistItem.builder()
                .title("Заполните профиль")
                .titleUz("Profilni to'ldiring")
                .titleRu("Заполните профиль")
                .titleEn("Complete your profile")
                .description("Добавьте фото и информацию о себе")
                .icon("user")
                .actionType(ChecklistItem.ActionType.NAVIGATE)
                .actionUrl("/profile/edit")
                .completionType(ChecklistItem.CompletionType.API_CHECK)
                .completionEndpoint("/api/users/me/profile-complete")
                .points(20)
                .required(true)
                .active(true)
                .build();
        checklist.addItem(profile);

        // Item 2: Explore Courses
        ChecklistItem explore = ChecklistItem.builder()
                .title("Изучите каталог курсов")
                .titleUz("Kurslar katalogini o'rganing")
                .titleRu("Изучите каталог курсов")
                .titleEn("Explore course catalog")
                .description("Найдите интересные курсы")
                .icon("search")
                .actionType(ChecklistItem.ActionType.NAVIGATE)
                .actionUrl("/courses")
                .completionType(ChecklistItem.CompletionType.PAGE_VISIT)
                .points(10)
                .required(false)
                .active(true)
                .build();
        checklist.addItem(explore);

        // Item 3: Enroll in Course
        ChecklistItem enroll = ChecklistItem.builder()
                .title("Запишитесь на первый курс")
                .titleUz("Birinchi kursga yozilin")
                .titleRu("Запишитесь на первый курс")
                .titleEn("Enroll in your first course")
                .description("Выберите и начните курс")
                .icon("book-open")
                .actionType(ChecklistItem.ActionType.NAVIGATE)
                .actionUrl("/courses")
                .completionType(ChecklistItem.CompletionType.AUTO_DETECT)
                .completionEvent("course.enrolled")
                .points(30)
                .required(true)
                .active(true)
                .build();
        checklist.addItem(enroll);

        // Item 4: Complete First Lesson
        ChecklistItem lesson = ChecklistItem.builder()
                .title("Завершите первый урок")
                .titleUz("Birinchi darsni yakunlang")
                .titleRu("Завершите первый урок")
                .titleEn("Complete your first lesson")
                .description("Пройдите один урок полностью")
                .icon("play")
                .actionType(ChecklistItem.ActionType.NAVIGATE)
                .actionUrl("/my-courses")
                .completionType(ChecklistItem.CompletionType.AUTO_DETECT)
                .completionEvent("lesson.completed")
                .points(40)
                .required(true)
                .active(true)
                .build();
        checklist.addItem(lesson);

        checklistRepository.save(checklist);
        log.info("Created learner checklist: {}", checklist.getSlug());
    }

    private void createInstructorChecklist() {
        if (checklistRepository.findBySlug("instructor-getting-started").isPresent()) {
            return;
        }

        Checklist checklist = Checklist.builder()
                .slug("instructor-getting-started")
                .name("Начало работы инструктора")
                .nameUz("Instruktorning ish boshlashi")
                .nameRu("Начало работы инструктора")
                .nameEn("Instructor Getting Started")
                .description("Создайте свой первый курс")
                .targetRole(OnboardingFlow.TargetRole.INSTRUCTOR)
                .icon("graduation-cap")
                .color("#6366F1")
                .completionPoints(200)
                .showInDashboard(true)
                .collapsible(true)
                .autoDismissOnComplete(false)
                .active(true)
                .build();

        // Item 1: Complete Instructor Profile
        ChecklistItem profile = ChecklistItem.builder()
                .title("Заполните профиль инструктора")
                .titleUz("Instruktor profilini to'ldiring")
                .titleRu("Заполните профиль инструктора")
                .titleEn("Complete instructor profile")
                .description("Добавьте биографию и опыт")
                .icon("id-card")
                .actionType(ChecklistItem.ActionType.NAVIGATE)
                .actionUrl("/instructor/profile")
                .completionType(ChecklistItem.CompletionType.API_CHECK)
                .completionEndpoint("/api/instructors/me/profile-complete")
                .points(30)
                .required(true)
                .active(true)
                .build();
        checklist.addItem(profile);

        // Item 2: Create First Course
        ChecklistItem createCourse = ChecklistItem.builder()
                .title("Создайте первый курс")
                .titleUz("Birinchi kursni yarating")
                .titleRu("Создайте первый курс")
                .titleEn("Create your first course")
                .description("Начните с названия и описания")
                .icon("plus-circle")
                .actionType(ChecklistItem.ActionType.NAVIGATE)
                .actionUrl("/instructor/courses/new")
                .completionType(ChecklistItem.CompletionType.AUTO_DETECT)
                .completionEvent("course.created")
                .points(40)
                .required(true)
                .active(true)
                .build();
        checklist.addItem(createCourse);

        // Item 3: Add First Lesson
        ChecklistItem addLesson = ChecklistItem.builder()
                .title("Добавьте первый урок")
                .titleUz("Birinchi darsni qo'shing")
                .titleRu("Добавьте первый урок")
                .titleEn("Add your first lesson")
                .description("Загрузите видео или материал")
                .icon("video")
                .actionType(ChecklistItem.ActionType.NAVIGATE)
                .actionUrl("/instructor/courses")
                .completionType(ChecklistItem.CompletionType.AUTO_DETECT)
                .completionEvent("lesson.created")
                .points(50)
                .required(true)
                .active(true)
                .build();
        checklist.addItem(addLesson);

        // Item 4: Publish Course
        ChecklistItem publish = ChecklistItem.builder()
                .title("Опубликуйте курс")
                .titleUz("Kursni nashr qiling")
                .titleRu("Опубликуйте курс")
                .titleEn("Publish your course")
                .description("Сделайте курс доступным для студентов")
                .icon("globe")
                .actionType(ChecklistItem.ActionType.NAVIGATE)
                .actionUrl("/instructor/courses")
                .completionType(ChecklistItem.CompletionType.AUTO_DETECT)
                .completionEvent("course.published")
                .points(80)
                .required(true)
                .active(true)
                .build();
        checklist.addItem(publish);

        checklistRepository.save(checklist);
        log.info("Created instructor checklist: {}", checklist.getSlug());
    }
}
