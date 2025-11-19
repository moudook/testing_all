import dotenv
import os
import logging

def setup_logger():
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]

    if log_level not in valid_levels:
        log_level = "INFO"

    logging.basicConfig(
        level=getattr(logging, log_level),
        format="%(asctime)s - %(levelname)s - %(name)s - %(message)s"
    )

    logging.info(f"Logger initialized with level: {log_level}")

def load_config(env_file: str = ".env") -> None:
    # Only load dotenv if file exists (for local dev)
    if os.path.exists(env_file):
        dotenv.load_dotenv(dotenv_path=env_file)
        setup_logger()
        logging.info(f"Loaded environment variables from {env_file}")
    else:
        setup_logger()
        logging.info("No .env file found — relying on system/Docker environment variables.")
