import os
from pathlib import Path
from typing import Dict
from functools import lru_cache
from dotenv import load_dotenv

# Load environment variables from .env file (only if file exists)
# This is for local development. Environment variables already set
# (e.g., by Render or system) will NOT be overridden.
# Look for .env file in the backend directory (parent of app directory)
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=False)


class Settings:
    """Application settings with environment variable support"""

    # API Configuration
    API_TITLE: str = os.getenv("API_TITLE", "revAMP API")
    API_VERSION: str = os.getenv("API_VERSION", "1.0.0")
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))

    # External API Configuration
    EXTERNAL_API_URL: str = os.getenv("EXTERNAL_API_URL", "https://aimsmobilepay.com/api/zone/index.php")
    EXTERNAL_API_TIMEOUT: int = int(os.getenv("EXTERNAL_API_TIMEOUT", "30"))

    # Upstream Proxy Configuration
    UPSTREAM_PROXY_URL: str = os.getenv("UPSTREAM_PROXY_URL", "")
    UPSTREAM_PROXY_TOKEN: str = os.getenv("UPSTREAM_PROXY_TOKEN", "")

    # Redis / Rate Limiting Configuration
    REDIS_URL: str = os.getenv("REDIS_URL", "")
    RATE_LIMIT_MINUTE: str = os.getenv("RATE_LIMIT_MINUTE", "60/minute")

    # Proxy / Upstream Protection
    PROXY_CIRCUIT_THRESHOLD: int = int(os.getenv("PROXY_CIRCUIT_THRESHOLD", "10"))
    PROXY_CIRCUIT_WINDOW_SECONDS: int = int(os.getenv("PROXY_CIRCUIT_WINDOW_SECONDS", "30"))
    PROXY_CIRCUIT_COOLDOWN_SECONDS: int = int(os.getenv("PROXY_CIRCUIT_COOLDOWN_SECONDS", "30"))

    # Logging Configuration
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # Cache Configuration
    CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "300"))  # 5 minutes default

    # Rate Limiting Configuration
    RATE_LIMIT_DAY: str = os.getenv("RATE_LIMIT_DAY", "200/day")
    RATE_LIMIT_HOUR: str = os.getenv("RATE_LIMIT_HOUR", "50/hour")

    # CORS Configuration
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        (
            "http://localhost:3000,"
            "http://127.0.0.1:3000,"
            "http://localhost:5173,"
            "https://rev-amp-front.vercel.app,"
            "https://rev-amp-front-git-main-scaredvcs-projects.vercel.app,"
            "https://rev-amp-front-mmideq9r9-scaredvcs-projects.vercel.app,"
            "https://amp-parking.onrender.com"
        ),
    )
    CORS_ALLOW_CREDENTIALS: bool = os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true"

    # Default UC Davis bounds (main campus area)
    DEFAULT_BOUNDS: Dict[str, float] = {
        "left_long": float(os.getenv("DEFAULT_LEFT_LONG", "-121.75565688680798")),
        "right_long": float(os.getenv("DEFAULT_RIGHT_LONG", "-121.73782556127698")),
        "top_lat": float(os.getenv("DEFAULT_TOP_LAT", "38.53997670732033")),
        "bottom_lat": float(os.getenv("DEFAULT_BOTTOM_LAT", "38.52654855404775")),
    }

    # City-wide bounds (for filtering - covers all of Davis)
    CITY_BOUNDS: Dict[str, float] = {
        "left_long": float(os.getenv("CITY_LEFT_LONG", "-121.78")),
        "right_long": float(os.getenv("CITY_RIGHT_LONG", "-121.74")),
        "top_lat": float(os.getenv("CITY_TOP_LAT", "38.55")),
        "bottom_lat": float(os.getenv("CITY_BOTTOM_LAT", "38.52")),
    }

    # Database Configuration
    APP_ENV: str = os.getenv("APP_ENV", "local").lower()
    DATABASE_URL_LOCAL: str = os.getenv("DATABASE_URL_LOCAL", "sqlite:///./revamp.db")
    DATABASE_URL_PROD: str = os.getenv("DATABASE_URL_PROD", "")
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        DATABASE_URL_LOCAL if APP_ENV == "local" else (DATABASE_URL_PROD or DATABASE_URL_LOCAL),
    )
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")

    @property
    def secret_key_validated(self) -> str:
        """Validate SECRET_KEY is set in production"""
        if not self.SECRET_KEY:
            if self.APP_ENV == "prod":
                raise ValueError("SECRET_KEY must be set in production environment")
            # For local dev, generate a warning but use a dev key
            import warnings
            warnings.warn("SECRET_KEY not set - using development key. Set SECRET_KEY in production!", UserWarning)
            return "dev-only-insecure-key-do-not-use-in-production"
        return self.SECRET_KEY
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

    # Payment Configuration (Optional - can be added later)
    STRIPE_PUBLIC_KEY: str = os.getenv("STRIPE_PUBLIC_KEY", "")
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    @property
    def cors_origins_list(self) -> list:
        """Parse CORS origins from environment variable"""
        origins_str = self.CORS_ORIGINS
        if origins_str == "*":
            return ["*"]
        return [origin.strip() for origin in origins_str.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings"""
    return Settings()


# Global settings instance
settings = get_settings()
