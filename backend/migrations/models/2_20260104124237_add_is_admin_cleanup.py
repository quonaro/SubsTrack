from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "notification_rules" ALTER COLUMN "rule_type" TYPE VARCHAR(18) USING "rule_type"::VARCHAR(18);
        COMMENT ON COLUMN "notification_rules"."rule_type" IS 'ADVANCE_NOTICE: advance_notice
RECURRING_REMINDER: recurring_reminder
PAYMENT_DAY_ALERT: payment_day_alert
URGENT_REMINDER: urgent_reminder
WEEKLY_SUMMARY: weekly_summary';
        ALTER TABLE "subscriptions" DROP COLUMN "reminder_days_before";
        ALTER TABLE "users" ADD "is_admin" BOOL NOT NULL DEFAULT False;
        COMMENT ON COLUMN "users"."is_admin" IS 'Whether the user is an administrator';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "users" DROP COLUMN "is_admin";
        ALTER TABLE "subscriptions" ADD "reminder_days_before" INT NOT NULL DEFAULT 1;
        COMMENT ON COLUMN "notification_rules"."rule_type" IS 'BEFORE_PAYMENT: before_payment
RECURRING_NAG: recurring_nag
DAY_OF_PAYMENT: day_of_payment
DUE_DATE_AGGRESSIVE: due_date_aggressive
WEEKLY_DIGEST: weekly_digest';
        ALTER TABLE "notification_rules" ALTER COLUMN "rule_type" TYPE VARCHAR(19) USING "rule_type"::VARCHAR(19);
        COMMENT ON COLUMN "subscriptions"."reminder_days_before" IS 'Days before payment to send reminder';"""


MODELS_STATE = (
    "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"
    "Z5Jr7+Kym9y5oYNu1mGFTV4We/g/p6hfLA=="
)
