from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        COMMENT ON COLUMN "notification_rules"."rule_type" IS 'ADVANCE_NOTICE: advance_notice
RECURRING_REMINDER: recurring_reminder
PAYMENT_DAY_ALERT: payment_day_alert
URGENT_REMINDER: urgent_reminder';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        COMMENT ON COLUMN "notification_rules"."rule_type" IS 'ADVANCE_NOTICE: advance_notice
RECURRING_REMINDER: recurring_reminder
PAYMENT_DAY_ALERT: payment_day_alert
URGENT_REMINDER: urgent_reminder
WEEKLY_SUMMARY: weekly_summary';"""


MODELS_STATE = (
    "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"
)
