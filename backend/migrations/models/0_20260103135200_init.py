from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "categories" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "name" VARCHAR(50) NOT NULL UNIQUE,
    "color" VARCHAR(20) NOT NULL DEFAULT '#8b5cf6',
    "icon" VARCHAR(10) NOT NULL DEFAULT '📁',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON COLUMN "categories"."name" IS 'Category name';
COMMENT ON COLUMN "categories"."color" IS 'Category color hex code';
COMMENT ON COLUMN "categories"."icon" IS 'Category emoji icon';
COMMENT ON COLUMN "categories"."created_at" IS 'Creation timestamp';
COMMENT ON TABLE "categories" IS 'Category model for grouping subscriptions';
CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "telegram_id" BIGINT NOT NULL UNIQUE,
    "username" VARCHAR(255),
    "first_name" VARCHAR(255),
    "last_name" VARCHAR(255),
    "language_code" VARCHAR(10),
    "is_bot" BOOL NOT NULL DEFAULT False,
    "is_premium" BOOL NOT NULL DEFAULT False,
    "photo_url" VARCHAR(1024),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_users_telegra_ab91e9" ON "users" ("telegram_id");
COMMENT ON COLUMN "users"."telegram_id" IS 'Telegram user ID';
COMMENT ON COLUMN "users"."username" IS 'Telegram username';
COMMENT ON COLUMN "users"."first_name" IS 'User''s first name';
COMMENT ON COLUMN "users"."last_name" IS 'User''s last name';
COMMENT ON COLUMN "users"."language_code" IS 'User''s language code';
COMMENT ON COLUMN "users"."is_bot" IS 'Whether the user is a bot';
COMMENT ON COLUMN "users"."is_premium" IS 'Whether the user has Telegram Premium';
COMMENT ON COLUMN "users"."photo_url" IS 'Telegram user avatar URL';
COMMENT ON COLUMN "users"."created_at" IS 'Account creation timestamp';
COMMENT ON COLUMN "users"."updated_at" IS 'Last update timestamp';
COMMENT ON TABLE "users" IS 'User model for storing Telegram user data';
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'RUB',
    "period_days" INT NOT NULL,
    "start_date" DATE NOT NULL,
    "next_payment_date" DATE NOT NULL,
    "icon" VARCHAR(10) NOT NULL DEFAULT '📦',
    "is_active" BOOL NOT NULL DEFAULT True,
    "reminder_enabled" BOOL NOT NULL DEFAULT True,
    "reminder_days_before" INT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category_id" INT REFERENCES "categories" ("id") ON DELETE CASCADE,
    "user_id" INT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_subscriptio_user_id_dbefc0" ON "subscriptions" ("user_id", "is_active");
COMMENT ON COLUMN "subscriptions"."name" IS 'Subscription name';
COMMENT ON COLUMN "subscriptions"."price" IS 'Subscription price';
COMMENT ON COLUMN "subscriptions"."currency" IS 'Currency code';
COMMENT ON COLUMN "subscriptions"."period_days" IS 'Billing period in days';
COMMENT ON COLUMN "subscriptions"."start_date" IS 'Initial payment date anchor';
COMMENT ON COLUMN "subscriptions"."next_payment_date" IS 'Next scheduled payment date';
COMMENT ON COLUMN "subscriptions"."icon" IS 'Emoji icon';
COMMENT ON COLUMN "subscriptions"."is_active" IS 'Whether subscription is active';
COMMENT ON COLUMN "subscriptions"."reminder_enabled" IS 'Whether reminders are enabled';
COMMENT ON COLUMN "subscriptions"."reminder_days_before" IS 'Days before payment to send reminder';
COMMENT ON COLUMN "subscriptions"."created_at" IS 'Creation timestamp';
COMMENT ON COLUMN "subscriptions"."updated_at" IS 'Last update timestamp';
COMMENT ON COLUMN "subscriptions"."category_id" IS 'Subscription category';
COMMENT ON COLUMN "subscriptions"."user_id" IS 'User who owns this subscription';
COMMENT ON TABLE "subscriptions" IS 'Subscription model for tracking user subscriptions';
CREATE TABLE IF NOT EXISTS "notification_logs" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "sent_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" VARCHAR(50) NOT NULL DEFAULT 'reminder',
    "subscription_id" INT NOT NULL REFERENCES "subscriptions" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_notificatio_subscri_d324d1" ON "notification_logs" ("subscription_id", "sent_at");
COMMENT ON TABLE "notification_logs" IS 'Log of sent notifications to prevent duplicates';
CREATE TABLE IF NOT EXISTS "payment_history" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'RUB',
    "date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscription_id" INT NOT NULL REFERENCES "subscriptions" ("id") ON DELETE CASCADE
);
COMMENT ON COLUMN "payment_history"."amount" IS 'Payment amount';
COMMENT ON COLUMN "payment_history"."currency" IS 'Currency';
COMMENT ON COLUMN "payment_history"."date" IS 'Payment date';
COMMENT ON COLUMN "payment_history"."created_at" IS 'Record creation timestamp';
COMMENT ON COLUMN "payment_history"."subscription_id" IS 'Subscription';
COMMENT ON TABLE "payment_history" IS 'Model for tracking subscription payment history';
CREATE TABLE IF NOT EXISTS "aerich" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "version" VARCHAR(255) NOT NULL,
    "app" VARCHAR(100) NOT NULL,
    "content" JSONB NOT NULL
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        """


MODELS_STATE = (
    "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"
)
