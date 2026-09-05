from typing import Optional
from fastapi import Depends, HTTPException, Security, status, Header, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.user import User
from app.core.security import AuthUser, ROLE_CREDENTIALS

security_bearer = HTTPBearer(auto_error=False)

def get_current_user(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    query_key: Optional[str] = Query(None, alias="api_key"),
    db: Session = Depends(get_db)
) -> AuthUser:
    token = None
    if x_api_key:
        token = x_api_key.strip()
    elif auth_header and auth_header.credentials:
        token = auth_header.credentials.strip()
    elif query_key:
        token = query_key.strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Provide 'X-API-Key' header or 'Authorization: Bearer <key>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check in-memory preset keys
    if token in ROLE_CREDENTIALS:
        return ROLE_CREDENTIALS[token]

    # Check Database for registered users
    db_user = db.query(User).filter(User.api_key == token).first()
    if db_user:
        return AuthUser(id=db_user.id, email=db_user.email, role=db_user.role)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=f"Invalid API key or token '{token}'.",
        headers={"WWW-Authenticate": "Bearer"},
    )

def require_role(required_role: str):
    """
    Enforces role-based access control.
    'admin' has superuser access to both 'admin' and 'editor' endpoints.
    'editor' cannot access 'admin' only endpoints (e.g. publish).
    """
    def role_checker(current_user: AuthUser = Depends(get_current_user)) -> AuthUser:
        if required_role == "admin" and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Action requires 'admin' role, but user has '{current_user.role}' role."
            )
        if required_role == "editor" and current_user.role not in ["editor", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Action requires editor permissions."
            )
        return current_user

    return role_checker
