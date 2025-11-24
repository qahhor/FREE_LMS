import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1700000000000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");
      CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" ("role");
      CREATE INDEX IF NOT EXISTS "idx_users_created" ON "users" ("created_at");
    `);

    // Courses table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_courses_status" ON "courses" ("status");
      CREATE INDEX IF NOT EXISTS "idx_courses_category" ON "courses" ("category_id");
      CREATE INDEX IF NOT EXISTS "idx_courses_instructor" ON "courses" ("instructor_id");
      CREATE INDEX IF NOT EXISTS "idx_courses_created" ON "courses" ("created_at");
      CREATE INDEX IF NOT EXISTS "idx_courses_published" ON "courses" ("published_at");
    `);

    // Enrollments table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_enrollments_user" ON "enrollments" ("user_id");
      CREATE INDEX IF NOT EXISTS "idx_enrollments_course" ON "enrollments" ("course_id");
      CREATE INDEX IF NOT EXISTS "idx_enrollments_status" ON "enrollments" ("status");
      CREATE INDEX IF NOT EXISTS "idx_enrollments_user_course" ON "enrollments" ("user_id", "course_id");
      CREATE INDEX IF NOT EXISTS "idx_enrollments_created" ON "enrollments" ("created_at");
    `);

    // Lessons table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_lessons_course" ON "lessons" ("course_id");
      CREATE INDEX IF NOT EXISTS "idx_lessons_order" ON "lessons" ("order");
      CREATE INDEX IF NOT EXISTS "idx_lessons_course_order" ON "lessons" ("course_id", "order");
    `);

    // Progress table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_progress_user" ON "progress" ("user_id");
      CREATE INDEX IF NOT EXISTS "idx_progress_lesson" ON "lesson_progress" ("lesson_id");
      CREATE INDEX IF NOT EXISTS "idx_progress_user_lesson" ON "lesson_progress" ("user_id", "lesson_id");
      CREATE INDEX IF NOT EXISTS "idx_progress_completed" ON "lesson_progress" ("completed");
      CREATE INDEX IF NOT EXISTS "idx_progress_updated" ON "lesson_progress" ("updated_at");
    `);

    // Subscriptions table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_subscriptions_user" ON "subscriptions" ("user_id");
      CREATE INDEX IF NOT EXISTS "idx_subscriptions_plan" ON "subscriptions" ("plan_id");
      CREATE INDEX IF NOT EXISTS "idx_subscriptions_status" ON "subscriptions" ("status");
      CREATE INDEX IF NOT EXISTS "idx_subscriptions_trial_end" ON "subscriptions" ("trial_ends_at");
      CREATE INDEX IF NOT EXISTS "idx_subscriptions_current_period" ON "subscriptions" ("current_period_end");
    `);

    // Payments table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_payments_user" ON "payments" ("user_id");
      CREATE INDEX IF NOT EXISTS "idx_payments_status" ON "payments" ("status");
      CREATE INDEX IF NOT EXISTS "idx_payments_gateway" ON "payments" ("gateway");
      CREATE INDEX IF NOT EXISTS "idx_payments_transaction" ON "payments" ("transaction_id");
      CREATE INDEX IF NOT EXISTS "idx_payments_created" ON "payments" ("created_at");
    `);

    // Organizations table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_organizations_slug" ON "organizations" ("slug");
      CREATE INDEX IF NOT EXISTS "idx_organizations_owner" ON "organizations" ("owner_id");
      CREATE INDEX IF NOT EXISTS "idx_organizations_created" ON "organizations" ("created_at");
    `);

    // Organization Members table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_org_members_org" ON "organization_members" ("organization_id");
      CREATE INDEX IF NOT EXISTS "idx_org_members_user" ON "organization_members" ("user_id");
      CREATE INDEX IF NOT EXISTS "idx_org_members_role" ON "organization_members" ("role");
      CREATE INDEX IF NOT EXISTS "idx_org_members_active" ON "organization_members" ("is_active");
      CREATE INDEX IF NOT EXISTS "idx_org_members_org_user" ON "organization_members" ("organization_id", "user_id");
    `);

    // SCORM Packages table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_scorm_packages_user" ON "scorm_packages" ("user_id");
      CREATE INDEX IF NOT EXISTS "idx_scorm_packages_version" ON "scorm_packages" ("version");
      CREATE INDEX IF NOT EXISTS "idx_scorm_packages_created" ON "scorm_packages" ("created_at");
    `);

    // SCORM Tracking table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_scorm_tracking_package" ON "scorm_tracking" ("package_id");
      CREATE INDEX IF NOT EXISTS "idx_scorm_tracking_user" ON "scorm_tracking" ("user_id");
      CREATE INDEX IF NOT EXISTS "idx_scorm_tracking_session" ON "scorm_tracking" ("session_id");
      CREATE INDEX IF NOT EXISTS "idx_scorm_tracking_status" ON "scorm_tracking" ("lesson_status");
      CREATE INDEX IF NOT EXISTS "idx_scorm_tracking_package_user" ON "scorm_tracking" ("package_id", "user_id");
    `);

    // Webinars table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_webinars_instructor" ON "webinars" ("instructor_id");
      CREATE INDEX IF NOT EXISTS "idx_webinars_status" ON "webinars" ("status");
      CREATE INDEX IF NOT EXISTS "idx_webinars_scheduled" ON "webinars" ("scheduled_at");
      CREATE INDEX IF NOT EXISTS "idx_webinars_provider" ON "webinars" ("provider");
    `);

    // Webinar Participants table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_webinar_participants_webinar" ON "webinar_participants" ("webinar_id");
      CREATE INDEX IF NOT EXISTS "idx_webinar_participants_user" ON "webinar_participants" ("user_id");
      CREATE INDEX IF NOT EXISTS "idx_webinar_participants_status" ON "webinar_participants" ("status");
      CREATE INDEX IF NOT EXISTS "idx_webinar_participants_webinar_user" ON "webinar_participants" ("webinar_id", "user_id");
    `);

    // Quizzes table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_quizzes_course" ON "quizzes" ("course_id");
      CREATE INDEX IF NOT EXISTS "idx_quizzes_lesson" ON "quizzes" ("lesson_id");
    `);

    // Quiz Attempts table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_quiz_attempts_quiz" ON "quiz_attempts" ("quiz_id");
      CREATE INDEX IF NOT EXISTS "idx_quiz_attempts_user" ON "quiz_attempts" ("user_id");
      CREATE INDEX IF NOT EXISTS "idx_quiz_attempts_completed" ON "quiz_attempts" ("completed_at");
      CREATE INDEX IF NOT EXISTS "idx_quiz_attempts_quiz_user" ON "quiz_attempts" ("quiz_id", "user_id");
    `);

    // Certificates table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_certificates_user" ON "certificates" ("user_id");
      CREATE INDEX IF NOT EXISTS "idx_certificates_course" ON "certificates" ("course_id");
      CREATE INDEX IF NOT EXISTS "idx_certificates_code" ON "certificates" ("verification_code");
      CREATE INDEX IF NOT EXISTS "idx_certificates_issued" ON "certificates" ("issued_at");
    `);

    // Forum Posts table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_forum_posts_course" ON "forum_posts" ("course_id");
      CREATE INDEX IF NOT EXISTS "idx_forum_posts_author" ON "forum_posts" ("author_id");
      CREATE INDEX IF NOT EXISTS "idx_forum_posts_created" ON "forum_posts" ("created_at");
    `);

    // Forum Comments table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_forum_comments_post" ON "forum_comments" ("post_id");
      CREATE INDEX IF NOT EXISTS "idx_forum_comments_author" ON "forum_comments" ("author_id");
      CREATE INDEX IF NOT EXISTS "idx_forum_comments_created" ON "forum_comments" ("created_at");
    `);

    // Full-text search indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_courses_title_search" ON "courses" USING GIN (to_tsvector('english', title));
      CREATE INDEX IF NOT EXISTS "idx_courses_description_search" ON "courses" USING GIN (to_tsvector('english', description));
      CREATE INDEX IF NOT EXISTS "idx_forum_posts_search" ON "forum_posts" USING GIN (to_tsvector('english', title || ' ' || content));
    `);

    console.log('Performance indexes created successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all indexes in reverse order
    const indexes = [
      'idx_users_email', 'idx_users_role', 'idx_users_created',
      'idx_courses_status', 'idx_courses_category', 'idx_courses_instructor',
      'idx_courses_created', 'idx_courses_published',
      'idx_enrollments_user', 'idx_enrollments_course', 'idx_enrollments_status',
      'idx_enrollments_user_course', 'idx_enrollments_created',
      'idx_lessons_course', 'idx_lessons_order', 'idx_lessons_course_order',
      'idx_progress_user', 'idx_progress_lesson', 'idx_progress_user_lesson',
      'idx_progress_completed', 'idx_progress_updated',
      'idx_subscriptions_user', 'idx_subscriptions_plan', 'idx_subscriptions_status',
      'idx_subscriptions_trial_end', 'idx_subscriptions_current_period',
      'idx_payments_user', 'idx_payments_status', 'idx_payments_gateway',
      'idx_payments_transaction', 'idx_payments_created',
      'idx_organizations_slug', 'idx_organizations_owner', 'idx_organizations_created',
      'idx_org_members_org', 'idx_org_members_user', 'idx_org_members_role',
      'idx_org_members_active', 'idx_org_members_org_user',
      'idx_scorm_packages_user', 'idx_scorm_packages_version', 'idx_scorm_packages_created',
      'idx_scorm_tracking_package', 'idx_scorm_tracking_user', 'idx_scorm_tracking_session',
      'idx_scorm_tracking_status', 'idx_scorm_tracking_package_user',
      'idx_webinars_instructor', 'idx_webinars_status', 'idx_webinars_scheduled', 'idx_webinars_provider',
      'idx_webinar_participants_webinar', 'idx_webinar_participants_user',
      'idx_webinar_participants_status', 'idx_webinar_participants_webinar_user',
      'idx_quizzes_course', 'idx_quizzes_lesson',
      'idx_quiz_attempts_quiz', 'idx_quiz_attempts_user', 'idx_quiz_attempts_completed',
      'idx_quiz_attempts_quiz_user',
      'idx_certificates_user', 'idx_certificates_course', 'idx_certificates_code', 'idx_certificates_issued',
      'idx_forum_posts_course', 'idx_forum_posts_author', 'idx_forum_posts_created',
      'idx_forum_comments_post', 'idx_forum_comments_author', 'idx_forum_comments_created',
      'idx_courses_title_search', 'idx_courses_description_search', 'idx_forum_posts_search'
    ];

    for (const index of indexes) {
      await queryRunner.query(`DROP INDEX IF EXISTS "${index}"`);
    }
  }
}
