import logging
import sys
from typing import Optional
from app.core.config import settings


def setup_logging(
    level: str = "INFO",
    format_string: Optional[str] = None
) -> logging.Logger:
    """Setup structured logging for the application"""

    if format_string is None:
        format_string = (
            "%(asctime)s - %(name)s - %(levelname)s - "
            "%(filename)s:%(lineno)d - %(message)s"
        )

    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format=format_string,
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler("app.log", mode='a')
        ]
    )

    # Create logger for this application
    logger = logging.getLogger("revamp_api")

    # Set level from environment if available
    log_level = getattr(logging, settings.__dict__.get("LOG_LEVEL", level).upper(), logging.INFO)
    logger.setLevel(log_level)

    # Add additional handler for errors
    error_handler = logging.FileHandler("error.log", mode='a')
    error_handler.setLevel(logging.ERROR)
    error_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - "
        "%(filename)s:%(lineno)d - %(message)s"
    )
    error_handler.setFormatter(error_formatter)
    logger.addHandler(error_handler)

    return logger


# Global logger instance
logger = setup_logging()