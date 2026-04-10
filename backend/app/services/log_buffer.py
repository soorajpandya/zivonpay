"""
Log Buffer Service - In-memory ring buffer for application logs.
Captures structured log records so they can be queried via the Logs API.
"""

import logging
import threading
from collections import deque
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone


class LogRecord:
    """Lightweight representation of a captured log record."""

    __slots__ = (
        "id", "timestamp", "level", "logger_name", "message",
        "request_id", "merchant_id", "extra",
    )

    def __init__(
        self,
        record_id: int,
        timestamp: str,
        level: str,
        logger_name: str,
        message: str,
        request_id: Optional[str] = None,
        merchant_id: Optional[str] = None,
        extra: Optional[Dict[str, Any]] = None,
    ):
        self.id = record_id
        self.timestamp = timestamp
        self.level = level
        self.logger_name = logger_name
        self.message = message
        self.request_id = request_id
        self.merchant_id = merchant_id
        self.extra = extra

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "level": self.level,
            "logger": self.logger_name,
            "message": self.message,
            "request_id": self.request_id,
            "merchant_id": self.merchant_id,
            "extra": self.extra,
        }


# Keys that are part of the standard LogRecord — we strip these from "extra"
_BUILTIN_ATTRS = frozenset({
    "name", "msg", "args", "created", "relativeCreated", "exc_info",
    "exc_text", "stack_info", "lineno", "funcName", "pathname", "filename",
    "module", "thread", "threadName", "process", "processName", "levelname",
    "levelno", "message", "asctime", "msecs", "taskName",
    # Our own injected keys
    "request_id", "merchant_id",
})


class LogBufferHandler(logging.Handler):
    """
    A logging.Handler that stores the last N records in a thread-safe
    deque (ring buffer). Intended to be attached at the root logger.
    """

    def __init__(self, max_size: int = 5000, level: int = logging.DEBUG):
        super().__init__(level)
        self._buffer: deque[LogRecord] = deque(maxlen=max_size)
        self._lock = threading.Lock()
        self._counter = 0

    def emit(self, record: logging.LogRecord) -> None:
        try:
            # Ignore noisy third-party loggers
            if record.name.startswith(("uvicorn", "sqlalchemy", "httpx", "httpcore")):
                return

            self._counter += 1

            # Extract extra fields added via logger.info(..., extra={...})
            extra: Dict[str, Any] = {}
            for key, value in record.__dict__.items():
                if key.startswith("_") or key in _BUILTIN_ATTRS:
                    continue
                try:
                    # Only keep JSON-serialisable values
                    import json
                    json.dumps(value)
                    extra[key] = value
                except (TypeError, ValueError):
                    extra[key] = str(value)

            log_record = LogRecord(
                record_id=self._counter,
                timestamp=datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
                level=record.levelname,
                logger_name=record.name,
                message=record.getMessage(),
                request_id=getattr(record, "request_id", None),
                merchant_id=getattr(record, "merchant_id", None),
                extra=extra if extra else None,
            )

            with self._lock:
                self._buffer.append(log_record)
        except Exception:
            self.handleError(record)

    # --- query helpers ---

    def get_logs(
        self,
        skip: int = 0,
        limit: int = 100,
        level: Optional[str] = None,
        logger_name: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[LogRecord]:
        """
        Return filtered log records from the buffer (newest first).
        """
        with self._lock:
            records = list(reversed(self._buffer))

        # Apply filters
        if level:
            level_upper = level.upper()
            records = [r for r in records if r.level == level_upper]
        if logger_name:
            records = [r for r in records if logger_name in r.logger_name]
        if search:
            search_lower = search.lower()
            records = [
                r for r in records
                if search_lower in r.message.lower()
                or (r.request_id and search_lower in r.request_id.lower())
                or (r.merchant_id and search_lower in r.merchant_id.lower())
            ]

        total = len(records)
        return records[skip : skip + limit], total

    @property
    def buffer_size(self) -> int:
        return len(self._buffer)


# Global singleton
log_buffer = LogBufferHandler(max_size=5000, level=logging.DEBUG)
