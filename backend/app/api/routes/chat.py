"""
CHAT ROUTER v2.0 – توجيه ذكي متكامل مع Life Coach
=====================================================
- يكتشف نية المستخدم (قدرة مطلوبة)
- يوجه المحادثة إلى Life Coach عند الحاجة
- يحافظ على تدفق المحادثة الطبيعي مع التوأم
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []
    lang: str = "ar"
    user_id: Optional[str] = None

# قائمة الكلمات المفتاحية التي تشير إلى حاجة المستخدم لـ Life Coach
LIFE_COACH_KEYWORDS = [
    # عربي
    "مدرب", "حياتي", "مشكلة", "علاقتي", "وظيفتي", "مالي", "ديون", "ادخار",
    "نومي", "نوم", "أرق", "رياضة", "تمارين", "تغذية", "غذاء", "وزني",
    "قلق", "خائف", "حزين", "مكتئب", "ضغط", "توتر", "احتراق", "فقدت",
    "مقابلة", "سيرة ذاتية", "ترقية", "استقالة", "زواج", "طلاق", "أطفالي",
    "مدخرات", "ميزانية", "دخل", "مصاريف",
    # إنجليزي
    "coach", "problem", "relationship", "job", "career", "money", "debt", "savings",
    "sleep", "insomnia", "exercise", "workout", "nutrition", "diet", "weight",
    "anxious", "scared", "sad", "depressed", "stress", "burnout", "interview",
    "CV", "resume", "promotion", "resign", "marriage", "divorce", "kids",
    "budget", "income", "expenses", "financial"
]

def detect_life_coach_intent(message: str) -> bool:
    """يكتشف ما إذا كانت رسالة المستخدم تتعلق بمجال Life Coach"""
    msg_lower = message.lower()
    return any(keyword in msg_lower for keyword in LIFE_COACH_KEYWORDS)

@router.post("/chat")
async def chat(req: ChatRequest):
    try:
        message = req.message.strip()
        if not message:
            raise HTTPException(400, "Message cannot be empty")

        # محاولة اكتشاف هل يحتاج المستخدم إلى Life Coach
        if detect_life_coach_intent(message):
            logger.info(f"Life Coach intent detected: {message[:50]}...")
            try:
                from app.features.life_coach.life_coach_orchestrator import life_coach
                result = await life_coach.full_session(req.user_id, message, req.lang)
                return {
                    "reply": result.get("coach_reply", ""),
                    "provider": "life_coach",
                    "emotion": result.get("analysis", {}).get("emotion", {}).get("primary", "neutral"),
                    "life_coach_data": result  # بيانات إضافية للواجهة الأمامية
                }
            except Exception as e:
                logger.warning(f"Life Coach fallback: {e}")

        # السلوك الافتراضي: Twin Brain
        from app.twin_brain.brain_orchestrator import brain_orchestrator
        response = await brain_orchestrator.process(req.user_id, message, req.history, req.lang)
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(500, str(e))
