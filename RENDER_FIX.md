# Render Start Command Fix

## ❌ Problem
Render is auto-detecting and using `gunicorn app:app` instead of our uvicorn command.

## ✅ Solution

**In your Render dashboard:**

1. Go to your service settings
2. Find **"Start Command"** field
3. **Delete** any auto-filled command
4. Enter exactly this:
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
5. Click **"Save Changes"**
6. Render will automatically redeploy

## Alternative: Use render.yaml

Or I can create a `render.yaml` file that explicitly sets the start command. This ensures Render uses the correct command every time.

Let me know which approach you prefer!
