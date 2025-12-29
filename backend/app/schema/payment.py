from pydantic import BaseModel, Field, ConfigDict
from datetime import date
from decimal import Decimal

class PaymentHistoryBase(BaseModel):
    amount: Decimal
    currency: str
    date: date

class PaymentHistoryResponse(PaymentHistoryBase):
    id: int
    subscription_id: int
    
    model_config = ConfigDict(from_attributes=True)
