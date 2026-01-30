"""
Custom static file handler for serving frontend assets
"""
from fastapi import Response
from pathlib import Path

MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
}

def get_static_file(filename: str) -> Response:
    """Serve a static file with the correct MIME type"""
    file_path = Path(filename)
    
    if not file_path.exists():
        return Response(content="File not found", status_code=404)
    
    # Get MIME type
    suffix = file_path.suffix.lower()
    mime_type = MIME_TYPES.get(suffix, 'application/octet-stream')
    
    # Read and return file
    with open(file_path, 'rb') as f:
        content = f.read()
    
    return Response(content=content, media_type=mime_type)
