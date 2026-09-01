"""Configuration and structured logging for the engine.

Every error surfaces with the stage that failed and the target that failed,
never a bare "something went wrong".
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass

LOG = logging.getLogger("strata")


def configure_logging() -> None:
    """Configures the structured logger once for the process."""
    if LOG.handlers:
        return
    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s")
    )
    LOG.addHandler(handler)
    LOG.setLevel(os.environ.get("STRATA_LOG_LEVEL", "INFO"))


@dataclass(frozen=True)
class Settings:
    """Runtime settings loaded from the environment."""

    rpc_url: str
    registry_address: str
    eas_address: str
    eas_schema_uid: str
    engine_private_key: str | None
    anthropic_api_key: str | None
    github_token: str | None
    supabase_url: str | None
    supabase_service_key: str | None
    redis_url: str | None

    @staticmethod
    def from_env() -> "Settings":
        """Builds settings from the process environment.
        @returns the settings instance
        """
        return Settings(
            rpc_url=os.environ.get("ENGINE_RPC_URL", "https://mainnet.base.org"),
            registry_address=os.environ.get("NEXT_PUBLIC_STRATA_REGISTRY_ADDRESS", ""),
            eas_address=os.environ.get("NEXT_PUBLIC_EAS_ADDRESS", ""),
            eas_schema_uid=os.environ.get("NEXT_PUBLIC_EAS_SCHEMA_UID", ""),
            engine_private_key=os.environ.get("ENGINE_PRIVATE_KEY"),
            anthropic_api_key=os.environ.get("ANTHROPIC_API_KEY"),
            github_token=os.environ.get("GITHUB_TOKEN"),
            supabase_url=os.environ.get("SUPABASE_URL"),
            supabase_service_key=os.environ.get("SUPABASE_SERVICE_KEY"),
            redis_url=os.environ.get("REDIS_URL"),
        )
