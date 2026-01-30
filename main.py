"""
FastAPI server for job tracking application.
Provides endpoints to check for new jobs and view status.
"""

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from typing import Dict, List
import logging
from datetime import datetime

from tracker import get_jobs
from storage import find_new_jobs

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Job Tracker API",
    description="Track new job postings from multiple companies",
    version="1.0.0"
)


@app.get("/")
async def root() -> Dict:
    """
    Health check endpoint.
    Returns API status and basic information.
    """
    return {
        "status": "online",
        "service": "Job Tracker API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "endpoints": {
            "/": "API status",
            "/check": "Check for new jobs",
            "/docs": "API documentation"
        }
    }


@app.get("/check")
async def check_jobs() -> Dict:
    """
    Check for new job postings.
    
    Returns:
        JSON with new jobs found and summary statistics
    """
    try:
        logger.info("Starting job check...")
        
        # Fetch all jobs from APIs
        all_jobs = get_jobs()
        
        # Find new jobs (not previously seen)
        new_jobs = find_new_jobs(all_jobs)
        
        # Prepare response
        response = {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "summary": {
                "total_jobs_fetched": len(all_jobs),
                "new_jobs_found": len(new_jobs),
                "companies_checked": len(set(job.get('company', 'Unknown') for job in all_jobs))
            },
            "new_jobs": new_jobs
        }
        
        logger.info(f"Check complete: {len(new_jobs)} new jobs found out of {len(all_jobs)} total")
        return response
        
    except Exception as e:
        logger.error(f"Error checking jobs: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )


@app.get("/stats")
async def get_stats() -> Dict:
    """
    Get statistics about tracked jobs.
    
    Returns:
        JSON with tracking statistics
    """
    try:
        from storage import get_storage
        
        storage = get_storage()
        
        return {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "stats": {
                "total_jobs_seen": len(storage.seen_ids),
                "storage_file": storage.storage_file
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
