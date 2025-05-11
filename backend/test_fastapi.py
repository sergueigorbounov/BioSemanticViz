#!/usr/bin/env python3
"""
Test script to start the FastAPI server directly for testing purposes.
"""

import uvicorn

if __name__ == "__main__":
    print("Starting FastAPI server on http://localhost:8002")
    print("API documentation available at http://localhost:8002/docs")
    uvicorn.run("app.fastapi_main:app", host="0.0.0.0", port=8002, reload=True) 