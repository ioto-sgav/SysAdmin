# backend/desktop.py
import threading
import time
import webview
import uvicorn
from server import app # Import your FastAPI app

def start_server():
    # Start the FastAPI server without the reloader to avoid multi-threading issues
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="error")

if __name__ == "__main__":
    # Start the server in a background thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Give the server a few seconds to boot up
    time.sleep(3)

    # Open the desktop window pointing to the local server
    webview.create_window("SysAdmin", "http://127.0.0.1:8001")
    webview.start()