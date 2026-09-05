import os
import shutil
from pathlib import Path
from typing import Optional, BinaryIO, Union
from app.storage.base import StorageBackend

class LocalDiskStorage(StorageBackend):
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _resolve_path(self, key: str) -> Path:
        # Prevent directory traversal attacks
        clean_key = key.lstrip("/\\")
        target = (self.base_dir / clean_key).resolve()
        if not str(target).startswith(str(self.base_dir)):
            raise ValueError(f"Security error: key '{key}' attempts directory traversal.")
        return target

    def put(self, key: str, data: Union[bytes, BinaryIO], content_type: Optional[str] = None) -> str:
        target_path = self._resolve_path(key)
        target_path.parent.mkdir(parents=True, exist_ok=True)

        if isinstance(data, (bytes, bytearray)):
            with open(target_path, "wb") as f:
                f.write(data)
                f.flush()
                os.fsync(f.fileno())
        else:
            with open(target_path, "wb") as f:
                shutil.copyfileobj(data, f)
                f.flush()
                os.fsync(f.fileno())

        return key

    def get(self, key: str) -> bytes:
        target_path = self._resolve_path(key)
        if not target_path.exists():
            raise FileNotFoundError(f"Key '{key}' does not exist.")
        with open(target_path, "rb") as f:
            return f.read()

    def exists(self, key: str) -> bool:
        return self._resolve_path(key).exists()

    def delete(self, key: str) -> bool:
        target_path = self._resolve_path(key)
        if target_path.exists():
            target_path.unlink()
            return True
        return False

    def atomic_publish(self, temp_key: str, final_key: str) -> None:
        """
        Atomically swaps temp_key into final_key using os.replace.
        Because both files reside within self.base_dir, os.replace is guaranteed
        to be atomic by the OS kernel. Readers never observe a partial write.
        """
        temp_path = self._resolve_path(temp_key)
        final_path = self._resolve_path(final_key)

        if not temp_path.exists():
            raise FileNotFoundError(f"Temporary file '{temp_key}' does not exist.")

        final_path.parent.mkdir(parents=True, exist_ok=True)
        # os.replace is atomic on POSIX and Windows (Python 3.3+)
        os.replace(temp_path, final_path)

    def get_url(self, key: str) -> str:
        # Normalizes to API-served media endpoint
        clean_key = key.replace("\\", "/").lstrip("/")
        return f"/media/{clean_key}"
