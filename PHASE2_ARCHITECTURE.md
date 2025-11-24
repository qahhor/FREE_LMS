# Phase 2: Community & Engagement - Архитектура

## 📋 Цели Phase 2

**Главная цель:** Создание активного сообщества вокруг платформы

**Метрики успеха:**
- 1000+ активных пользователей
- 50+ курсов
- Completion rate >60%
- NPS (Net Promoter Score) >8

---

## 🏗️ Архитектура систем

### 1. 💬 Forum & Comments System

#### Backend Entities:

```typescript
// ForumCategory - Категории форума
@Entity('forum_categories')
export class ForumCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  slug: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ default: 0 })
  orderIndex: number;

  @OneToMany(() => ForumTopic, topic => topic.category)
  topics: ForumTopic[];

  @Column({ default: 0 })
  topicsCount: number;

  @Column({ default: 0 })
  postsCount: number;
}

// ForumTopic - Темы обсуждения
@Entity('forum_topics')
export class ForumTopic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => User)
  author: User;

  @ManyToOne(() => ForumCategory)
  category: ForumCategory;

  @OneToMany(() => ForumPost, post => post.topic)
  posts: ForumPost[];

  @Column({ default: false })
  isPinned: boolean;

  @Column({ default: false })
  isLocked: boolean;

  @Column({ default: 0 })
  viewsCount: number;

  @Column({ default: 0 })
  repliesCount: number;

  @Column({ default: 0 })
  likesCount: number;

  @ManyToMany(() => Tag)
  @JoinTable()
  tags: Tag[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastPostAt: Date;
}

// ForumPost - Ответы в темах
@Entity('forum_posts')
export class ForumPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => User)
  author: User;

  @ManyToOne(() => ForumTopic)
  topic: ForumTopic;

  @ManyToOne(() => ForumPost, { nullable: true })
  replyTo: ForumPost;

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: false })
  isEdited: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Comment - Комментарии к курсам/урокам
@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => User)
  author: User;

  // Polymorphic relation
  @Column()
  commentableType: 'course' | 'lesson';

  @Column()
  commentableId: number;

  @ManyToOne(() => Comment, { nullable: true })
  parentComment: Comment;

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: false })
  isEdited: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Like - Лайки для контента
@Entity('likes')
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Column()
  likeableType: 'topic' | 'post' | 'comment';

  @Column()
  likeableId: number;

  @CreateDateColumn()
  createdAt: Date;

  @Index(['user', 'likeableType', 'likeableId'], { unique: true })
}
```

#### API Endpoints:

**Forum:**
- `GET /api/forum/categories` - Список категорий
- `GET /api/forum/categories/:id/topics` - Темы в категории
- `POST /api/forum/topics` - Создать тему
- `GET /api/forum/topics/:id` - Детали темы + посты
- `POST /api/forum/topics/:id/posts` - Добавить ответ
- `POST /api/forum/topics/:id/like` - Лайкнуть тему
- `PUT /api/forum/topics/:id/pin` - Закрепить тему (admin)
- `PUT /api/forum/topics/:id/lock` - Закрыть тему (admin)

**Comments:**
- `GET /api/courses/:id/comments` - Комментарии курса
- `GET /api/lessons/:id/comments` - Комментарии урока
- `POST /api/comments` - Создать комментарий
- `POST /api/comments/:id/reply` - Ответить на комментарий
- `POST /api/comments/:id/like` - Лайкнуть комментарий
- `PUT /api/comments/:id` - Редактировать комментарий
- `DELETE /api/comments/:id` - Удалить комментарий

---

### 2. 💌 Private Messages System

#### Backend Entities:

```typescript
// Conversation - Приватные переписки
@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToMany(() => User)
  @JoinTable()
  participants: User[];

  @Column({ nullable: true })
  title: string; // для групповых чатов

  @Column({ default: false })
  isGroup: boolean;

  @OneToMany(() => Message, message => message.conversation)
  messages: Message[];

  @Column({ nullable: true })
  lastMessageAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Message - Сообщения
@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => User)
  sender: User;

  @ManyToOne(() => Conversation)
  conversation: Conversation;

  @Column({ nullable: true })
  attachmentUrl: string;

  @Column({ nullable: true })
  attachmentType: string;

  @Column({ default: false })
  isEdited: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// MessageRead - Прочитанные сообщения
@Entity('message_reads')
export class MessageRead {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Message)
  message: Message;

  @CreateDateColumn()
  readAt: Date;

  @Index(['user', 'message'], { unique: true })
}
```

