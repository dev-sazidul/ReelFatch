from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Request
from fastapi.responses import Response, StreamingResponse

from app.errors import ApiError, api_error_response
from app.rate_limit import throttle
from app.videos.service import VideosService
from app.videos.validation import read_json_body, validate_download, validate_lookup

router = APIRouter(prefix='/api/videos')


def get_service(request: Request) -> VideosService:
    return request.app.state.videos


@router.post('/lookup', status_code=201, dependencies=[Depends(throttle('lookup'))])
async def lookup(request: Request, service: VideosService = Depends(get_service)) -> dict[str, Any]:
    body = validate_lookup(await read_json_body(request))
    return await service.lookup(body.url)


@router.get('/lookups/{lookup_id}', dependencies=[Depends(throttle('metadata'))])
async def metadata(lookup_id: str, service: VideosService = Depends(get_service)) -> dict[str, Any]:
    return service.get_lookup(lookup_id)


@router.post('/downloads', status_code=201, dependencies=[Depends(throttle('createDownload'))])
async def create_download(request: Request, service: VideosService = Depends(get_service)) -> dict[str, Any]:
    body = validate_download(await read_json_body(request))
    return await service.create_download(body.lookup_id, body.quality_id)


@router.get('/downloads/{job_id}', dependencies=[Depends(throttle('downloadStatus'))])
async def download_status(job_id: str, service: VideosService = Depends(get_service)) -> dict[str, Any]:
    return service.get_download(job_id)


@router.get('/downloads/{job_id}/file', dependencies=[Depends(throttle('downloadFile'))])
async def download_file(job_id: str, service: VideosService = Depends(get_service)) -> Response:
    no_store = {'cache-control': 'no-store'}
    try:
        opened = await service.open_download(job_id)
    except ApiError as error:
        return api_error_response(error, headers=no_store)
    headers = {**no_store, 'content-disposition': f'attachment; filename="{opened.filename}"'}
    if opened.content_length is not None:
        headers['content-length'] = str(opened.content_length)
    return StreamingResponse(opened.stream, media_type=opened.content_type, headers=headers)
