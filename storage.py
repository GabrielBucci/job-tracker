"""
Storage module for tracking seen jobs and identifying new listings.
Uses JSON file for persistence.
"""

import json
import os
from typing import List, Dict, Set
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

STORAGE_FILE = "seen.json"


class JobStorage:
    """Manages storage of seen job IDs."""
    
    def __init__(self, storage_file: str = STORAGE_FILE):
        self.storage_file = storage_file
        self.seen_ids: Set[str] = self.load_seen_ids()
    
    def load_seen_ids(self) -> Set[str]:
        """Load previously seen job IDs from storage file."""
        if not os.path.exists(self.storage_file):
            logger.info(f"Storage file {self.storage_file} not found, creating new one")
            return set()
        
        try:
            with open(self.storage_file, 'r') as f:
                data = json.load(f)
                seen_ids = set(data.get('seen_ids', []))
                logger.info(f"Loaded {len(seen_ids)} seen job IDs")
                return seen_ids
        except (json.JSONDecodeError, IOError) as e:
            logger.error(f"Error loading seen IDs: {e}")
            return set()
    
    def save_seen_ids(self):
        """Save seen job IDs to storage file."""
        try:
            with open(self.storage_file, 'w') as f:
                json.dump({'seen_ids': list(self.seen_ids)}, f, indent=2)
            logger.info(f"Saved {len(self.seen_ids)} seen job IDs")
        except IOError as e:
            logger.error(f"Error saving seen IDs: {e}")
    
    def add_seen_ids(self, job_ids: List[str]):
        """Add job IDs to the seen set and save."""
        before_count = len(self.seen_ids)
        self.seen_ids.update(job_ids)
        after_count = len(self.seen_ids)
        
        if after_count > before_count:
            self.save_seen_ids()
            logger.info(f"Added {after_count - before_count} new job IDs")
    
    def find_new_jobs(self, jobs: List[Dict]) -> List[Dict]:
        """
        Filter jobs to find only new ones (not previously seen).
        Automatically adds new job IDs to seen set.
        
        Args:
            jobs: List of job dictionaries with 'id' field
            
        Returns:
            List of new jobs that haven't been seen before
        """
        new_jobs = []
        new_ids = []
        
        for job in jobs:
            job_id = job.get('id')
            if not job_id:
                logger.warning("Job missing ID, skipping")
                continue
            
            if job_id not in self.seen_ids:
                new_jobs.append(job)
                new_ids.append(job_id)
        
        # Add new IDs to seen set
        if new_ids:
            self.add_seen_ids(new_ids)
            logger.info(f"Found {len(new_jobs)} new jobs")
        else:
            logger.info("No new jobs found")
        
        return new_jobs


# Global storage instance
_storage = None


def get_storage() -> JobStorage:
    """Get or create the global storage instance."""
    global _storage
    if _storage is None:
        _storage = JobStorage()
    return _storage


def find_new_jobs(jobs: List[Dict]) -> List[Dict]:
    """Convenience function to find new jobs."""
    storage = get_storage()
    return storage.find_new_jobs(jobs)


if __name__ == "__main__":
    # Test the storage
    test_jobs = [
        {'id': 'job1', 'title': 'Software Engineer'},
        {'id': 'job2', 'title': 'Product Manager'},
        {'id': 'job3', 'title': 'Designer'},
    ]
    
    print("First run:")
    new = find_new_jobs(test_jobs)
    print(f"New jobs: {len(new)}")
    
    print("\nSecond run (should find 0 new):")
    new = find_new_jobs(test_jobs)
    print(f"New jobs: {len(new)}")
    
    print("\nThird run with one new job:")
    test_jobs.append({'id': 'job4', 'title': 'Data Scientist'})
    new = find_new_jobs(test_jobs)
    print(f"New jobs: {len(new)}")