#### API Endpoints:

- `GET /api/messages/conversations` - Список переписок
- `GET /api/messages/conversations/:id` - Сообщения в переписке
- `POST /api/messages/conversations` - Начать переписку
- `POST /api/messages/conversations/:id/messages` - Отправить сообщение
- `PUT /api/messages/:id/read` - Отметить как прочитанное
- `DELETE /api/messages/:id` - Удалить сообщение
- `GET /api/messages/unread-count` - Количество непрочитанных

---

### 3. 👤 Public User Profiles

#### Extended User Entity:

```typescript
@Entity('users')
export class User extends BaseEntity {
  // ... существующие поля ...

  // Публичный профиль
  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  coverImageUrl: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  linkedinUrl: string;

  @Column({ nullable: true })
  githubUrl: string;

  @Column({ nullable: true })
  twitterUrl: string;

  @Column({ default: true })
  isProfilePublic: boolean;

  @Column({ default: true })
  showBadges: boolean;

  @Column({ default: true })
  showCourses: boolean;

  @Column({ default: false })
  showActivity: boolean;

  // Статистика
  @Column({ default: 0 })
  followersCount: number;

  @Column({ default: 0 })
  followingCount: number;

  @Column({ default: 0 })
  totalPoints: number;

  @Column({ default: 0 })
  coursesCompleted: number;

  @Column({ default: 0 })
  coursesCreated: number;
}

// UserFollow - Подписки на пользователей
@Entity('user_follows')
export class UserFollow {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  follower: User;

  @ManyToOne(() => User)
  following: User;

  @CreateDateColumn()
  createdAt: Date;

  @Index(['follower', 'following'], { unique: true })
}

// ActivityFeed - Лента активности
@Entity('activity_feed')
export class ActivityFeed {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Column()
  activityType: 'course_completed' | 'badge_earned' | 'level_up' |
                 'course_created' | 'comment_posted' | 'topic_created';

  @Column({ type: 'json' })
  metadata: any; // детали активности

  @CreateDateColumn()
  createdAt: Date;
}
```

#### API Endpoints:

- `GET /api/users/:username/profile` - Публичный профиль
- `PUT /api/users/profile` - Обновить свой профиль
- `POST /api/users/:id/follow` - Подписаться
- `DELETE /api/users/:id/unfollow` - Отписаться
- `GET /api/users/:username/activity` - Лента активности
- `GET /api/users/:username/badges` - Достижения пользователя
- `GET /api/users/:username/courses` - Курсы пользователя
- `GET /api/users/:username/followers` - Подписчики
- `GET /api/users/:username/following` - Подписки

---

### 4. 🏆 Extended Gamification (50+ Achievements)

#### Badge Categories (расширенные):

```typescript
export enum BadgeCategory {
  // Обучение
  LEARNING = 'learning',           // Прохождение курсов
  KNOWLEDGE = 'knowledge',          // Квизы и тесты
  MASTERY = 'mastery',              // Мастерство в категориях

  // Социальные
  SOCIAL = 'social',                // Взаимодействие с сообществом
  TEACHING = 'teaching',            // Создание контента
  HELPING = 'helping',              // Помощь другим

  // Достижения
  STREAK = 'streak',                // Серии активности
  POINTS = 'points',                // Накопление очков
  COMPLETION = 'completion',        // Завершение курсов

  // Специальные
  EARLY_BIRD = 'early_bird',        // Ранние пользователи
  SEASONAL = 'seasonal',            // Сезонные события
  LIMITED = 'limited',              // Ограниченные по времени
  HIDDEN = 'hidden',                // Секретные достижения
}

export enum BadgeRarity {
  COMMON = 'common',                // 1-50 баллов
  UNCOMMON = 'uncommon',            // 51-100 баллов
  RARE = 'rare',                    // 101-250 баллов
  EPIC = 'epic',                    // 251-500 баллов
  LEGENDARY = 'legendary',          // 501+ баллов
  MYTHIC = 'mythic',                // Уникальные достижения
}
```

#### 50+ Achievement Examples:

