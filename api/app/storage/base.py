from abc import ABC, abstractmethod
from typing import Optional, BinaryIO, Union

class StorageBackend(ABC):
    """
    Abstract storage backend interface for Peblo TV Mini.
    Allows seamlessly swapping between LocalDiskStorage and Cloudflare R2 (S3-compatible).
    """

    @abstractmethod
    def put(self, key: str, data: Union[bytes, BinaryIO], content_type: Optional[str] = None) -> str:
        """
        Store an object at `key` and return its access URL or storage identifier.
        """
        pass

    @abstractmethod
    def get(self, key: str) -> bytes:
        """
        Retrieve data bytes for `key`. Raises FileNotFoundError if missing.
        """
        pass

    @abstractmethod
    def exists(self, key: str) -> bool:
        """
        Check if object at `key` exists.
        """
        pass

    @abstractmethod
    def delete(self, key: str) -> bool:
        """
        Delete object at `key`. Returns True if deleted, False otherwise.
        """
        pass

    @abstractmethod
    def atomic_publish(self, temp_key: str, final_key: str) -> None:
        """
        Atomically replaces `final_key` with the contents of `temp_key`.
        Guarantees that readers never see a half-written file.
        """
        pass

    @abstractmethod
    def get_url(self, key: str) -> str:
        """
        Return a public or relative URL path to access the asset.
        """
        pass
