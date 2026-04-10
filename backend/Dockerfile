# ZivonPay Backend Dockerfile
# Multi-stage build for production

FROM python:3.11-slim as builder

# Set working directory
WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.11-slim

# Security: Create non-root user
RUN groupadd -r zivonpay && useradd -r -g zivonpay zivonpay

# Set working directory
WORKDIR /app

# Copy Python dependencies from builder
COPY --from=builder /root/.local /home/zivonpay/.local

# Copy application code
COPY --chown=zivonpay:zivonpay . .

# Set PATH for user-installed packages
ENV PATH=/home/zivonpay/.local/bin:$PATH

# Switch to non-root user
USER zivonpay

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health', timeout=5)"

# Start application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
