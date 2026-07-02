import time
import signal
import sys
from dramatiq.worker import Worker
from app.workers.broker import redis_broker
import app.workers.tasks  # Ensures actors are registered

def main():
    # 1 process (this script), 2 threads, 2000ms (2 seconds) timeout
    worker = Worker(redis_broker, worker_threads=2, worker_timeout=2000)
    worker.start()
    print("Dramatiq worker started with 2 threads and 2s timeout.")

    def signal_handler(signum, frame):
        print("Stopping worker...")
        worker.stop()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    while True:
        time.sleep(1)

if __name__ == "__main__":
    main()
