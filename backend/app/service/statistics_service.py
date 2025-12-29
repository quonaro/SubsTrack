from app.repository.subscription_repository import SubscriptionRepository
from app.schema.statistics import StatisticsResponse
from app.schema.subscription import SubscriptionResponse
from typing import List

class StatisticsService:
    def __init__(self):
        self.repository = SubscriptionRepository()

    async def get_statistics(self, user_id: int) -> StatisticsResponse:
        # Get all subscriptions
        all_subs = await self.repository.get_all_by_user(user_id)
        
        active_subs = [s for s in all_subs if s.is_active]
        inactive_count = len(all_subs) - len(active_subs)
        
        total_monthly = 0.0
        for sub in active_subs:
            # Calculate monthly cost based on period
            monthly_price = 0.0
            price = float(sub.price)
            
            if sub.period_days == 7: # Weekly
                monthly_price = price * 4
            elif sub.period_days == 14: # Bi-weekly
                monthly_price = price * 2
            elif sub.period_days == 30: # Monthly
                monthly_price = price
            elif sub.period_days == 365: # Yearly
                monthly_price = price / 12
            else:
                # Fallback for custom periods
                monthly_price = price * (30 / sub.period_days)
            
            total_monthly += monthly_price
            
        total_yearly = total_monthly * 12
        
        # Get top 3 most expensive active subscriptions
        sorted_active = sorted(active_subs, key=lambda x: float(x.price), reverse=True)
        top_subs = sorted_active[:3]
        
        return StatisticsResponse(
            total_monthly=round(total_monthly, 2),
            total_yearly=round(total_yearly, 2),
            active_count=len(active_subs),
            inactive_count=inactive_count,
            top_subscriptions=[SubscriptionResponse.model_validate(sub) for sub in top_subs],
            currency="RUB" # Default for now as per model
        )
