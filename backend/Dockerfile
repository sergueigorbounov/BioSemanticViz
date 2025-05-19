FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libxml2-dev \
    libxslt1-dev \
    gcc \
    python3-pyqt5 \
    libqt5x11extras5 \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Bio and other missing packages
RUN pip install biopython==1.81 pandas numpy matplotlib ete3==3.1.2

# Copy application code
COPY . .

# Expose the port
EXPOSE 8002

# Set environment variables
ENV PYTHONPATH=/app
ENV QT_QPA_PLATFORM=offscreen

# Start the FastAPI app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]
