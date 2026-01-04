from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.models.category import Category
from app.models.user import User
from app.schema.category import CategoryCreate, CategoryResponse
from app.core.dependencies import get_current_user
from tortoise.exceptions import IntegrityError

router = APIRouter()


@router.get("/", response_model=List[CategoryResponse])
async def get_categories(current_user: User = Depends(get_current_user)):
    """Get all categories for current user"""
    return await Category.filter(user=current_user).all()


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_in: CategoryCreate, current_user: User = Depends(get_current_user)
):
    """Create a new category for current user"""
    try:
        category = await Category.create(user=current_user, **category_in.model_dump())
        return category
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists",
        )


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int, current_user: User = Depends(get_current_user)
):
    """Delete a category (only if it belongs to current user)"""
    category = await Category.filter(id=category_id, user=current_user).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
        )
    await category.delete()
