from app.config import settings
from app.storage.base import StorageBackend
from app.storage.local_disk import LocalDiskStorage

_storage_instance: StorageBackend = None

def get_storage() -> StorageBackend:
    global _storage_instance
    if _storage_instance is None:
        if settings.STORAGE_BACKEND.lower() == "r2":
            from app.storage.r2 import R2Storage
            _storage_instance = R2Storage(
                account_id=settings.R2_ACCOUNT_ID,
                access_key_id=settings.R2_ACCESS_KEY_ID,
                secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                bucket_name=settings.R2_BUCKET_NAME
            )
        else:
            _storage_instance = LocalDiskStorage(base_dir=settings.LOCAL_STORAGE_PATH)
    return _storage_instance
