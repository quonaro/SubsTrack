from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Any, Dict
from app.schema.subscription import SubscriptionResponse


class HistoryResponse(BaseModel):
    id: int
    subscription_id: int
    event_type: str
    details: Optional[Dict[str, Any]] = None
    created_at: datetime
    subscription: Optional[SubscriptionResponse] = None

    model_config = ConfigDict(from_attributes=True)
