from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger('ApiExceptionFilter')


class ApiError(Exception):
    def __init__(self, status_code: int, code: str, message: str, details: dict[str, str] | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details


def redact_sensitive(text: str, secrets: list[str]) -> str:
    output = text
    for secret in secrets:
        if len(secret) < 8:
            continue
        output = output.replace(secret, '[redacted]')
    return output[:400]


def api_error_response(error: ApiError, headers: dict[str, str] | None = None) -> JSONResponse:
    logger.warning('%s HTTP %s', error.code, error.status_code)
    body: dict[str, object] = {'code': error.code, 'message': error.message}
    if error.details is not None:
        body['details'] = error.details
    return JSONResponse(body, status_code=error.status_code, headers=headers)


def _http_error_response(status: int, text: str, headers: dict[str, str] | None = None) -> JSONResponse:
    code = 'RATE_LIMITED' if status == 429 else 'INVALID_REQUEST'
    message = 'Too many requests. Wait a moment and try again.' if status == 429 else (text or 'Request could not be processed.')[:300]
    logger.warning('%s HTTP %s', code, status)
    return JSONResponse({'code': code, 'message': message}, status_code=status, headers=headers)


def install_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def handle_api_error(_request: Request, exc: ApiError) -> JSONResponse:
        return api_error_response(exc)

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_error(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        status = exc.status_code
        text = exc.detail if isinstance(exc.detail, str) else ''
        if status in (404, 405) and text in ('Not Found', 'Method Not Allowed'):
            # Match the previous API: an unknown route or method is a 404 that names the request.
            target = request.url.path + (f'?{request.url.query}' if request.url.query else '')
            return _http_error_response(404, f'Cannot {request.method} {target}')
        return _http_error_response(status, text, exc.headers)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(_request: Request, exc: RequestValidationError) -> JSONResponse:
        messages = [str(item.get('msg', '')) for item in exc.errors()]
        return _http_error_response(400, ' '.join(message for message in messages if message))

    @app.exception_handler(Exception)
    async def handle_unknown_error(_request: Request, exc: Exception) -> JSONResponse:
        logger.error('Unhandled server error type=%s', type(exc).__name__)
        return JSONResponse(
            {'code': 'INTERNAL_ERROR', 'message': 'The server could not complete this request.'},
            status_code=500,
        )
