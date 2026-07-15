import os, logging

logger = logging.getLogger("redis_config")

try:
    import redis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    r = redis.Redis.from_url(REDIS_URL)
    r.ping()
    REDIS_AVAILABLE = True
    logger.info("✅ Redis متصل")
except Exception as e:
    REDIS_AVAILABLE = False
    r = None
    logger.info(f"ℹ️ Redis غير متوفر (سيتم التعطيل): {e}")
