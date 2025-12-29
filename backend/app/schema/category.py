from pydantic import BaseModel, Field, ConfigDict

class CategoryBase(BaseModel):
    name: str = Field(..., max_length=50)
    color: str = Field(default="#8b5cf6", max_length=20)
    icon: str = Field(default="📁", max_length=10)

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)
