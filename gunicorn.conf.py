import multiprocessing
import os

# Server socket
port = os.environ.get('PORT', '5000')
bind = f"0.0.0.0:{port}"
backlog = 2048

# Worker processes & threading
workers = int(os.environ.get('WEB_CONCURRENCY', max(2, multiprocessing.cpu_count() * 2 + 1)))
worker_class = 'gthread'
threads = int(os.environ.get('PYTHON_THREADS', 4))
worker_connections = 1000
timeout = 60
keepalive = 5

# Process naming & lifecycle
proc_name = 'sompheareak-api'
preload_app = True

# Logging
accesslog = '-'
errorlog = '-'
loglevel = os.environ.get('LOG_LEVEL', 'info')
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" (%(L)ss)'
