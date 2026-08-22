import { sqliteTable, text, integer, real, unique } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// ─── memory_cards ──────────────────────────────────────────────────
export const memoryCards = sqliteTable('memory_cards', {
  id: text('id').primaryKey(),
  reasonNumber: integer('reason_number').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  note: text('note').notNull(),
  photoUrl: text('photo_url').notNull(),
  imgZoom: real('img_zoom').default(1.0),
  imgX: real('img_x').default(0),
  imgY: real('img_y').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

// ─── user (better-auth extended) ───────────────────────────────────
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  image: text('image'),
  role: text('role'), // 'Husband' | 'Wife' | null
  onboardingComplete: integer('onboarding_complete', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: text('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id),
})

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: text('access_token_expires_at'),
  refreshTokenExpiresAt: text('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ─── shared_meta ───────────────────────────────────────────────────
export const sharedMeta = sqliteTable('shared_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})

// ─── meets ─────────────────────────────────────────────────────────
export const meets = sqliteTable('meets', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  note: text('note').notNull(),
  photoUrl: text('photo_url').notNull(),
  date: text('date').notNull(),
  location: text('location'),
  bestMemory: text('best_memory'),
  soundtrack: text('soundtrack'),
  moodTag: text('mood_tag'),
  timeOfDay: text('time_of_day').notNull(), // 'dawn' | 'day' | 'dusk' | 'night'
  order: integer('order_num').notNull(),
  isUpcoming: integer('is_upcoming', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

// ─── confessions ───────────────────────────────────────────────────
export const confessions = sqliteTable('confessions', {
  id: text('id').primaryKey(),
  authorRole: text('author_role').notNull(), // 'Husband' | 'Wife'
  body: text('body').notNull(),
  toneTag: text('tone_tag').notNull(), // 'sweet' | 'shy' | 'flirty' | 'vulnerable'
  revealAt: text('reveal_at').notNull(),
  openedAt: text('opened_at'),
  openedByRole: text('opened_by_role'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

// ─── profile_extras ────────────────────────────────────────────────
export const profileExtras = sqliteTable('profile_extras', {
  role: text('role').primaryKey(), // 'Husband' | 'Wife'
  tagline: text('tagline'),
  favSong: text('fav_song'),
  comfortFood: text('comfort_food'),
  loveLanguage: text('love_language'),
  quirk: text('quirk'),
  obsession: text('obsession'),
  photoUrl: text('photo_url'),
})

// ─── private_love_lines ───────────────────────────────────────────
export const privateLoveLines = sqliteTable('private_love_lines', {
  id: text('id').primaryKey(),
  authorRole: text('author_role').notNull(),
  targetRole: text('target_role').notNull(),
  lineText: text('line_text').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

// ─── this_or_that_answers ─────────────────────────────────────────
export const thisOrThatAnswers = sqliteTable('this_or_that_answers', {
  id: text('id').primaryKey(),
  role: text('role').notNull(),
  questionKey: text('question_key').notNull(),
  answer: text('answer').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  unqRoleQuestion: unique().on(t.role, t.questionKey),
}))

// ─── fun_facts ─────────────────────────────────────────────────────
export const funFacts = sqliteTable('fun_facts', {
  id: text('id').primaryKey(),
  body: text('body').notNull(),
  order: integer('order').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

// ─── playlist_meta ─────────────────────────────────────────────────
export const playlistMeta = sqliteTable('playlist_meta', {
  id: integer('id').primaryKey().default(1),
  spotifyUrl: text('spotify_url'),
  subtitle: text('subtitle'),
  trackCount: integer('track_count').default(38),
  totalDuration: text('total_duration').default('2h 14m'),
})

// ─── home_hero ─────────────────────────────────────────────────────
export const homeHero = sqliteTable('home_hero', {
  id: integer('id').primaryKey().default(1),
  imageUrl: text('image_url').notNull(),
})

// ─── birthday_config ───────────────────────────────────────────────
export const birthdayConfig = sqliteTable('birthday_config', {
  id: integer('id').primaryKey().default(1),
  activeDate: text('active_date').notNull(),
  windowDaysBefore: integer('window_days_before').default(7),
  headline_text: text('headline_text'),
  note_text: text('note_text'),
})

// ─── birthday_wishes ───────────────────────────────────────────────
export const birthdayWishes = sqliteTable('birthday_wishes', {
  id: text('id').primaryKey(),
  authorRole: text('author_role').notNull(),
  text: text('text').notNull(),
  year: integer('year').notNull(),
  shownToPartner: integer('shown_to_partner', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  unqAuthorYear: unique().on(t.authorRole, t.year),
}))

// ─── password_reset_otps ───────────────────────────────────────────
export const passwordResetOtps = sqliteTable('password_reset_otps', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  otpHash: text('otp_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  attempts: integer('attempts').default(0),
  lockedUntil: text('locked_until'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})
