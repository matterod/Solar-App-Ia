---
description: Solar ERP backend API development patterns and conventions
---

# Solar ERP — Backend API Skill

## API Structure

All endpoints are under `/api/v1/` prefix.

### Router Pattern

Every resource router follows this pattern:

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.resource import Resource
from app.models.user import User
from app.schemas.resource import ResourceCreate, ResourceRead, ResourceUpdate

router = APIRouter(prefix="/resources", tags=["Resources"])

@router.get("/", response_model=List[ResourceRead])
async def list_resources(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Resource).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()
```

### Authentication

All authenticated endpoints must use:
```python
current_user: User = Depends(get_current_user)
```

For role-restricted endpoints:
```python
current_user: User = Depends(require_role("admin", "partner"))
```

### Schema Pattern

- `ResourceCreate` — fields for creation (no `id`, no timestamps)
- `ResourceRead` — fields for response (includes `id`, timestamps, `model_config = {"from_attributes": True}`)
- `ResourceUpdate` — all fields optional for partial updates

### Error Handling

- `404` for not found resources
- `400` for validation errors
- `401` for authentication failures
- `403` for insufficient permissions

### Naming Conventions

- Router files: lowercase plural (`clients.py`, `installations.py`)
- Models: singular PascalCase (`Client`, `Installation`)
- Schemas: `{Model}Create`, `{Model}Read`, `{Model}Update`
- Endpoints: REST verbs (`GET /`, `GET /{id}`, `POST /`, `PUT /{id}`, `DELETE /{id}`)

## Adding a New Resource

1. Create model in `backend/app/models/{resource}.py`
2. Import in `backend/app/models/__init__.py`
3. Create schemas in `backend/app/schemas/{resource}.py`
4. Import in `backend/app/schemas/__init__.py`
5. Create router in `backend/app/routers/{resource}.py`
6. Import in `backend/app/routers/__init__.py`
7. Register in `backend/app/main.py`
8. Add SQL migration in `database/init/`