**Learning (15 badges):**
1. First Steps - Завершить первый урок
2. Getting Started - Завершить первый курс
3. Knowledge Seeker - 5 курсов
4. Course Enthusiast - 10 курсов
5. Learning Machine - 25 курсов
6. Master Student - 50 курсов
7. Ultimate Learner - 100 курсов
8. Speed Runner - Курс за 24 часа
9. Marathon Runner - Курс 10+ часов
10. Jack of All Trades - Курсы из 5 категорий
11. Specialist - 5 курсов одной категории
12. Expert - 10 курсов одной категории
13. Night Owl - Учеба после 23:00
14. Early Bird - Учеба до 7:00
15. Weekend Warrior - 10 уроков за выходные

**Knowledge (10 badges):**
16. Quiz Novice - 10 квизов
17. Quiz Expert - 50 квизов
18. Quiz Master - 100 квизов
19. Perfect Score - 100% в квизе
20. Ace - 100% в 5 квизах
21. Perfectionist - 100% в 25 квизах
22. Quick Thinker - Квиз за 5 минут
23. Thorough - Все вопросы в курсе
24. Persistent - 10 попыток на квиз
25. First Try - Квиз с первой попытки

**Social (10 badges):**
26. Conversationalist - 10 комментариев
27. Community Member - 50 комментариев
28. Community Leader - 200 комментариев
29. Discussion Starter - 5 тем на форуме
30. Popular - 100 лайков
31. Influencer - 500 лайков
32. Helpful - 25 лучших ответов
33. Mentor - Помощь 10 студентам
34. Friend - 10 подписчиков
35. Celebrity - 100 подписчиков

**Teaching (8 badges):**
36. Content Creator - Создать курс
37. Published Author - 3 курса
38. Prolific Creator - 10 курсов
39. Popular Instructor - 100 студентов
40. Top Instructor - 1000 студентов
41. Highly Rated - Рейтинг 4.5+
42. Quality Content - 5 курсов 4.5+
43. Student Favorite - 10 5-star отзывов

**Streak (7 badges):**
44. Streak Starter - 3 дня подряд
45. Dedicated - 7 дней подряд
46. Consistent - 14 дней подряд
47. Committed - 30 дней подряд
48. Unstoppable - 60 дней подряд
49. Legendary Streak - 100 дней подряд
50. Eternal - 365 дней подряд

**Special (10 badges):**
51. Early Adopter - Первые 100 пользователей
52. Beta Tester - Участие в бета-тестировании
53. Bug Hunter - Найти 10 багов
54. Referral Master - 10 рефералов
55. Generous - 50 рефералов
56. Holiday Spirit - Активность на праздники
57. New Year Champion - Новогоднее событие
58. Birthday Gift - Активность в день рождения
59. Certificate Collector - 10 сертификатов
60. Ultimate Champion - Все достижения (секрет)

---

### 5. 🔥 Streak System

#### Backend Entity:

```typescript
@Entity('user_streaks')
export class UserStreak {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Column({ default: 0 })
  currentStreak: number;

  @Column({ default: 0 })
  longestStreak: number;

  @Column({ nullable: true })
  lastActivityDate: Date;

  @Column({ default: 0 })
  totalActiveDays: number;

  @Column({ default: 0 })
  streakFreezesAvailable: number;

  @Column({ nullable: true })
  streakFreezeUsedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('daily_activities')
export class DailyActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'json' })
  activities: {
    lessonsCompleted: number;
    quizzesCompleted: number;
    commentsPosted: number;
    minutesSpent: number;
  };

  @Column({ default: 0 })
  pointsEarned: number;

  @Index(['user', 'date'], { unique: true })
}
```

#### Streak Rewards:

- 3 дня → +50 points, Streak Starter badge
- 7 дней → +150 points, 1 streak freeze
- 14 дней → +300 points
- 30 дней → +750 points, 2 streak freezes
- 60 дней → +1500 points, Rare badge
- 100 дней → +3000 points, Epic badge
- 365 дней → +10000 points, Legendary badge

---

### 6. 👥 Referral Program

#### Backend Entities:

```typescript
@Entity('referral_codes')
export class ReferralCode {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  owner: User;

  @Column({ unique: true })
  code: string; // user-friendly код (USER-ABC123)

  @Column({ default: 0 })
  usageCount: number;

  @Column({ nullable: true })
  maxUses: number;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  referrer: User; // кто пригласил

  @ManyToOne(() => User)
  referee: User; // кого пригласили

  @ManyToOne(() => ReferralCode)
  code: ReferralCode;

  @Column({ default: 'pending' })
  status: 'pending' | 'completed' | 'rewarded';

  @Column({ type: 'json', nullable: true })
  rewards: {
    referrerPoints: number;
    refereePoints: number;
    referrerBadge?: string;
  };

  @Column({ nullable: true })
  completedAt: Date; // когда реферал завершил первый курс

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('referral_rewards')
export class ReferralReward {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  minReferrals: number;

  @Column()
  points: number;

  @Column({ nullable: true })
  badgeId: number;

  @Column({ type: 'text', nullable: true })
  description: string;
}
```

