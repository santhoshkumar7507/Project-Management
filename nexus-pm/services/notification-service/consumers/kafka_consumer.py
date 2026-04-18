import asyncio
import json
import os
import redis
from aiokafka import AIOKafkaConsumer
from workers.celery import send_assignment_email, send_status_change_email

r = redis.from_url(os.environ.get("REDIS_URL", "redis://localhost:6379/1"))
NOTIF_KEY = "nexus:notifications"


def store_notif(user_id, message, notif_type, meta):
    import json as _json
    notif = {"user_id": user_id, "message": message, "type": notif_type, "read": False, "meta": meta}
    r.lpush(NOTIF_KEY, _json.dumps(notif))
    r.ltrim(NOTIF_KEY, 0, 499)


async def consume():
    consumer = AIOKafkaConsumer(
        "task.assigned", "task.updated", "task.created",
        bootstrap_servers=os.environ.get("KAFKA_BOOTSTRAP", "kafka:9092"),
        group_id="notification-group",
        auto_offset_reset="latest",
    )
    await consumer.start()
    print("[NotifyConsumer] Listening to Kafka topics...")
    try:
        async for msg in consumer:
            event = json.loads(msg.value)
            topic = msg.topic

            if topic == "task.assigned":
                assignee_id = event.get("assignee_id", "")
                task_title = event.get("title", "")
                project_id = event.get("project_id", "")
                store_notif(assignee_id, f"You were assigned: {task_title}", "assignment",
                            {"task_id": event.get("task_id"), "project_id": project_id})
                send_assignment_email.delay(f"{assignee_id}@nexus.dev", task_title, project_id)

            elif topic == "task.updated":
                assignee_id = event.get("assignee_id", "")
                if assignee_id:
                    store_notif(assignee_id, f"Task updated: {event.get('title')}", "update",
                                {"task_id": event.get("task_id")})
                    send_status_change_email.delay(
                        f"{assignee_id}@nexus.dev", event.get("title"),
                        event.get("old_status"), event.get("new_status")
                    )

            elif topic == "task.created":
                print(f"[NotifyConsumer] Task created: {event.get('title')}")
    finally:
        await consumer.stop()


if __name__ == "__main__":
    asyncio.run(consume())
