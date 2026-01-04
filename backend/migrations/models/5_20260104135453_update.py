from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        COMMENT ON COLUMN "notification_rules"."rule_type" IS 'ADVANCE_NOTICE: advance_notice
RECURRING_REMINDER: recurring_reminder
PAYMENT_DAY_ALERT: payment_day_alert
SINGLE_REMINDER: single_reminder';
        ALTER TABLE "users" ADD "timezone" VARCHAR(50);
        COMMENT ON COLUMN "users"."timezone" IS 'User timezone (IANA format)';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "users" DROP COLUMN "timezone";
        COMMENT ON COLUMN "notification_rules"."rule_type" IS 'ADVANCE_NOTICE: advance_notice
RECURRING_REMINDER: recurring_reminder
PAYMENT_DAY_ALERT: payment_day_alert';"""


MODELS_STATE = (
    "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"
)
