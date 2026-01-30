"""
Job tracker module for fetching jobs from Greenhouse and Lever APIs.
Supports multiple companies and returns standardized job data.
"""

import requests
from typing import List, Dict, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class JobTracker:
    """Fetches jobs from multiple job board APIs."""
    
    def __init__(self):
        self.companies = {
            # Add companies here in format: 'company_name': {'type': 'greenhouse/lever', 'id': 'board_id'}
            # Example Greenhouse companies
            'airbnb': {'type': 'greenhouse', 'id': 'airbnb'},
            'stripe': {'type': 'greenhouse', 'id': 'stripe'},
            # Example Lever companies
            'netflix': {'type': 'lever', 'id': 'netflix'},
        }
    
    def fetch_greenhouse_jobs(self, board_id: str) -> List[Dict]:
        """Fetch jobs from Greenhouse API."""
        try:
            url = f"https://boards-api.greenhouse.io/v1/boards/{board_id}/jobs"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            jobs_data = response.json()
            jobs = []
            
            for job in jobs_data.get('jobs', []):
                jobs.append({
                    'id': f"gh_{board_id}_{job['id']}",
                    'title': job.get('title', 'N/A'),
                    'company': board_id.replace('-', ' ').title(),
                    'url': job.get('absolute_url', ''),
                    'location': job.get('location', {}).get('name', 'Remote'),
                    'source': 'greenhouse'
                })
            
            logger.info(f"Fetched {len(jobs)} jobs from Greenhouse ({board_id})")
            return jobs
            
        except requests.RequestException as e:
            logger.error(f"Error fetching Greenhouse jobs for {board_id}: {e}")
            return []
    
    def fetch_lever_jobs(self, company_id: str) -> List[Dict]:
        """Fetch jobs from Lever API."""
        try:
            url = f"https://api.lever.co/v0/postings/{company_id}"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            jobs_data = response.json()
            jobs = []
            
            for job in jobs_data:
                jobs.append({
                    'id': f"lv_{company_id}_{job['id']}",
                    'title': job.get('text', 'N/A'),
                    'company': company_id.replace('-', ' ').title(),
                    'url': job.get('hostedUrl', ''),
                    'location': job.get('categories', {}).get('location', 'Remote'),
                    'source': 'lever'
                })
            
            logger.info(f"Fetched {len(jobs)} jobs from Lever ({company_id})")
            return jobs
            
        except requests.RequestException as e:
            logger.error(f"Error fetching Lever jobs for {company_id}: {e}")
            return []
    
    def get_jobs(self) -> List[Dict]:
        """
        Fetch jobs from all configured companies.
        Returns a list of job dictionaries with standardized fields.
        """
        all_jobs = []
        
        for company_name, config in self.companies.items():
            if config['type'] == 'greenhouse':
                jobs = self.fetch_greenhouse_jobs(config['id'])
            elif config['type'] == 'lever':
                jobs = self.fetch_lever_jobs(config['id'])
            else:
                logger.warning(f"Unknown job board type for {company_name}")
                continue
            
            all_jobs.extend(jobs)
        
        logger.info(f"Total jobs fetched: {len(all_jobs)}")
        return all_jobs


def get_jobs() -> List[Dict]:
    """Convenience function to get all jobs."""
    tracker = JobTracker()
    return tracker.get_jobs()


if __name__ == "__main__":
    # Test the tracker
    jobs = get_jobs()
    print(f"Found {len(jobs)} jobs")
    if jobs:
        print("\nSample job:")
        print(jobs[0])
