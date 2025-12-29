from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models.category import Category
from app.schema.category import CategoryCreate, CategoryResponse
from tortoise.exceptions import DoesNotExist, IntegrityError

router = APIRouter()

@router.get("/", response_model=List[CategoryResponse])
async def get_categories():
    """Get all categories"""
    return await Category.all()

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(category_in: CategoryCreate):
    """Create a new category"""
    try:
        category = await Category.create(**category_in.model_dump())
        return category
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists"
        )

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(category_id: int):
    """Delete a category"""
    deleted_count = await Category.filter(id=category_id).delete()
    if not deleted_count:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
