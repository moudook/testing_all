import pathway as pw

class VideoSchema(pw.Schema):
    stream_type: str
    data: bytes
    timestamp: float

def streaming_pipeline():
    # Read from Kafka
    # We assume 3 topics: video_raw_stream, audio_system_stream, audio_mic_stream
    # We can read them all or separate pipelines.
    # For simplicity, let's use one pipeline for video.

    video_stream = pw.io.kafka.read(
        rdkafka_settings={
            "bootstrap.servers": "localhost:9092",
            "group.id": "pathway-video-processor",
            "auto.offset.reset": "latest"
        },
        topic="video_raw_stream",
        schema=VideoSchema,
        format="json" # or binary if we send raw bytes, but we likely wrap in JSON with metadata
    )

    # Process: Just forward for now, maybe add processing timestamp
    processed_video = video_stream.select(
        *pw.this,
        processed_at=pw.this.timestamp # Placeholder for processing
    )

    # Write back to Kafka for playback
    pw.io.kafka.write(
        processed_video,
        rdkafka_settings={
            "bootstrap.servers": "localhost:9092",
        },
        topic_name="video_live_out",
        format="json"
    )

    pw.run()

if __name__ == "__main__":
    streaming_pipeline()
