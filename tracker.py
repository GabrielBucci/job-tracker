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
            # Greenhouse companies (most reliable)
            'airbnb': {'type': 'greenhouse', 'id': 'airbnb'},
            'stripe': {'type': 'greenhouse', 'id': 'stripe'},
            'dropbox': {'type': 'greenhouse', 'id': 'dropbox'},
            'coinbase': {'type': 'greenhouse', 'id': 'coinbase'},
            'robinhood': {'type': 'greenhouse', 'id': 'robinhood'},
            'doordash': {'type': 'greenhouse', 'id': 'doordash'},
            'instacart': {'type': 'greenhouse', 'id': 'instacart'},
            'discord': {'type': 'greenhouse', 'id': 'discord'},
            'ramp': {'type': 'greenhouse', 'id': 'ramp'},
            'plaid': {'type': 'greenhouse', 'id': 'plaid'},
            'notion': {'type': 'greenhouse', 'id': 'notion'},
            'figma': {'type': 'greenhouse', 'id': 'figma'},
            'airtable': {'type': 'greenhouse', 'id': 'airtable'},
            'databricks': {'type': 'greenhouse', 'id': 'databricks'},
        }
    
    def is_us_location(self, location: str) -> bool:
        """Check if a location is in the US."""
        if not location:
            return True  # Include jobs with no location specified
        
        location_lower = location.lower()
        
        # US indicators
        us_indicators = [
            'united states', 'usa', 'u.s.', 'us ',
            'remote', 'remote us', 'remote - us',
            'california', 'ca', 'san francisco', 'sf', 'bay area',
            'new york', 'ny', 'nyc', 'manhattan',
            'washington', 'seattle', 'wa',
            'texas', 'tx', 'austin', 'dallas',
            'colorado', 'co', 'denver',
            'massachusetts', 'ma', 'boston',
            'illinois', 'il', 'chicago',
            'florida', 'fl', 'miami',
            'oregon', 'or', 'portland',
            'georgia', 'ga', 'atlanta',
        ]
        
        # Non-US indicators (to exclude)
        non_us_indicators = [
            'london', 'uk', 'united kingdom', 'england',
            'canada', 'toronto', 'vancouver',
            'europe', 'emea', 'apac', 'asia',
            'india', 'bangalore', 'mumbai',
            'singapore', 'australia', 'sydney',
            'germany', 'berlin', 'france', 'paris',
        ]
        
        # Check for non-US locations first
        for indicator in non_us_indicators:
            if indicator in location_lower:
                return False
        
        # Check for US locations
        for indicator in us_indicators:
            if indicator in location_lower:
                return True
        
        # Default to False if we can't determine
        return False
    
    def fetch_greenhouse_jobs(self, board_id: str) -> List[Dict]:
        """Fetch jobs from Greenhouse API."""
        try:
            url = f"https://boards-api.greenhouse.io/v1/boards/{board_id}/jobs"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            jobs_data = response.json()
            jobs = []
            
            for job in jobs_data.get('jobs', []):
                location = job.get('location', {}).get('name', 'Remote')
                
                # Filter for US locations only
                if not self.is_us_location(location):
                    continue
                
                jobs.append({
                    'id': f"gh_{board_id}_{job['id']}",
                    'title': job.get('title', 'N/A'),
                    'company': board_id.replace('-', ' ').title(),
                    'url': job.get('absolute_url', ''),
                    'location': location,
                    'source': 'greenhouse'
                })
            
            logger.info(f"Fetched {len(jobs)} US jobs from Greenhouse ({board_id})")
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
