from typing import Optional, BinaryIO, Union
import io
from app.storage.base import StorageBackend

class R2Storage(StorageBackend):
    """
    Cloudflare R2 storage backend implementation using boto3 (S3-compatible API).
    Swapping from LocalDiskStorage to R2Storage requires changing only the instantiated
    storage provider class or configuring STORAGE_BACKEND=r2 in environment.
    """
    def __init__(
        self,
        account_id: str,
        access_key_id: str,
        secret_access_key: str,
        bucket_name: str,
        custom_domain: Optional[str] = None
    ):
        self.bucket_name = bucket_name
        self.custom_domain = custom_domain
        self.endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com" if account_id else None

        # Lazily instantiate boto3 client when configured
        import boto3
        from botocore.config import Config

        self.client = boto3.client(
            "s3",
            endpoint_url=self.endpoint_url,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            config=Config(signature_version="s3v4")
        )

    def put(self, key: str, data: Union[bytes, BinaryIO], content_type: Optional[str] = None) -> str:
        clean_key = key.lstrip("/\\").replace("\\", "/")
        extra_args = {}
        if content_type:
            extra_args["ContentType"] = content_type

        if isinstance(data, (bytes, bytearray)):
            body = data
        else:
            body = data.read()

        self.client.put_object(
            Bucket=self.bucket_name,
            Key=clean_key,
            Body=body,
            **extra_args
        )
        return clean_key

    def get(self, key: str) -> bytes:
        clean_key = key.lstrip("/\\").replace("\\", "/")
        try:
            response = self.client.get_object(Bucket=self.bucket_name, Key=clean_key)
            return response["Body"].read()
        except self.client.exceptions.NoSuchKey:
            raise FileNotFoundError(f"Key '{key}' does not exist in bucket '{self.bucket_name}'.")

    def exists(self, key: str) -> bool:
        clean_key = key.lstrip("/\\").replace("\\", "/")
        try:
            self.client.head_object(Bucket=self.bucket_name, Key=clean_key)
            return True
        except Exception:
            return False

    def delete(self, key: str) -> bool:
        clean_key = key.lstrip("/\\").replace("\\", "/")
        self.client.delete_object(Bucket=self.bucket_name, Key=clean_key)
        return True

    def atomic_publish(self, temp_key: str, final_key: str) -> None:
        """
        In Cloudflare R2 / S3, PUT and COPY operations are inherently atomic per object key.
        We copy the staged object from temp_key to final_key atomically,
        then clean up temp_key. S3 guarantees immediate read-after-write consistency.
        """
        clean_temp = temp_key.lstrip("/\\").replace("\\", "/")
        clean_final = final_key.lstrip("/\\").replace("\\", "/")

        # Atomically overwrite final_key with contents of temp_key
        self.client.copy_object(
            Bucket=self.bucket_name,
            CopySource={"Bucket": self.bucket_name, "Key": clean_temp},
            Key=clean_final
        )
        # Remove temporary staging object
        self.delete(clean_temp)

    def get_url(self, key: str) -> str:
        clean_key = key.lstrip("/\\").replace("\\", "/")
        if self.custom_domain:
            return f"https://{self.custom_domain}/{clean_key}"
        return f"{self.endpoint_url}/{self.bucket_name}/{clean_key}"
