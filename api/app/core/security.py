from typing import Optional, Dict
from pydantic import BaseModel

class AuthUser(BaseModel):
    id: str
    email: str
    role: str  # "editor" or "admin"

# Built-in demo credentials for immediate plug-and-play testing
ROLE_CREDENTIALS: Dict[str, AuthUser] = {
    "admin-secret-key-peblo": AuthUser(id="usr_admin", email="admin@peblo.tv", role="admin"),
    "editor-secret-key-peblo": AuthUser(id="usr_editor", email="editor@peblo.tv", role="editor"),
    "admin": AuthUser(id="usr_admin", email="admin@peblo.tv", role="admin"),
    "editor": AuthUser(id="usr_editor", email="editor@peblo.tv", role="editor"),
}
