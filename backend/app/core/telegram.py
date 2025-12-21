import hashlib
import hmac
from urllib.parse import parse_qsl
from typing import Optional, Dict
from config import settings


def validate_telegram_init_data(init_data: str, bot_token: Optional[str] = None) -> Optional[Dict[str, str]]:
    """
    Validate Telegram WebApp initData
    
    Args:
        init_data: The initData string from Telegram WebApp
        bot_token: Telegram bot token (optional, uses settings if not provided)
    
    Returns:
        Parsed user data if valid, None otherwise
    """
    if not bot_token:
        bot_token = settings.telegram_bot_token
    
    if not bot_token:
        # If no bot token is set, skip validation (for development)
        # In production, you should always validate
        return _parse_init_data_without_validation(init_data)
    
    try:
        # Parse init_data
        parsed_data = dict(parse_qsl(init_data))
        
        # Extract hash and remove it from data
        received_hash = parsed_data.pop('hash', None)
        if not received_hash:
            return None
        
        # Create data check string
        data_check_string = '\n'.join(f"{k}={v}" for k, v in sorted(parsed_data.items()))
        
        # Calculate secret key
        secret_key = hmac.new(
            "WebAppData".encode('utf-8'),
            bot_token.encode('utf-8'),
            hashlib.sha256
        ).digest()
        
        # Calculate hash
        calculated_hash = hmac.new(
            secret_key,
            data_check_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Validate hash
        if calculated_hash != received_hash:
            return None
        
        # Check auth_date (should be within last 24 hours)
        import json
        from datetime import datetime, timedelta
        
        auth_date = int(parsed_data.get('auth_date', 0))
        if auth_date < (datetime.now().timestamp() - 86400):  # 24 hours
            return None
        
        # Parse user data
        user_data = {}
        if 'user' in parsed_data:
            user_data = json.loads(parsed_data['user'])
        
        return user_data
        
    except Exception as e:
        print(f"Error validating Telegram initData: {e}")
        return None


def _parse_init_data_without_validation(init_data: str) -> Optional[Dict[str, str]]:
    """Parse init_data without validation (for development only)"""
    try:
        import json
        parsed_data = dict(parse_qsl(init_data))
        if 'user' in parsed_data:
            return json.loads(parsed_data['user'])
        return None
    except Exception:
        return None

