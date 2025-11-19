import logging

logger = logging.getLogger(__name__)

def process_event(event: dict):
    op = event.get('op')  # c=create, u=update, d=delete
    data = event.get('after') or event.get('before')
    logger.info(f"[Pathway] {op} operation detected on _id={data.get('_id')}")