#### Referral Rewards Structure:

- **Реферал регистрируется:** Referrer +100 points, Referee +50 points
- **Реферал завершает первый курс:** Referrer +500 points, Referee +250 points
- **5 рефералов:** +1000 points, "Referral Enthusiast" badge
- **10 рефералов:** +3000 points, "Referral Master" badge
- **50 рефералов:** +15000 points, "Referral Legend" badge (Epic)

#### API Endpoints:

- `GET /api/referrals/my-code` - Мой реферальный код
- `POST /api/referrals/generate-code` - Создать новый код
- `GET /api/referrals/stats` - Статистика рефералов
- `POST /api/auth/register?ref=CODE` - Регистрация с реферальным кодом
- `GET /api/referrals/leaderboard` - Топ по рефералам

---

### 7. 📈 Advanced Analytics Dashboard

#### Metrics для Инструкторов:

```typescript
@Entity('course_analytics')
export class CourseAnalytics {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Course)
  course: Course;

  @Column({ type: 'date' })
  date: Date;

  // Engagement metrics
  @Column({ default: 0 })
  enrollments: number;

  @Column({ default: 0 })
  activeStudents: number;

  @Column({ default: 0 })
  completions: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  completionRate: number;

  // Time metrics
  @Column({ default: 0 })
  totalWatchTime: number; // минуты

  @Column({ default: 0 })
  averageWatchTime: number;

  // Engagement
  @Column({ default: 0 })
  commentsCount: number;

  @Column({ default: 0 })
  questionsCount: number;

  @Column({ default: 0 })
  likesCount: number;

  // Quiz performance
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  averageQuizScore: number;

  @Column({ default: 0 })
  quizAttempts: number;

  // Revenue (if paid)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  revenue: number;

  @Index(['course', 'date'], { unique: true })
}

@Entity('student_engagement_metrics')
export class StudentEngagementMetrics {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  student: User;

  @ManyToOne(() => Course)
  course: Course;

  // Engagement score (0-100)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  engagementScore: number;

  @Column({ default: 0 })
  lessonsViewed: number;

  @Column({ default: 0 })
  videosWatched: number;

  @Column({ default: 0 })
  quizzesCompleted: number;

  @Column({ default: 0 })
  commentsPosted: number;

  @Column({ default: 0 })
  totalTimeSpent: number;

  @Column({ nullable: true })
  lastActivityAt: Date;

  @Column({ type: 'date', nullable: true })
  estimatedCompletionDate: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### Analytics Dashboard Features:

**Overview:**
- Total students
- Active students (7/30 days)
- Completion rate
- Average rating
- Revenue (if paid)

**Engagement:**
- Daily/Weekly/Monthly active users
- Watch time trends
- Drop-off analysis (которые уроки покидают)
- Engagement funnel

**Student Performance:**
- Quiz scores distribution
- Completion time distribution
- Struggle points (где студенты застревают)
- Top performers

**Content Performance:**
- Most watched lessons
- Most replayed sections
- Lesson completion rates
- Student feedback heatmap

**Revenue Analytics (future):**
- Revenue trends
- Conversion rates
- Coupon performance
- Refund rates

#### API Endpoints:

- `GET /api/analytics/courses/:id/overview` - Обзор
- `GET /api/analytics/courses/:id/engagement` - Вовлеченность
- `GET /api/analytics/courses/:id/students` - Студенты
- `GET /api/analytics/courses/:id/content` - Контент
- `GET /api/analytics/courses/:id/quiz-performance` - Квизы
- `GET /api/analytics/instructor/dashboard` - Общий дашборд
- `GET /api/analytics/cohort/:id` - Когортный анализ

---

## 🔄 Integration Points

### Existing Systems Integration:

1. **Gamification + Forum:**
   - Points за создание тем/постов
   - Badges за активность на форуме
   - Reputation system

2. **Progress Tracking + Analytics:**
   - Real-time metrics
   - Engagement scoring
   - Predictive completion dates

3. **Email + All Systems:**
   - Forum mentions/replies
   - New messages notification
   - Streak reminders
   - Referral rewards
   - Weekly analytics digest

4. **Certificates + Public Profiles:**
   - Display certificates on profile
   - Share to social media
   - Verification link

---

## 🗄️ Database Changes

### New Modules:
1. `community` - Forum, Comments, Likes
2. `messaging` - Conversations, Messages
3. `social` - Profiles, Follows, Activity
4. `analytics` - Course/Student metrics
5. `referrals` - Referral system

### Modified Modules:
1. `users` - Extended profile fields
2. `gamification` - More badges, streaks
3. `email` - New notification types

---

## 🎨 Frontend Components

### New Pages:
1. `/forum` - Forum categories
2. `/forum/:category` - Topics list
3. `/forum/topic/:id` - Topic with posts
4. `/messages` - Private messages inbox
5. `/messages/:id` - Conversation view
6. `/profile/:username` - Public profile
7. `/analytics` - Instructor dashboard
8. `/referrals` - Referral program page

### New Components:
1. `ForumTopicList` - Список тем
2. `ForumTopicView` - Просмотр темы
3. `CommentSection` - Комментарии
4. `MessageInbox` - Inbox компонент
5. `ConversationView` - Чат интерфейс
6. `PublicProfile` - Публичный профиль
7. `ActivityFeed` - Лента активности
8. `StreakWidget` - Виджет стрика
9. `ReferralDashboard` - Дашборд рефералов
10. `AnalyticsDashboard` - Аналитика
11. `EngagementChart` - Графики
12. `BadgeShowcase` - Витрина достижений

---

## 📱 Real-time Features (WebSocket)

### Events to Implement:

1. **Messages:**
   - `message:new` - Новое сообщение
   - `message:read` - Прочитано
   - `user:typing` - Печатает

2. **Notifications:**
   - `notification:new` - Новое уведомление
   - `badge:unlocked` - Разблокирован badge
   - `streak:updated` - Обновлен стрик

3. **Forum:**
   - `topic:new_post` - Новый пост в теме
   - `comment:new_reply` - Ответ на комментарий

---

## 🔒 Security & Permissions

### Role-based Access:

**Student:**
- Create topics/posts/comments
- Send messages
- View public profiles
- Use referral codes

**Instructor:**
- All student permissions
- View analytics for own courses
- Pin/lock own course comments

**Moderator:**
- All instructor permissions
- Delete inappropriate content
- Ban users from forum
- Edit forum categories

**Admin:**
- All permissions
- Manage forum categories
- View all analytics
- Configure referral rewards

---

## 🚀 Performance Considerations

1. **Caching Strategy:**
   - Forum categories (1 hour)
   - User profiles (30 min)
   - Analytics data (5 min)
   - Leaderboards (15 min)

2. **Database Indexes:**
   - Forum: category_id, created_at, is_pinned
   - Messages: conversation_id, created_at
   - Analytics: course_id, date
   - Activity: user_id, created_at

3. **Pagination:**
   - Forum topics: 20 per page
   - Posts: 10 per page
   - Messages: 50 per page
   - Analytics: Date range limits

---

## 📋 Implementation Order

**Priority 1 (Core Community):**
1. Forum & Comments System
2. Public Profiles
3. Extended Gamification

**Priority 2 (Engagement):**
4. Streak System
5. Private Messages
6. Referral Program

**Priority 3 (Insights):**
7. Advanced Analytics

---

## 🧪 Testing Strategy

1. **Unit Tests:**
   - All services methods
   - Badge unlock logic
   - Streak calculation
   - Analytics calculations

2. **Integration Tests:**
   - Forum workflow
   - Message sending
   - Referral tracking
   - Analytics data collection

3. **E2E Tests:**
   - Create topic and reply
   - Send and receive message
   - Profile updates
   - Analytics dashboard load

---

## 📊 Success Metrics

**Technical:**
- API response time <200ms (p95)
- WebSocket latency <100ms
- Database query time <50ms
- Page load time <2s

**Business:**
- 1000+ active users (30 days)
- 50+ published courses
- Forum: 100+ topics, 500+ posts
- Messages: 1000+ sent per week
- Completion rate >60%
- NPS score >8

---

*Архитектура Phase 2*
*Дата: Ноябрь 2024*
*Version: 1.0*
