from fastapi import APIRouter
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tg", tags=["telegram"])


@router.get("/")
def health_check():
    return {"status": "ok"}
