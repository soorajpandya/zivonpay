"""
Structured logging configuration for ZivonPay
"""

import logging
import sys
from pythonjsonlogger import jsonlogger
from app.config import settings


class RequestIdFilter(logging.Filter):
    """Add request ID to log records"""
    
    def filter(self, record):
        record.request_id = getattr(record, 'request_id', 'N/A')
        return True


def setup_logging():
    """Configure structured JSON logging"""
    
    # Create logger
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper()))
    
    # Remove existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Create handler
    handler = logging.StreamHandler(sys.stdout)
    
    # Attach in-memory log buffer for the Logs API
    from app.services.log_buffer import log_buffer
    log_buffer.addFilter(RequestIdFilter())
    logger.addHandler(log_buffer)
    
    if settings.LOG_FORMAT == "json":
        # JSON formatter for production
        formatter = jsonlogger.JsonFormatter(
            "%(asctime)s %(name)s %(levelname)s %(request_id)s %(message)s",
            rename_fields={
                "asctime": "timestamp",
                "name": "logger",
                "levelname": "level",
            }
        )
    else:
        # Simple formatter for development
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - [%(request_id)s] - %(message)s"
        )
    
    handler.setFormatter(formatter)
    handler.addFilter(RequestIdFilter())
    
    # Add handler to logger
    logger.addHandler(handler)
    
    # Set third-party loggers to WARNING
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)


def mask_sensitive_data(data: str, visible_chars: int = 4) -> str:
    """
    Mask sensitive data for logging
    
    Args:
        data: The sensitive data to mask
        visible_chars: Number of characters to keep visible
        
    Returns:
        Masked string
    """
    if not data or len(data) <= visible_chars:
        return "***"
    
    return data[:visible_chars] + "*" * (len(data) - visible_chars)


def get_logger(name: str) -> logging.Logger:
    """Get logger with name"""
    return logging.getLogger(name)
