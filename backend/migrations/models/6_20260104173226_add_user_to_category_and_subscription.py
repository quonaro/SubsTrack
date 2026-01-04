from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP INDEX IF EXISTS "idx_subscriptio_user_id_dbefc0";
        ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_name_key";
        DROP INDEX IF EXISTS "uid_categories_name_c47ef4";
        CREATE TABLE IF NOT EXISTS "history" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "event_type" VARCHAR(50) NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscription_id" INT NOT NULL REFERENCES "subscriptions" ("id") ON DELETE CASCADE
);
COMMENT ON COLUMN "history"."event_type" IS 'Type of event (created, updated, payment, archived, etc.)';
COMMENT ON COLUMN "history"."details" IS 'Detailed changes or metadata about the event';
COMMENT ON COLUMN "history"."created_at" IS 'Timestamp of the event';
COMMENT ON COLUMN "history"."subscription_id" IS 'Related subscription';
COMMENT ON TABLE "history" IS 'Model for tracking subscription history and audit logs';
        ALTER TABLE "categories" ADD "user_id" INT;
        UPDATE "categories" SET "user_id" = (SELECT id FROM "users" LIMIT 1);
        ALTER TABLE "categories" ALTER COLUMN "user_id" SET NOT NULL;
        COMMENT ON COLUMN "categories"."user_id" IS 'User who owns this category';
        ALTER TABLE "categories" ADD CONSTRAINT "fk_categori_users_34b342c9" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
        CREATE UNIQUE INDEX IF NOT EXISTS "uid_categories_user_id_7f9e4d" ON "categories" ("user_id", "name");
        CREATE INDEX IF NOT EXISTS "idx_categories_user_id_7f9e4d" ON "categories" ("user_id", "name");
        CREATE INDEX IF NOT EXISTS "idx_subscriptio_user_id_dbefc0" ON "subscriptions" ("user_id", "is_active");
        -- Also drop the subscription index if it was pointing to something else (though it should be fine)
        DROP INDEX IF EXISTS "idx_subscriptio_user_id_dbefc0";
        CREATE INDEX IF NOT EXISTS "idx_subscriptio_user_id_dbefc0" ON "subscriptions" ("user_id", "is_active");"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP INDEX IF EXISTS "idx_subscriptio_user_id_dbefc0";
        DROP INDEX IF EXISTS "idx_categories_user_id_7f9e4d";
        DROP INDEX IF EXISTS "uid_categories_user_id_7f9e4d";
        ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "fk_categori_users_34b342c9";
        ALTER TABLE "categories" DROP COLUMN "user_id";
        DROP TABLE IF EXISTS "history";
        CREATE UNIQUE INDEX IF NOT EXISTS "uid_categories_name_c47ef4" ON "categories" ("name");
        CREATE INDEX IF NOT EXISTS "idx_subscriptio_user_id_dbefc0" ON "subscriptions" ("user_id", "is_active");"""


MODELS_STATE = (
    "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"
)
