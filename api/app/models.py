"""Request and response bodies. These also produce the OpenAPI schema."""
from typing import Literal, Optional

from pydantic import BaseModel, Field

MaintenanceStatus = Literal['new', 'in-progress', 'complete']
MaintenancePriority = Literal['low', 'normal', 'high']


class MaintenanceCreate(BaseModel):
    title: str = Field(min_length=1, max_length=400)
    reference: str = Field(default="", max_length=200)
    status: MaintenanceStatus = 'new'
    priority: MaintenancePriority = 'normal'


class MaintenanceUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=400)
    reference: Optional[str] = Field(default=None, max_length=200)
    status: Optional[MaintenanceStatus] = None
    priority: Optional[MaintenancePriority] = None


class Maintenance(MaintenanceCreate):
    id: int
