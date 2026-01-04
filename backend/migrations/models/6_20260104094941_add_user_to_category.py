from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        -- Add user_id column to categories table
        ALTER TABLE "categories" ADD "user_id" INT NOT NULL DEFAULT 1;
        
        -- Add foreign key constraint
        ALTER TABLE "categories" ADD CONSTRAINT "fk_categor_users_user_id" 
            FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
        
        -- Drop old unique constraint on name
        ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "uid_categories_name";
        
        -- Add unique constraint on (user_id, name)
        ALTER TABLE "categories" ADD CONSTRAINT "uid_categories_user_id_name" 
            UNIQUE ("user_id", "name");
        
        -- Create index for performance
        CREATE INDEX IF NOT EXISTS "idx_categories_user_id_name" 
            ON "categories" ("user_id", "name");
        
        COMMENT ON COLUMN "categories"."user_id" IS 'User who owns this category';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        -- Drop index
        DROP INDEX IF EXISTS "idx_categories_user_id_name";
        
        -- Drop unique constraint on (user_id, name)
        ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "uid_categories_user_id_name";
        
        -- Add back unique constraint on name
        ALTER TABLE "categories" ADD CONSTRAINT "uid_categories_name" UNIQUE ("name");
        
        -- Drop foreign key constraint
        ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "fk_categor_users_user_id";
        
        -- Drop user_id column
        ALTER TABLE "categories" DROP COLUMN "user_id";"""


MODELS_STATE = (
    "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"
    "f8kuXZv7jrJnVt00Mk6DLLLy3jP/wc7ncQQ"
)
