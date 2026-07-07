"""
PASS MEMORY v1.1 – ذاكرة P.A.S.S. مع حفظ فعلي في History
=============================================================
- يحفظ المهام في TCMA
- يحفظ تلقائياً في جدول projects (History)
"""
import logging
from typing import Dict, Any
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class PASSMemory:
    def __init__(self):
        self.memory_client = None

    async def save_task(self, user_id: str, task: Dict):
        """حفظ المهمة في TCMA و History"""
        if self.memory_client:
            try:
                # حفظ في TCMA
                await self.memory_client.store_entity("pass_task", f"{user_id}_{task.get('id')}", {
                    "user_id": user_id, "task_id": task["id"], "title": task["title"],
                    "priority": task.get("priority"), "status": task.get("status"),
                    "created_at": task.get("created_at"),
                })
                # حفظ في History (جدول projects)
                await self.memory_client.store_entity("project", user_id, {
                    "title": f"مهمة: {task.get('title', '')}",
                    "type": "task",
                    "data": task,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "user_id": user_id
                })
            except Exception as e:
                logger.warning(f"Memory save failed: {e}")

    async def complete_task(self, user_id: str, task: Dict):
        """تحديث المهمة كمكتملة في TCMA و History"""
        if self.memory_client:
            try:
                task["status"] = "completed"
                task["completed_at"] = datetime.now(timezone.utc).isoformat()
                await self.memory_client.store_entity("pass_task", f"{user_id}_{task.get('id')}", task)
                # تحديث في History
                await self.memory_client.store_entity("project", user_id, {
                    "title": f"✅ تم: {task.get('title', '')}",
                    "type": "task",
                    "data": task,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "user_id": user_id
                })
            except Exception as e:
                logger.warning(f"Memory complete failed: {e}")


pass_memory = PASSMemory()
