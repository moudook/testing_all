import os
import json
from kafka import KafkaConsumer
from .pipeline import process_event

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "kafka:9092")

consumer = KafkaConsumer(
    'fullCRM.Pathway.applications',             # USE THESE TOPICS FOR PATHWAY PIPELINE
    'fullCRM.Pathway.meetings',                     #
    'fullCRM.Pathway.startups',                     #
    bootstrap_servers=KAFKA_BROKER,
    group_id='fastapi-pathway',
    value_deserializer=lambda m: json.loads(m.decode('utf-8'))
)

def start_consumer():
    print("Pathway consumer started...")
    for message in consumer:
        payload = message.value
        process_event(payload)
