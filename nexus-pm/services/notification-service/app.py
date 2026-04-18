import os
import json
import redis
from flask import Flask, jsonify

app = Flask(__name__)
r = redis.from_url(os.environ.get("REDIS_URL", "redis://localhost:6379/1"))

NOTIF_KEY = "nexus:notifications"


def push_notification(user_id: str, message: str, notif_type: str, meta: dict):
    notif = {"user_id": user_id, "message": message, "type": notif_type,
             "read": False, "meta": meta}
    r.lpush(NOTIF_KEY, json.dumps(notif))
    r.ltrim(NOTIF_KEY, 0, 499)  # keep latest 500


@app.get("/api/notifications/<user_id>")
def get_notifications(user_id):
    raw = r.lrange(NOTIF_KEY, 0, 49)
    notifs = [json.loads(n) for n in raw if json.loads(n).get("user_id") == user_id]
    return jsonify(notifs)


@app.patch("/api/notifications/<user_id>/read-all")
def mark_read(user_id):
    raw = r.lrange(NOTIF_KEY, 0, -1)
    updated = []
    for n in raw:
        obj = json.loads(n)
        if obj.get("user_id") == user_id:
            obj["read"] = True
        updated.append(json.dumps(obj))
    if updated:
        r.delete(NOTIF_KEY)
        r.rpush(NOTIF_KEY, *updated)
    return jsonify({"ok": True})


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "notification-service"})
