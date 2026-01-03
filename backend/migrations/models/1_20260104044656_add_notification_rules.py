from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "notification_rules" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "rule_type" VARCHAR(19) NOT NULL,
    "days_before" INT,
    "hours_before" INT,
    "at_time" TIMETZ,
    "interval_hours" INT,
    "last_sent_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscription_id" INT NOT NULL REFERENCES "subscriptions" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_notificatio_subscri_1a83ef" ON "notification_rules" ("subscription_id", "rule_type");
COMMENT ON COLUMN "notification_rules"."rule_type" IS 'BEFORE_PAYMENT: before_payment\nRECURRING_NAG: recurring_nag\nDAY_OF_PAYMENT: day_of_payment\nDUE_DATE_AGGRESSIVE: due_date_aggressive\nWEEKLY_DIGEST: weekly_digest';
COMMENT ON COLUMN "notification_rules"."days_before" IS 'Days before payment (for BEFORE_PAYMENT)';
COMMENT ON COLUMN "notification_rules"."hours_before" IS 'Hours before payment (for BEFORE_PAYMENT/RECURRING_NAG)';
COMMENT ON COLUMN "notification_rules"."at_time" IS 'Specific time of day for notification';
COMMENT ON COLUMN "notification_rules"."interval_hours" IS 'Interval for recurring notifications';
COMMENT ON COLUMN "notification_rules"."last_sent_at" IS 'Timestamp of last sent notification for this rule';
COMMENT ON TABLE "notification_rules" IS 'Granular rules for subscription notifications';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "notification_rules";"""


MODELS_STATE = (
    "eJztXW1T2zgQ/iua3IejM1wPAim03xIINFcInRCu12s7GsVWEh22lZNlaOaG/36SbMfvwT"
    "YmcSBfaCJp5fWjl312V0r/a5hUx4b99gRxPKFs3vgA/mtYyMTiQ6JuFzTQbBbUyAKORoZq"
    "rLmtCFbFaGRzhjQuasbIsLEo0rGtMTLjhFqyvd8rUH2BMWVgwqgzI9YE2M5o0VZ1p1NN9C"
    "eqCks6FvnXwZDTCeZTzIT8tx+imFg6/ilU9b7ObuGYYEOPvD7RZQeqHPL5TJX1LH6mGkql"
    "RlCjhmNaQePZnE+ptWhNLC5LJ9jCTCgtu+fMkWBYjmF4yPn4uJoGTVwVQzI6HiPHkJBK6Q"
    "SifmEIKq9IE1iI0RDa2OoFJ/IpvzX3D48Ojw/eHR6LJkqTRcnRg/t6wbu7ggqB/rDxoOoR"
    "R24LBWOAm/o3gdzJFLF06Pz2MfCEynHwfKieAb1gVvnq5ADSRD+hga0Jn4qvrb0lqP3ZHp"
    "x8bA92WntvZN9UrA132fS9mqaqksAGQAqIKCuC5EKgGij9ggDLYC37YDZ+OR61tPG7xhJE"
    "lVpgin+KT3opbJt5sG1mY9tMYEvE84pA67dfIbLfHf34QBd/NW1/GbzYpP8Q4CtYFNr9PN"
    "DuZ0O7n5y2DEsoIOJJgE9FDScmzpi/EckY1Lon+tb/8FzAZ+wPUjfxGchH2xyZs5xoCzn9"
    "yjLm3la0BO1h77J7PWxffpY9m7b9r6Egaw+7sqapSuex0p13sZFZdAK+9IYfgfwK/r7qdx"
    "Wi1OYTpp4YtBv+3ZA6IYdTaNF7iPTQrumX+kA9SGs5vg3t+7JghLTbe8R0GKkJZkTCKkcn"
    "RccTP/s0wIYCOWX4PTJyHeoqxwTwXqOC8Q8/GGghSvT4FHjw57lf6k8FiR1t0iw0k1Vm04"
    "yXIAtN1IvIZ8sneUD1KSdjoik4L+gkjdjFmyzld1aoMTToJCfNE/0COgY2tjgId2EDTsGM"
    "4TtZoTszQ5bjJNkrIf845fsWmZHQ5W7yEXLn+bElhBUTQh/ZgtYgJFYrU5Af15e19YdtvB"
    "qJAvTJb79C+sSwKetZkjrlH8BnJvgpu1DO3SVF8vGtpiarooLdJsFC0jFNAnpGGSYT6xOe"
    "K1x7QjNkaWlTsxzfWAOeWexCFDN0vzBjaVNGfBAvibm7eNvXJ+3TbuMhm9Gtiq8MHAXmUs"
    "Ki2uRnLEw0z0lZzhkSuiEGlIyKL4Wxi9KQBGEpLF2Srsju3cm6JSxVE5YA21QT17UcM7F9"
    "RLCMdLA6m5fuuXS6Z1eDLvzc/nrZ7Q8/gBEWkxLDGZqbgmF9twbdk5vBoNc/h/32+QfAsO"
    "YwCT8UK/W7ddr+Cq/OAmkdzSEdB9KnN10oGQlsn58PutfXvT+7opGY0JKbQTSRpMMmd/i7"
    "9aXb/XTxFZ72zgX7+ADuMb415lAnE+FOl4pcvM8TuXifHbl4H7fH4t1s6MJTYOHEpErZ4e"
    "r81FOhjTfEwBsksCN3oeg0eJMT8UpWWoDwlDqsBMRxsTVj/FGqkwPk3yNLa02QIw59FymK"
    "9jDT8wqJZHleOb2uCuMvM6xJw6nibzIkIJadsq5hg1ooHpPlh0WcrVRHK9hDjt+kOVfSr4"
    "pGmy2O2R0yoJrIRYxyQnDNU7/nKaSgX5iK5ZxoNfPcQDaHJUMNcdkK4g3VQT70A85y1ktN"
    "k9EwNRp8SmzFOitZBXWJRvgoLQ1HvMiUwzbOJFCc6SUHNiq5Hdi1Dqyn/Dby9WSLt418vb"
    "jI12fXgfhIbJ5xAivWYndZ1MtzR+A01PjRkNfl4iSVbHgbP0m18HFCnUaCXiXktwezVh7W"
    "QiZ1rDRDKjwrExkZvuBCKG5DXam3nvRqY1reigCBdk8ivKfdk95l+2Jnf2+3qWyisJTE3R"
    "z8QNJh8pyL8H2wpc2L5MHCMivMhQ1uOsk0WOMkpMz6jw1JKpZO8rLCbnxphMKvX/2k9J/8"
    "tCkpSNqrOFg1wBplOtC256vizs9LIsmNOJ3c0uX1IftCiHPkxVNocxyYbNKcOKD4OGWOnA"
    "c0k/zXsTF75CJDuS7y5IulpDdgxIbiPcjdNk/80m46VHSWtex9h2arledQfquVfSpf1kUp"
    "zowRLY0FLvNQFjJ1clAiEC803DoppZ2U0ndHqvdUZpgRqkOZ9y+wb8ak1s3HOsQwpJFx1Q"
    "LEAr5mq0/dCW7FOCzqAEal6uMG9izCCTIWQS+pARDkcerezaraK7TwT+4fxymMYapwfaDs"
    "C/WArU2x7hhYjyD6HFBu1KUwnHbnrluzu2AB+0zA2qHUwMjKQDYsF4N3JASfC98FAY2g+m"
    "WqqHY0pk1sEKj4pJnYubq6iIQkOr1hDOKby05XQB8z+8md1D/0DrElYUjh9UthTxOvDfq+"
    "cgJ3hkFIw9qBX+4cYZb46pjCfhL8tOOEnMoTKDqI3LBYOWl4mdHQ7TXT13EGpHEhD3K5Cr"
    "7asU4cC/Hv1RaLdsek1nxC8gkXhaveIkNhwJxQhiTW7aDeyOjn/ZQCei9v+8rDjfGQ/dpz"
    "CBKuCnIHN143GwZu3jRCaFKlpw/StoAKYA3/cNEmLP+8eMb2u6IpmVDoIH5qO+YqFPhdhp"
    "TfEticA2PReErqtcFqkPEvLW4oNJ4D8ERAkqfZNjFX+qw/3qEMQkpG0zcU2ZlMudfmzGAq"
    "GxCkHeVoyIDwUOwlE4ZMN/0oc1+JxGUhye1Bv5XnJbk3EKncr0MmmRjGBKuhgGV/kS06nX"
    "qnhRjf+2bz4OCouXfw7rh1eHTUOt5bgJysWoZ2p3cuAd8NO0TpTLtoNjgsUyqCXOEVozDU"
    "tUoIjwmzOSwKbVRqzeDK3fJXGyid6pVtV9feimIbEaoHtOpSXM2QtSaOsO3Qz1rnRzcmWB"
    "eEXbVqlIUnNhzRlJDgY3klT2iFaY0M/uXnNcQf18TJjBLw1KtLTkMANpNxfscsjnRIsIZo"
    "T5EdMNbPgap1QX42pZxChxlFto+IUJ1IBUB3gq0ycDO4KLd9NA9zbSDNwyVbiKx8DUmktq"
    "bJazHbM/XbZNLrGetFUGaDfp52UyL6zxrsamNGtGkjJdzl1ewuC3ihoM1jEa/s+Mw2RrXy"
    "GNUdZnbqzZtschMSWfMJ+vwoPr+rKZdGARC95psJ4P5ePjdymR+Z8t8sWByn3Yv+4/qqn0"
    "H+ApEYkDeWeMFvOtH4LjCIzX/UE9YlKMq3jhh4H7ydy/ZfcVxPLq46ccstO+ik5c1XeUvs"
    "4X/PLFmY"
)
