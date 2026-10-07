FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Prevent Python from creating .pyc files
ENV PYTHONDONTWRITEBYTECODE=1

# Prevent Python from buffering logs
ENV PYTHONUNBUFFERED=1

# Copy dependencies first for better Docker caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Hugging Face Spaces expects the application on port 7860
EXPOSE 7860

# Start FastAPI
CMD ["uvicorn", "ml_service:app", "--host", "0.0.0.0", "--port", "7860"]