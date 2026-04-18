import json
import os
from aiokafka import AIOKafkaProducer

_producer: AIOKafkaProducer | None = None

async def get_producer() -> AIOKafkaProducer:
    global _producer
    if _producer is None:
        _producer = AIOKafkaProducer(
            bootstrap_servers=os.environ.get("KAFKA_BOOTSTRAP", "kafka:9092")
        )
        await _producer.start()
    return _producer

async def publish(topic: str, payload: dict):
    producer = await get_producer()
    await producer.send_and_wait(topic, json.dumps(payload).encode())

async def stop_producer():
    global _producer
    if _producer:
        await _producer.stop()
        _producer = None
