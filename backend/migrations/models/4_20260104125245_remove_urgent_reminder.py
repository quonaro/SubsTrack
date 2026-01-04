from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        COMMENT ON COLUMN "notification_rules"."rule_type" IS 'ADVANCE_NOTICE: advance_notice
RECURRING_REMINDER: recurring_reminder
PAYMENT_DAY_ALERT: payment_day_alert';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        COMMENT ON COLUMN "notification_rules"."rule_type" IS 'ADVANCE_NOTICE: advance_notice
RECURRING_REMINDER: recurring_reminder
PAYMENT_DAY_ALERT: payment_day_alert
URGENT_REMINDER: urgent_reminder';"""


MODELS_STATE = (
    "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"
)
