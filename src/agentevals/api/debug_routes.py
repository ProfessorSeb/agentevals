from __future__ import annotations

import glob
import importlib.metadata
import io
import json
import logging
import os
import platform
import sys
import tempfile
import zipfile
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agentevals import __version__
from ..utils.log_buffer import log_buffer

if TYPE_CHECKING:
    from ..streaming.ws_server import StreamingTraceManager

logger = logging.getLogger(__name__)

debug_router = APIRouter()

_trace_manager: StreamingTraceManager | None = None


def set_trace_manager(manager: StreamingTraceManager) -> None:
    global _trace_manager
    _trace_manager = manager


class FrontendDiagnostics(BaseModel):
    user_description: str = ""
    browser_info: dict = {}
    console_logs: list[dict] = []
    app_state: dict = {}
    network_errors: list[dict] = []


def _get_package_version(name: str) -> str | None:
    try:
        return importlib.metadata.version(name)
    except importlib.metadata.PackageNotFoundError:
        return None


def _collect_environment() -> dict:
    packages = [
        "fastapi", "uvicorn", "google-adk", "google-genai",
        "opentelemetry-sdk", "opentelemetry-api", "pydantic",
    ]
    return {
        "timestamp": datetime.now(tz=timezone.utc).isoformat(),
        "agentevals_version": __version__,
        "python_version": sys.version,
        "os": platform.system(),
        "os_version": platform.release(),
        "machine": platform.machine(),
        "packages": {
            p: _get_package_version(p) for p in packages
        },
        "config": {
            "log_level": os.getenv("AGENTEVALS_LOG_LEVEL", "INFO"),
            "live_mode": os.getenv("AGENTEVALS_LIVE") == "1",
        },
        "api_keys": {
            "google": bool(
                os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
            ),
            "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
            "openai": bool(os.getenv("OPENAI_API_KEY")),
        },
    }


def _collect_sessions() -> list[dict]:
    if not _trace_manager:
        return []

    sessions_data = []
    for session in _trace_manager.sessions.values():
        sessions_data.append(
            {
                "session_id": session.session_id,
                "trace_id": session.trace_id,
                "eval_set_id": session.eval_set_id,
                "started_at": session.started_at.isoformat(),
                "is_complete": session.is_complete,
                "span_count": len(session.spans),
                "log_count": len(session.logs),
                "metadata": session.metadata,
                "spans": session.spans,
                "logs": session.logs,
            }
        )
    return sessions_data


def _collect_temp_files() -> dict[str, str]:
    tmp_dir = tempfile.gettempdir()
    files = {}
    for pattern in ["agentevals_*.jsonl", "eval_set_*.json"]:
        for path in glob.glob(os.path.join(tmp_dir, pattern)):
            try:
                with open(path) as f:
                    files[os.path.basename(path)] = f.read()
            except OSError:
                logger.debug("Could not read temp file %s", path)
    return files


@debug_router.post("/bundle")
async def create_debug_bundle(diagnostics: FrontendDiagnostics):
    timestamp = datetime.now(tz=timezone.utc).strftime("%Y%m%d-%H%M%S")
    prefix = f"bug-report-{timestamp}"

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        env = _collect_environment()
        metadata = {
            **env,
            "user_description": diagnostics.user_description,
            "browser_info": diagnostics.browser_info,
        }
        zf.writestr(f"{prefix}/metadata.json", json.dumps(metadata, indent=2))

        sessions = _collect_sessions()
        for s in sessions:
            sid = s["session_id"]
            zf.writestr(
                f"{prefix}/sessions/{sid}/spans.json",
                json.dumps(s["spans"], indent=2),
            )
            zf.writestr(
                f"{prefix}/sessions/{sid}/logs.json",
                json.dumps(s["logs"], indent=2),
            )
            session_meta = {
                k: v
                for k, v in s.items()
                if k not in ("spans", "logs")
            }
            zf.writestr(
                f"{prefix}/sessions/{sid}/session_meta.json",
                json.dumps(session_meta, indent=2),
            )

        zf.writestr(f"{prefix}/backend_logs.txt", log_buffer.get_text())

        temp_files = _collect_temp_files()
        for filename, content in temp_files.items():
            zf.writestr(f"{prefix}/temp_files/{filename}", content)

        zf.writestr(
            f"{prefix}/frontend_state.json",
            json.dumps(diagnostics.app_state, indent=2),
        )
        zf.writestr(
            f"{prefix}/console_logs.json",
            json.dumps(diagnostics.console_logs, indent=2),
        )
        zf.writestr(
            f"{prefix}/network_errors.json",
            json.dumps(diagnostics.network_errors, indent=2),
        )

    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="bug-report-{timestamp}.zip"'
        },
    )
