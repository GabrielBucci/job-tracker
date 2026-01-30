# Job Tracker

A FastAPI-based job tracker that monitors job postings from Greenhouse and Lever APIs, detects new listings, and is ready for AI filtering.

## Features

- 🔍 Fetches jobs from Greenhouse and Lever APIs
- 🆕 Detects new job listings automatically
- 💾 Persistent storage using JSON
- 🚀 FastAPI REST API
- ☁️ Ready for Railway deployment
- 🤖 Prepared for Claude AI integration

## Local Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run Locally

```bash
uvicorn main:app --reload
```

### 3. Test Endpoints

- **Status**: http://127.0.0.1:8000/
- **Check Jobs**: http://127.0.0.1:8000/check
- **Stats**: http://127.0.0.1:8000/stats
- **API Docs**: http://127.0.0.1:8000/docs

## API Endpoints

### `GET /`
Health check and API information

### `GET /check`
Check for new job postings. Returns:
- Total jobs fetched
- Number of new jobs
- List of new jobs with details

### `GET /stats`
Get tracking statistics

## Configuration

Edit `tracker.py` to add more companies:

```python
self.companies = {
    'company_name': {'type': 'greenhouse', 'id': 'board_id'},
    # or
    'company_name': {'type': 'lever', 'id': 'company_id'},
}
```

## Deployment to Railway

1. Push code to GitHub
2. Connect Railway to your repository
3. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Deploy and get your public URL

## Project Structure

```
job-tracker/
├── main.py          # FastAPI server
├── tracker.py       # Job fetching logic
├── storage.py       # Job tracking storage
├── requirements.txt # Python dependencies
├── seen.json        # Tracked job IDs (auto-generated)
└── README.md        # This file
```

## Future Enhancements

- [ ] Add Claude AI for intelligent job filtering
- [ ] Email notifications for new jobs
- [ ] Support for more job boards
- [ ] Web dashboard UI
- [ ] Scheduled automatic checks
