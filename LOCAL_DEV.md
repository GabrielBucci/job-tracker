# Local Development Guide - Resume Roulette

## Quick Start (Already Set Up!)

You already have a virtual environment (`.venv`), so you're ready to go!

### 1. Activate Virtual Environment

**Windows (PowerShell):**
```powershell
.\.venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```cmd
.venv\Scripts\activate.bat
```

**Mac/Linux:**
```bash
source .venv/bin/activate
```

### 2. Install/Update Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run Local Development Server

**Option A: Using the dev script (recommended)**
```bash
python dev.py
```

**Option B: Direct uvicorn command**
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 4. Access Your Site

Open your browser to:
- **Main site:** http://127.0.0.1:8000
- **API docs:** http://127.0.0.1:8000/docs
- **Check jobs:** http://127.0.0.1:8000/check
- **Stats:** http://127.0.0.1:8000/stats

### 5. Make Changes & See Them Live!

With `--reload` enabled, any changes to:
- `main.py`
- `tracker.py`
- `storage.py`
- `index.html`
- `styles.css`
- `roulette-extras.css`
- `app.js`

Will automatically reload the server! Just refresh your browser.

---

## What's Different Locally vs Production?

| Feature | Local (Dev) | Production (Render) |
|---------|-------------|---------------------|
| **URL** | http://127.0.0.1:8000 | https://job-tracker-itsu.onrender.com |
| **Port** | 8000 (hardcoded) | Dynamic `$PORT` from Render |
| **Host** | 127.0.0.1 (localhost only) | 0.0.0.0 (public) |
| **Hot Reload** | ✅ Enabled (`--reload`) | ❌ Disabled (production) |
| **Server** | Uvicorn (dev) | Uvicorn (production) |
| **Data** | Local `seen.json` | Persistent `seen.json` on Render |

---

## Testing Routes Locally

### Test the Homepage
```bash
curl http://127.0.0.1:8000/
```

### Test API Status
```bash
curl http://127.0.0.1:8000/api/status
```

### Test Job Check
```bash
curl http://127.0.0.1:8000/check
```

### Test Stats
```bash
curl http://127.0.0.1:8000/stats
```

---

## Common Development Tasks

### Update Frontend Styling
1. Edit `styles.css` or `roulette-extras.css`
2. Save the file
3. Refresh browser (Ctrl+F5 for hard refresh)

### Update HTML
1. Edit `index.html`
2. Save the file
3. Refresh browser

### Update JavaScript
1. Edit `app.js`
2. Save the file
3. Refresh browser (Ctrl+F5 to clear cache)

### Update Backend Logic
1. Edit `main.py`, `tracker.py`, or `storage.py`
2. Save the file
3. Server auto-reloads (watch terminal for "Application startup complete")
4. Refresh browser

### Add New Companies
1. Edit `tracker.py` → `companies` dictionary
2. Save (server auto-reloads)
3. Test with http://127.0.0.1:8000/check

---

## Troubleshooting

### Port Already in Use
If you see `Address already in use`:
```bash
# Find and kill the process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F
```

### Virtual Environment Not Activated
You'll know if you see `(venv)` or `(.venv)` in your terminal prompt.
If not, run the activation command again.

### Dependencies Missing
```bash
pip install -r requirements.txt
```

### Server Won't Start
Check for Python syntax errors in your `.py` files.
The error will show in the terminal.

---

## Deployment to Render

**IMPORTANT:** Render uses its own configuration and will NOT be affected by local dev changes.

When you're ready to deploy:
1. Commit your changes: `git add .` → `git commit -m "message"`
2. Push to GitHub: `git push`
3. Render auto-deploys from your `main` branch
4. Wait 2-3 minutes for deployment
5. Check https://job-tracker-itsu.onrender.com

**Render uses:**
- `render.yaml` for configuration
- `requirements.txt` for dependencies
- `uvicorn main:app --host 0.0.0.0 --port $PORT` (no reload)

---

## File Structure

```
new app/
├── .venv/              # Virtual environment (local only)
├── main.py             # FastAPI app & routes
├── tracker.py          # Job fetching logic
├── storage.py          # Job storage & deduplication
├── index.html          # Frontend HTML
├── styles.css          # Main CSS
├── roulette-extras.css # Resume Roulette animations
├── app.js              # Frontend JavaScript
├── requirements.txt    # Python dependencies
├── render.yaml         # Render deployment config
├── Procfile            # Alternative deployment config
├── dev.py              # Local dev helper script (NEW!)
└── LOCAL_DEV.md        # This file!
```

---

## Pro Tips

1. **Keep two terminals open:**
   - Terminal 1: Running dev server
   - Terminal 2: Git commands, testing, etc.

2. **Use browser DevTools:**
   - F12 → Console tab to see JavaScript errors
   - Network tab to see API calls
   - Ctrl+Shift+R for hard refresh (clears cache)

3. **Test before deploying:**
   - Always test locally first
   - Check all routes work
   - Verify styling looks good
   - Then commit & push

4. **API Base URL:**
   - Local: Update `app.js` line 7 to `http://127.0.0.1:8000`
   - Production: Keep as `https://job-tracker-itsu.onrender.com`
   - (Or use environment detection - see advanced section)

---

## Advanced: Environment Detection

If you want the frontend to auto-detect local vs production:

**Add to `app.js`:**
```javascript
// Auto-detect environment
const API_BASE_URL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:8000'
    : 'https://job-tracker-itsu.onrender.com';
```

This way you never need to change the URL manually!

---

## Need Help?

- Check terminal output for errors
- Check browser console (F12) for frontend errors
- Test API endpoints with curl or browser
- Make sure virtual environment is activated
- Verify all dependencies are installed

Happy coding! 🎰
