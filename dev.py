#!/usr/bin/env python3
"""
Local Development Server Runner
Starts the FastAPI app with hot reload for rapid iteration.
This does NOT affect production deployment on Render.
"""

import subprocess
import sys
import os

def main():
    print("🎰 Starting Resume Roulette - Local Development Server")
    print("=" * 60)
    print("📍 URL: http://127.0.0.1:8000")
    print("📚 API Docs: http://127.0.0.1:8000/docs")
    print("🔄 Hot Reload: ENABLED")
    print("=" * 60)
    print("\n✨ Make changes to any file and they'll auto-reload!")
    print("🛑 Press Ctrl+C to stop the server\n")
    
    try:
        # Run uvicorn with reload enabled
        subprocess.run([
            "uvicorn",
            "main:app",
            "--reload",
            "--host", "127.0.0.1",
            "--port", "8000"
        ], check=True)
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped. See you next time!")
        sys.exit(0)
    except FileNotFoundError:
        print("\n❌ Error: uvicorn not found!")
        print("💡 Install dependencies: pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
