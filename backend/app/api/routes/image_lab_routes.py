"""
IMAGE LAB ROUTES v3.0 – مسارات موحدة لمنصة الإبداع البصري
=============================================================
- تحتفظ بجميع نقاط النهاية القديمة والجديدة
- تدعم التوليد، التحسين، التحليل، التحرير، ولوحة التحكم
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

router = APIRouter(prefix="/api/image-lab", tags=["image-lab"])

# ============================================================
# نماذج الطلبات
# ============================================================
class ImageRequest(BaseModel):
    user_id: str = "test123"
    prompt: str
    style: str = "realistic"
    lighting: str = ""
    camera: str = ""
    negative: str = ""
    language: str = "ar"

class EnhanceRequest(BaseModel):
    user_id: str
    prompt: str
    language: str = "ar"

class AnalyzeRequest(BaseModel):
    user_id: str
    image_base64: str
    language: str = "ar"

class EditRequest(BaseModel):
    user_id: str
    operation: str
    image_base64: str
    prompt: str = ""
    mask_base64: str = ""

class DashboardRequest(BaseModel):
    user_id: str
    lang: str = "ar"

# ============================================================
# نقاط النهاية
# ============================================================

@router.post("/generate")
async def generate_image(req: ImageRequest):
    """
    توليد صورة ذكية مع كامل المراحل:
    فحص السلامة ← اكتشاف النية ← بناء Prompt ← اختيار مزود ← توليد ← تقييم ← حفظ
    """
    try:
        from app.features.image_lab.image_orchestrator import image_lab
        return await image_lab.generate(
            req.user_id, req.prompt, req.style,
            req.lighting, req.camera, req.negative, req.language
        )
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/enhance-prompt")
async def enhance_prompt(req: EnhanceRequest):
    """
    تحسين الـ Prompt باستخدام AI
    """
    try:
        from app.features.image_lab.image_orchestrator import image_lab
        return await image_lab.enhance_prompt(req.user_id, req.prompt)
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/analyze")
async def analyze_image(req: AnalyzeRequest):
    """
    تحليل الصورة: وصف، كلمات مفتاحية، OCR، اكتشاف العناصر
    """
    try:
        from app.features.image_lab.image_orchestrator import image_lab
        return await image_lab.analyze_image(req.image_base64, req.language)
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/edit")
async def edit_image(req: EditRequest):
    """
    تحرير الصورة: Upscale، إزالة خلفية، Inpainting، Face Restore
    """
    try:
        from app.features.image_lab.image_orchestrator import image_lab
        return await image_lab.edit_image(req.operation, req.image_base64,
                                          prompt=req.prompt, mask_base64=req.mask_base64)
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/dashboard/{user_id}")
async def get_dashboard(user_id: str, lang: str = "ar"):
    """
    لوحة تحكم المستخدم: آخر التوليدات، المفضلة، التفضيلات
    """
    try:
        from app.features.image_lab.image_orchestrator import image_lab
        return await image_lab.get_dashboard(user_id, lang)
    except Exception as e:
        raise HTTPException(500, str(e))
