from decimal import Decimal
from typing import Dict

# Approximate rates as of late 2025
# 1 USD = 95 RUB
# 1 EUR = 103 RUB
# 1 EUR = 1.08 USD

CURRENCY_RATES = {
    "RUB": Decimal("1.0"),
    "USD": Decimal("95.0"),
    "EUR": Decimal("103.0"),
    "KZT": Decimal("0.2"), 
    "BYN": Decimal("28.0")
}

def convert_to_rub(amount: Decimal, from_currency: str) -> Decimal:
    """Convert given amount from currency to RUB"""
    rate = CURRENCY_RATES.get(from_currency.upper(), Decimal("1.0"))
    return amount * rate

def convert_from_rub(amount: Decimal, to_currency: str) -> Decimal:
    """Convert amount from RUB to target currency"""
    rate = CURRENCY_RATES.get(to_currency.upper(), Decimal("1.0"))
    if rate == 0: return amount
    return amount / rate
