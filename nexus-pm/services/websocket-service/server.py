import asyncio
import json
import os
import socketio
from aiohttp import web
from aiokafka import AIOKafkaConsumer

sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode="aiohttp")
app = web.Application()
sio.attach(app)

# Track which socket IDs are in which project room
connected_users: dict[str, str] = {}  # sid -> user_id


@sio.event
async def connect(sid, environ):
    print(f"[WS] Client connected: {sid}")


@sio.event
async def disconnect(sid):
    connected_users.pop(sid, None)
    print(f"[WS] Client disconnected: {sid}")


@sio.event
async def join_project(sid, data):
    project_id = data.get("project_id")
    user_id = data.get("user_id", "anonymous")
    room = f"project_{project_id}"
    await sio.enter_room(sid, room)
    connected_users[sid] = user_id
    await sio.emit("joined", {"room": room, "user_id": user_id}, to=sid)
    print(f"[WS] {user_id} joined room {room}")


@sio.event
async def leave_project(sid, data):
    project_id = data.get("project_id")
    await sio.leave_room(sid, f"project_{project_id}")


async def kafka_broadcast():
    consumer = AIOKafkaConsumer(
        "task.assigned", "task.updated", "task.created",
        bootstrap_servers=os.environ.get("KAFKA_BOOTSTRAP", "kafka:9092"),
        group_id="websocket-group",
        auto_offset_reset="latest",
    )
    await consumer.start()
    print("[WS Kafka] Listening for events to broadcast...")
    try:
        async for msg in consumer:
            event = json.loads(msg.value)
            project_id = event.get("project_id")
            if not project_id:
                continue
            room = f"project_{project_id}"
            event["_topic"] = msg.topic
            await sio.emit("task_event", event, room=room)
            print(f"[WS Kafka] Broadcasted {msg.topic} to {room}")
    finally:
        await consumer.stop()


async def on_startup(app):
    asyncio.create_task(kafka_broadcast())


app.on_startup.append(on_startup)

if __name__ == "__main__":
    web.run_app(app, host="0.0.0.0", port=8004)
