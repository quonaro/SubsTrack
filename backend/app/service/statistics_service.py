from app.repository.subscription_repository import SubscriptionRepository
from app.schema.statistics import StatisticsResponse
from app.schema.subscription import SubscriptionResponse
from decimal import Decimal
from app.core.currency import convert_to_rub


class StatisticsService:
    def __init__(self):
        self.repository = SubscriptionRepository()

    async def get_statistics(self, user_id: int) -> StatisticsResponse:
        # Get all subscriptions with category prefetched
        all_subs = await self.repository.get_all_by_user(user_id)

        active_subs = [s for s in all_subs if s.is_active]
        inactive_count = len(all_subs) - len(active_subs)

        total_monthly = 0.0
        category_totals = {}

        for sub in active_subs:
            # Convert to RUB for consistent stats
            price_rub = float(convert_to_rub(Decimal(str(sub.price)), sub.currency))

            if sub.period_days == 7:  # Weekly
                monthly_price = price_rub * 4
            elif sub.period_days == 14:  # Bi-weekly
                monthly_price = price_rub * 2
            elif sub.period_days == 30:  # Monthly
                monthly_price = price_rub
            elif sub.period_days == 365:  # Yearly
                monthly_price = price_rub / 12
            else:
                monthly_price = price_rub * (30 / sub.period_days)

            total_monthly += monthly_price

            # Aggregate by category
            cat_name = sub.category.name if sub.category else "Без категории"
            cat_icon = sub.category.icon if sub.category else "📦"

            if cat_name not in category_totals:
                category_totals[cat_name] = {"total": 0.0, "icon": cat_icon}
            category_totals[cat_name]["total"] += monthly_price

        total_yearly = total_monthly * 12

        # Format category stats
        category_stats = []
        for name, data in category_totals.items():
            percent = (data["total"] / total_monthly * 100) if total_monthly > 0 else 0
            category_stats.append(
                {
                    "name": name,
                    "icon": data["icon"],
                    "total": round(data["total"], 2),
                    "percent": round(percent, 1),
                }
            )

        # Get all active subscriptions and sort by price
        sorted_active = sorted(active_subs, key=lambda x: float(x.price), reverse=True)

        return StatisticsResponse(
            total_monthly=round(total_monthly, 2),
            total_yearly=round(total_yearly, 2),
            active_count=len(active_subs),
            inactive_count=inactive_count,
            top_subscriptions=[
                SubscriptionResponse.model_validate(sub) for sub in sorted_active
            ],
            category_stats=category_stats,
            currency="RUB",
        )
