from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Body
from fastapi.staticfiles import StaticFiles
from fastapi import Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timezone, timedelta
from email.message import EmailMessage
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas
from fastapi.responses import FileResponse
from email.mime.text import MIMEText
from bson import ObjectId
import random
import smtplib
import requests
import json
import resend
import aiosmtplib
import os
import logging
import jwt
import bcrypt
import razorpay
import secrets
import hashlib
import uuid
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")
resend.api_key = os.environ["RESEND_API_KEY"]

# MongoDB connection
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# JWT Configuration
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Razorpay client
razorpay_client = razorpay.Client(
    auth=(os.environ["RAZORPAY_KEY_ID"], os.environ["RAZORPAY_KEY_SECRET"])
)

app = FastAPI()
if os.path.isdir("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
origins = [
    "https://khajurkart.com",
    "https://www.khajurkart.com",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
api_router = APIRouter(prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.head("/")
async def root_head():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {"message": "KhajurKart Backend Running 🚀"}


security = HTTPBearer()

# ============ MODELS ============


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: str
    role: Optional[str] = "user"
    phone: Optional[str] = None
    created_at: str
    addresses: Optional[List[dict]] = []


class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    slug: str
    description: str
    image: str


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    price: Optional[float] = None
    description: str
    category: str
    image: str
    stock: int
    featured: bool = False
    delivery_charge: float = 0.0

    sizes: List[dict] = []  # ✅ new    original_price: Optional[float] = None


class ProductCreate(BaseModel):
    name: str
    description: str
    original_price: Optional[float] = None
    category: str
    image: str
    stock: int
    featured: bool = False
    delivery_charge: float = 0.0

    sizes: List[dict] = []


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    original_price: Optional[float] = None
    category: Optional[str] = None
    image: Optional[str] = None
    stock: Optional[int] = None
    featured: Optional[bool] = None
    delivery_charge: Optional[float] = None

    sizes: Optional[List[dict]] = None


class CartItem(BaseModel):
    product_id: str
    quantity: int
    size: Optional[str] = None


class CartItemResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: str
    quantity: int
    product: Optional[Product] = None


class Cart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    items: List[CartItemResponse]


class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    size: Optional[str] = None
    original_price: Optional[float] = None  # ✅ ADD
    price: float
    discount: Optional[int] = 0  # ✅ ADD

    model_config = ConfigDict(extra="allow")  # 🔥 ADD THIS


class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    customer_name: str
    customer_email: str
    items: List[OrderItem]
    total_amount: float
    delivery_charges: float
    payment_method: str
    payment_status: str
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    shipping_address: dict
    status: str
    tracking_id: Optional[str] = None
    created_at: str


class ReturnRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    order_id: str
    user_id: str
    customer_name: str
    customer_email: str
    items: List[OrderItem]
    reason: str
    request_type: str  # "return" or "exchange"
    status: str  # "pending", "approved", "rejected", "completed"
    images: Optional[List[str]] = None
    admin_notes: Optional[str] = None
    created_at: str


class CreateReturnRequest(BaseModel):
    order_id: str
    items: List[OrderItem]
    reason: str
    request_type: str
    images: Optional[List[str]] = None


class CreateOrder(BaseModel):
    items: List[OrderItem]
    total_amount: float
    payment_method: str
    shipping_address: dict


class RazorpayOrder(BaseModel):
    amount: float
    currency: str = "INR"


class RazorpayVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    order_id: str


class Review(BaseModel):
    id: str
    product_id: str
    user_name: str
    rating: int
    comment: str
    created_at: str


class ContactForm(BaseModel):
    name: str = Field(min_length=2)
    email: EmailStr
    phone: Optional[str]
    message: str = Field(min_length=5)


class VerifyRequest(BaseModel):
    email: str
    verification_code: str


# ============ AUTH HELPERS ============

ADMIN_EMAILS = ["admin@khajurkart.com", "khajurkart@gmail.com"]  # Admin email list


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def generate_reset_token():
    token = secrets.token_urlsafe(32)
    hashed = hashlib.sha256(token.encode()).hexdigest()
    return token, hashed


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("email") not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ============ EMAIL VERIFICATION ============


def send_verification_email(to_email, name, code):
    try:
        html = f"""
        <!DOCTYPE html>
        <html>
        <body style="margin:0; padding:0; background:#f5f5f5; font-family:Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding:40px 0;">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">
                  
                  <!-- HEADER -->
                  <tr>
                    <td style="background:#064E3B; padding:30px; text-align:center;">
                      <h1 style="color:#C6A962; margin:0; font-size:28px;">KhajurKart</h1>
                      <p style="color:#ffffff; margin:5px 0 0; font-size:13px;">Premium Dates, Dry Fruits & Spices</p>
                    </td>
                  </tr>

                  <!-- BODY -->
                  <tr>
                    <td style="padding:40px 30px;">
                      <h2 style="color:#064E3B; margin:0 0 20px;">🔐 Verify Your Account</h2>
                      <p style="color:#333; font-size:15px;">Hi <strong>{name}</strong> 👋</p>
                      <p style="color:#555; font-size:14px;">You're just one step away! Use the verification code below to continue:</p>
                      
                      <!-- OTP BOX -->
                      <div style="background:#f0fdf4; border:2px dashed #064E3B; border-radius:8px; padding:20px; text-align:center; margin:25px 0;">
                        <p style="margin:0 0 5px; color:#555; font-size:13px;">Your Verification Code</p>
                        <h1 style="margin:0; color:#064E3B; font-size:42px; letter-spacing:8px;">{code}</h1>
                      </div>

                      <p style="color:#555; font-size:13px;">⏳ This code expires in <strong>10 minutes</strong>.</p>
                      <p style="color:#555; font-size:13px;">🔒 Do not share this code with anyone.</p>

                      <!-- NOT SPAM -->
                      <div style="background:#fff3cd; padding:15px; border-radius:4px; margin:20px 0;">
                        <p style="margin:0; color:#856404; font-size:13px;">
                          📬 If this email is in spam, please mark it as 
                          <strong>"Not Spam"</strong> to receive future emails properly.
                        </p>
                      </div>

                      <!-- ADDRESS FOOTER -->
                      <div style="text-align:center; padding:15px 0; color:#999; font-size:11px;">
                        <p style="margin:0;">KhajurKart | 10-3-313/a, AR Raheem Residency, Hyderabad 500057</p>
                        <p style="margin:5px 0 0;">You received this because you registered at khajurkart.com</p>
                      </div>
                    </td>
                  </tr>

                  <!-- FOOTER -->
                  <tr>
                    <td style="background:#064E3B; padding:20px; text-align:center;">
                      <p style="color:#C6A962; margin:0; font-size:13px;">© 2026 KhajurKart. All rights reserved.</p>
                      <p style="color:#ffffff; margin:5px 0 0; font-size:12px;">Hyderabad, Telangana 500057</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """
        resend.Emails.send(
            {
                "from": "KhajurKart <no-reply@khajurkart.com>",
                "to": [to_email],
                "subject": "✨ Your Verification Code - KhajurKart",
                "html": html,
            }
        )
        print("✅ VERIFICATION EMAIL SENT")
    except Exception as e:
        print("❌ VERIFICATION EMAIL ERROR:", str(e))


# ============ SMS VERIFICATION ============


async def send_verification_sms(phone: str, code: str, name: str) -> bool:
    """Send OTP via SMS using Fast2SMS. Returns True if successful."""
    try:
        # Clean phone number - remove +91 or 0 prefix
        clean_phone = phone.strip()
        if clean_phone.startswith("+91"):
            clean_phone = clean_phone[3:]
        if clean_phone.startswith("0"):
            clean_phone = clean_phone[1:]

        api_key = os.environ.get("FAST2SMS_API_KEY", "")
        if not api_key:
            logging.warning("FAST2SMS_API_KEY not set")
            return False

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://www.fast2sms.com/dev/bulkV2",
                headers={"authorization": api_key, "Content-Type": "application/json"},
                json={
                    "route": "otp",
                    "variables_values": code,
                    "numbers": clean_phone,
                    "flash": 0,
                },
                timeout=10.0,
            )
            result = response.json()
            if result.get("return") == True:
                logging.info(f"✅ SMS SENT to {clean_phone}")
                return True
            else:
                logging.error(f"❌ SMS FAILED: {result}")
                return False
    except Exception as e:
        logging.error(f"❌ SMS ERROR: {str(e)}")
        return False


# ============ AUTH ROUTES ============


@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if fully verified user exists
    existing_user = await db.users.find_one(
        {"email": user_data.email, "is_verified": True}
    )
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Delete any previous unverified registration
    await db.users.delete_one({"email": user_data.email, "is_verified": False})

    # Create user
    user_id = f"user_{datetime.now(timezone.utc).timestamp()}"
    hashed_pwd = hash_password(user_data.password)
    verification_code = str(random.randint(100000, 999999))

    user_doc = {
        "id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "password": hashed_pwd,
        "phone": user_data.phone,
        "role": "user",
        "verification_code": verification_code,
        "is_verified": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.users.insert_one(user_doc)

    # ✅ Try SMS first, fallback to email
    sms_sent = False
    if user_data.phone:
        sms_sent = await send_verification_sms(
            user_data.phone, verification_code, user_data.name
        )

    if not sms_sent:
        # ✅ Fallback to email if SMS fails
        logging.info("SMS failed or no phone — sending email OTP")
        send_verification_email(user_data.email, user_data.name, verification_code)

    return {
        "message": "Verification code sent",
        "email": user_data.email,
        "sms_sent": sms_sent,  # ✅ tell frontend which method was used
    }


@api_router.post("/auth/verify")
async def verify(data: VerifyRequest):
    user = await db.users.find_one({"email": data.email})
    if not user or user.get("verification_code") != data.verification_code:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    await db.users.update_one(
        {"email": data.email},
        {"$set": {"is_verified": True}, "$unset": {"verification_code": ""}},
    )

    # ✅ Return token after verification so frontend can login automatically
    access_token = create_access_token(
        {"sub": user["id"], "role": user.get("role", "user")}
    )

    return {
        "message": "Email verified successfully",
        "access_token": access_token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "phone": user.get("phone"),
            "role": user.get("role", "user"),
        },
    }


@api_router.post("/auth/resend-code")
async def resend_code(email: str):
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    verification_code = str(random.randint(100000, 999999))
    await db.users.update_one(
        {"email": email}, {"$set": {"verification_code": verification_code}}
    )

    # ✅ Try SMS first, fallback to email
    sms_sent = False
    if user.get("phone"):
        sms_sent = await send_verification_sms(
            user["phone"], verification_code, user.get("name", "User")
        )

    if not sms_sent:
        send_verification_email(email, user.get("name", "User"), verification_code)

    return {"message": "Verification code resent", "sms_sent": sms_sent}


@api_router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, data: UserLogin):  # ✅ use model

    user = await db.users.find_one({"email": data.email.lower()})  # ✅ FIX

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # ✅ Skip verification for admin
    if not user.get("is_verified") and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Please verify your email first")

    # ✅ INCLUDE ROLE IN TOKEN (VERY IMPORTANT)
    access_token = create_access_token(
        {"sub": user["id"], "role": user.get("role", "user")}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "phone": user.get("phone"),
            "role": user.get("role", "user"),  # ✅ send role to frontend
        },
    }


@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)


@api_router.post("/auth/forgot-password")
async def forgot_password(email: str):
    user = await db.users.find_one({"email": email})

    if not user:
        return {"message": "If the email exists, a reset link has been sent"}

    token, hashed = generate_reset_token()
    await db.users.update_one(
        {"email": email},
        {
            "$set": {
                "reset_token": hashed,
                "reset_expiry": datetime.now(timezone.utc) + timedelta(hours=1),
            }
        },
    )

    reset_url = f"https://khajurkart.com/reset-password?token={token}"

    # ✅ SEND EMAIL
    try:
        resend.Emails.send(
            {
                "from": "KhajurKart <no-reply@khajurkart.com>",
                "to": [email],
                "subject": "🔐 Reset Your Password - KhajurKart",
                "html": f"""
                <div style="font-family: Arial; padding: 20px; max-width: 600px;">
                  <div style="background:#064E3B; padding:20px; text-align:center;">
                    <h1 style="color:#C6A962; margin:0;">KhajurKart</h1>
                  </div>
                  <div style="padding:30px;">
                    <h2 style="color:#064E3B;">Reset Your Password 🔐</h2>
                    <p>Hi {user.get('name', 'there')} 👋</p>
                    <p>We received a request to reset your password.</p>
                    <p>Click the button below to set a new password:</p>
                    <div style="text-align:center; margin:30px 0;">
                      <a href="{reset_url}" 
                         style="background:#064E3B; color:#C6A962; padding:14px 30px; 
                                text-decoration:none; border-radius:4px; 
                                font-weight:bold; font-size:14px;">
                        Reset Password
                      </a>
                    </div>
                    <p style="color:#666; font-size:13px;">⏳ This link expires in <strong>1 hour</strong>.</p>
                    <p style="color:#666; font-size:13px;">🔒 If you didn't request this, ignore this email.</p>
                    <hr style="margin:20px 0;"/>
                    <p><strong>KhajurKart Team</strong></p>

                    <!-- NOT SPAM -->
                    <div style="background:#fff3cd; padding:15px; border-radius:4px; margin:20px 0;">
                      <p style="margin:0; color:#856404; font-size:13px;">
                        📬 If this email is in spam, please mark it as 
                        <strong>"Not Spam"</strong> to receive future emails properly.
                      </p>
                    </div>

                    <!-- ADDRESS FOOTER -->
                    <div style="text-align:center; padding:15px 0; color:#999; font-size:11px;">
                      <p style="margin:0;">KhajurKart | 10-3-313/a, AR Raheem Residency, Hyderabad 500057</p>
                      <p style="margin:5px 0 0;">You received this because you requested a password reset at khajurkart.com</p>
                    </div>
                  </div>
                </div>
                """,
            }
        )
        print("✅ RESET EMAIL SENT")
    except Exception as e:
        print("❌ RESET EMAIL ERROR:", str(e))

    return {"message": "Reset link sent"}


@api_router.post("/auth/reset-password")
async def reset_password(reset_token: str, new_password: str):
    hashed = hashlib.sha256(reset_token.encode()).hexdigest()
    user = await db.users.find_one(
        {"reset_token": hashed, "reset_expiry": {"$gt": datetime.now(timezone.utc)}}
    )
    if not user:
        raise HTTPException(400, "Invalid or expired token")
    hashed_pwd = hash_password(new_password)
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {"password": hashed_pwd},
            "$unset": {"reset_token": "", "reset_expiry": ""},
        },
    )
    return {"message": "Password reset successful"}


# ============ EMAIL RECEIVER (Admin Notification) ============


async def send_email(name, email, phone, message):
    try:
        html = f"""
        <!DOCTYPE html>
        <html>
        <body style="margin:0; padding:0; background:#f5f5f5; font-family:Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding:40px 0;">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">

                  <!-- HEADER -->
                  <tr>
                    <td style="background:#064E3B; padding:30px; text-align:center;">
                      <h1 style="color:#C6A962; margin:0; font-size:28px;">KhajurKart</h1>
                      <p style="color:#ffffff; margin:5px 0 0; font-size:13px;">New Contact Message</p>
                    </td>
                  </tr>

                  <!-- BODY -->
                  <tr>
                    <td style="padding:40px 30px;">
                      <h2 style="color:#064E3B; margin:0 0 20px;">📩 New Contact Message</h2>
                      
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding:10px 0; border-bottom:1px solid #f0f0f0;">
                            <p style="margin:0; color:#555; font-size:13px;">Name</p>
                            <p style="margin:4px 0 0; color:#064E3B; font-size:15px; font-weight:bold;">{name}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0; border-bottom:1px solid #f0f0f0;">
                            <p style="margin:0; color:#555; font-size:13px;">Email</p>
                            <p style="margin:4px 0 0; color:#064E3B; font-size:15px; font-weight:bold;">{email}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0; border-bottom:1px solid #f0f0f0;">
                            <p style="margin:0; color:#555; font-size:13px;">Phone</p>
                            <p style="margin:4px 0 0; color:#064E3B; font-size:15px; font-weight:bold;">{phone}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0;">
                            <p style="margin:0; color:#555; font-size:13px;">Message</p>
                            <p style="margin:4px 0 0; color:#333; font-size:14px; line-height:1.6;">{message}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- FOOTER -->
                  <tr>
                    <td style="background:#064E3B; padding:20px; text-align:center;">
                      <p style="color:#C6A962; margin:0; font-size:13px;">© 2026 KhajurKart. All rights reserved.</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """
        resend.Emails.send(
            {
                "from": "KhajurKart <contact@khajurkart.com>",
                "to": ["khajurkart@gmail.com"],
                "subject": f"📩 New Contact Message - {name}",
                "html": html,
                "reply_to": email,
            }
        )
        logging.info("✅ ADMIN EMAIL SENT")
    except Exception as e:
        logging.error("❌ ADMIN EMAIL ERROR", exc_info=True)


# ============ SENDER EMAIL (Auto Reply to User) ============


async def send_auto_reply(name, email):
    try:
        html = f"""
        <!DOCTYPE html>
        <html>
        <body style="margin:0; padding:0; background:#f5f5f5; font-family:Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding:40px 0;">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">

                  <!-- HEADER -->
                  <tr>
                    <td style="background:#064E3B; padding:30px; text-align:center;">
                      <h1 style="color:#C6A962; margin:0; font-size:28px;">KhajurKart</h1>
                      <p style="color:#ffffff; margin:5px 0 0; font-size:13px;">Premium Dates, Dry Fruits & Spices</p>
                    </td>
                  </tr>

                  <!-- BODY -->
                  <tr>
                    <td style="padding:40px 30px; text-align:center;">
                      <div style="background:#f0fdf4; border-radius:50%; width:80px; height:80px; margin:0 auto 20px; display:flex; align-items:center; justify-content:center;">
                        <span style="font-size:40px;">🙏</span>
                      </div>
                      <h2 style="color:#064E3B; margin:0 0 15px;">Thank You for Contacting Us!</h2>
                      <p style="color:#333; font-size:15px;">Hi <strong>{name}</strong>,</p>
                      <p style="color:#555; font-size:14px; line-height:1.6;">
                        We have received your message successfully.<br/>
                        Our team will get back to you within <strong>24 hours</strong>.
                      </p>
                      <div style="background:#f9f9f9; border-left:4px solid #C6A962; padding:15px; margin:25px 0; text-align:left;">
                        <p style="margin:0; color:#555; font-size:13px;">📞 Need urgent help? Call us at</p>
                        <p style="margin:5px 0 0; color:#064E3B; font-size:16px; font-weight:bold;">+91 7981002137</p>
                      </div>

                      <!-- NOT SPAM -->
                      <div style="background:#fff3cd; padding:15px; border-radius:4px; margin:20px 0; text-align:left;">
                        <p style="margin:0; color:#856404; font-size:13px;">
                          📬 If this email is in spam, please mark it as 
                          <strong>"Not Spam"</strong> to receive future emails properly.
                        </p>
                      </div>

                      <!-- ADDRESS FOOTER -->
                      <div style="text-align:center; padding:15px 0; color:#999; font-size:11px;">
                        <p style="margin:0;">KhajurKart | 10-3-313/a, AR Raheem Residency, Hyderabad 500057</p>
                        <p style="margin:5px 0 0;">You received this because you contacted us at khajurkart.com</p>
                      </div>
                    </td>
                  </tr>

                  <!-- FOOTER -->
                  <tr>
                    <td style="background:#064E3B; padding:20px; text-align:center;">
                      <p style="color:#C6A962; margin:0; font-size:13px;">© 2026 KhajurKart. All rights reserved.</p>
                      <p style="color:#ffffff; margin:5px 0 0; font-size:12px;">Hyderabad, Telangana 500057</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """
        resend.Emails.send(
            {
                "from": "KhajurKart <contact@khajurkart.com>",
                "to": [email],
                "subject": "✅ We received your message - KhajurKart",
                "html": html,
            }
        )
        logging.info("✅ AUTO REPLY SENT")
    except Exception as e:
        logging.error("❌ AUTO REPLY ERROR", exc_info=True)


# ============ ORDER CONFIRMATION EMAIL ============


async def send_order_email(user_email, user_name, order_id, items, total):
    try:
        # Build items rows
        items_rows = ""
        for item in items:
            size = item.get("size", "")
            size_text = f" ({size})" if size else ""
            discount = item.get("discount", 0)
            original_price = item.get("original_price", item["price"])
            final_price = item["price"] * item["quantity"]

            items_rows += f"""
            <tr>
              <td style="padding:12px; border-bottom:1px solid #f0f0f0; color:#333; font-size:14px;">
                {item['product_name']}{size_text}
              </td>
              <td style="padding:12px; border-bottom:1px solid #f0f0f0; color:#555; font-size:14px; text-align:center;">
                {item['quantity']}
              </td>
              <td style="padding:12px; border-bottom:1px solid #f0f0f0; color:#555; font-size:14px; text-align:center;">
                <span style="text-decoration:line-through; color:#999;">₹{original_price}</span>
                <span style="color:#064E3B; font-weight:bold; margin-left:5px;">₹{item['price']}</span>
              </td>
              <td style="padding:12px; border-bottom:1px solid #f0f0f0; text-align:center;">
                <span style="background:#dcfce7; color:#16a34a; padding:2px 8px; border-radius:12px; font-size:12px;">{discount}% OFF</span>
              </td>
              <td style="padding:12px; border-bottom:1px solid #f0f0f0; color:#064E3B; font-size:14px; font-weight:bold; text-align:right;">
                ₹{final_price}
              </td>
            </tr>
            """

        html = f"""
        <!DOCTYPE html>
        <html>
        <body style="margin:0; padding:0; background:#f5f5f5; font-family:Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding:40px 0;">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">

                  <!-- HEADER -->
                  <tr>
                    <td style="background:#064E3B; padding:30px; text-align:center;">
                      <h1 style="color:#C6A962; margin:0; font-size:28px;">KhajurKart</h1>
                      <p style="color:#ffffff; margin:5px 0 0; font-size:13px;">Order Confirmation</p>
                    </td>
                  </tr>

                  <!-- SUCCESS BANNER -->
                  <tr>
                    <td style="background:#f0fdf4; padding:25px; text-align:center; border-bottom:2px solid #064E3B;">
                      <p style="font-size:40px; margin:0;">🎉</p>
                      <h2 style="color:#064E3B; margin:10px 0 5px;">Order Placed Successfully!</h2>
                      <p style="color:#555; margin:0; font-size:14px;">Thank you for shopping with KhajurKart</p>
                    </td>
                  </tr>

                  <!-- ORDER INFO -->
                  <tr>
                    <td style="padding:25px 30px;">
                      <p style="color:#333; font-size:15px;">Hi <strong>{user_name}</strong> 👋</p>
                      <p style="color:#555; font-size:14px;">Your order has been placed successfully and is being processed.</p>
                      
                      <div style="background:#f9f9f9; border-radius:8px; padding:15px; margin:15px 0;">
                        <p style="margin:0; color:#555; font-size:13px;">Order ID</p>
                        <p style="margin:5px 0 0; color:#064E3B; font-size:18px; font-weight:bold; letter-spacing:1px;">{order_id}</p>
                      </div>

                      <!-- ITEMS TABLE -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px; border:1px solid #f0f0f0; border-radius:8px; overflow:hidden;">
                        <tr style="background:#064E3B;">
                          <th style="padding:12px; color:#C6A962; font-size:13px; text-align:left;">Item</th>
                          <th style="padding:12px; color:#C6A962; font-size:13px; text-align:center;">Qty</th>
                          <th style="padding:12px; color:#C6A962; font-size:13px; text-align:center;">Price</th>
                          <th style="padding:12px; color:#C6A962; font-size:13px; text-align:center;">Discount</th>
                          <th style="padding:12px; color:#C6A962; font-size:13px; text-align:right;">Total</th>
                        </tr>
                        {items_rows}
                      </table>

                      <!-- TOTAL -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:15px;">
                        <tr>
                          <td style="padding:8px 0; color:#555; font-size:14px;">Delivery Charge</td>
                          <td style="padding:8px 0; color:#16a34a; font-size:14px; font-weight:bold; text-align:right;">FREE</td>
                        </tr>
                        <tr style="border-top:2px solid #064E3B;">
                          <td style="padding:12px 0; color:#064E3B; font-size:16px; font-weight:bold;">Grand Total</td>
                          <td style="padding:12px 0; color:#C6A962; font-size:22px; font-weight:bold; text-align:right;">₹{total}</td>
                        </tr>
                      </table>

                      <p style="color:#555; font-size:14px; margin-top:20px;">🚚 We will deliver your order soon!</p>

                      <!-- NOT SPAM -->
                      <div style="background:#fff3cd; padding:15px; border-radius:4px; margin:20px 0;">
                        <p style="margin:0; color:#856404; font-size:13px;">
                          📬 If this email is in spam, please mark it as 
                          <strong>"Not Spam"</strong> to receive future emails properly.
                        </p>
                      </div>

                      <!-- ADDRESS FOOTER -->
                      <div style="text-align:center; padding:15px 0; color:#999; font-size:11px;">
                        <p style="margin:0;">KhajurKart | 10-3-313/a, AR Raheem Residency, Hyderabad 500057</p>
                        <p style="margin:5px 0 0;">You received this because you placed an order at khajurkart.com</p>
                      </div>
                    </td>
                  </tr>

                  <!-- FOOTER -->
                  <tr>
                    <td style="background:#064E3B; padding:20px; text-align:center;">
                      <p style="color:#C6A962; margin:0; font-size:13px;">© 2026 KhajurKart. All rights reserved.</p>
                      <p style="color:#ffffff; margin:5px 0 0; font-size:12px;">📞 7981002137 | khajurkart@gmail.com</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """
        resend.Emails.send(
            {
                "from": "KhajurKart <contact@khajurkart.com>",
                "to": [user_email],
                "subject": f"🛒 Order Confirmed - {order_id} | KhajurKart",
                "html": html,
            }
        )
        logging.info("✅ ORDER EMAIL SENT")
    except Exception as e:
        logging.error("❌ ORDER EMAIL ERROR", exc_info=True)


# ============ ADMIN ORDER NOTIFICATION ============


async def send_admin_order_notification(
    order_id,
    customer_name,
    customer_email,
    shipping_address,
    items,
    total,
    payment_method,
):
    try:
        items_rows = ""
        for item in items:
            size = item.get("size", "")
            size_text = f" ({size})" if size else ""
            items_rows += f"""
            <tr>
              <td style="padding:10px; border-bottom:1px solid #f0f0f0; font-size:14px;">
                {item['product_name']}{size_text}
              </td>
              <td style="padding:10px; border-bottom:1px solid #f0f0f0; font-size:14px; text-align:center;">
                {item['quantity']}
              </td>
              <td style="padding:10px; border-bottom:1px solid #f0f0f0; font-size:14px; text-align:right; font-weight:bold; color:#064E3B;">
                Rs.{item['price'] * item['quantity']}
              </td>
            </tr>
            """

        html = f"""
        <!DOCTYPE html>
        <html>
        <body style="margin:0; padding:0; background:#f5f5f5; font-family:Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding:40px 0;">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">

                  <!-- HEADER -->
                  <tr>
                    <td style="background:#064E3B; padding:30px; text-align:center;">
                      <h1 style="color:#C6A962; margin:0; font-size:28px;">KhajurKart</h1>
                      <p style="color:#ffffff; margin:5px 0 0; font-size:13px;">New Order Received!</p>
                    </td>
                  </tr>

                  <!-- BODY -->
                  <tr>
                    <td style="padding:30px;">
                      <h2 style="color:#064E3B; margin:0 0 20px;">New Order Alert</h2>

                      <!-- ORDER ID -->
                      <div style="background:#f0fdf4; border-left:4px solid #064E3B; padding:15px; margin:15px 0;">
                        <p style="margin:0; color:#555; font-size:13px;">Order ID</p>
                        <p style="margin:5px 0 0; color:#064E3B; font-size:18px; font-weight:bold;">{order_id}</p>
                      </div>

                      <!-- CUSTOMER INFO -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                        <tr>
                          <td style="padding:10px 0; border-bottom:1px solid #f0f0f0;">
                            <p style="margin:0; color:#555; font-size:12px;">Customer Name</p>
                            <p style="margin:4px 0 0; color:#333; font-size:15px; font-weight:bold;">{customer_name}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0; border-bottom:1px solid #f0f0f0;">
                            <p style="margin:0; color:#555; font-size:12px;">Customer Email</p>
                            <p style="margin:4px 0 0; color:#333; font-size:15px;">{customer_email}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0; border-bottom:1px solid #f0f0f0;">
                            <p style="margin:0; color:#555; font-size:12px;">Payment Method</p>
                            <p style="margin:4px 0 0; color:#333; font-size:15px; font-weight:bold; text-transform:uppercase;">{payment_method}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0; border-bottom:1px solid #f0f0f0;">
                            <p style="margin:0; color:#555; font-size:12px;">Delivery Address</p>
                            <p style="margin:4px 0 0; color:#333; font-size:14px;">
                              {shipping_address.get('address', '')},
                              {shipping_address.get('city', '')},
                              {shipping_address.get('state', '')} -
                              {shipping_address.get('pincode', '')}
                            </p>
                            <p style="margin:4px 0 0; color:#333; font-size:14px;">
                              Phone: {shipping_address.get('phone', '')}
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- ITEMS TABLE -->
                      <h3 style="color:#064E3B; margin:20px 0 10px;">Order Items:</h3>
                      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0; border-radius:8px; overflow:hidden;">
                        <tr style="background:#064E3B;">
                          <th style="padding:10px; color:#C6A962; font-size:13px; text-align:left;">Item</th>
                          <th style="padding:10px; color:#C6A962; font-size:13px; text-align:center;">Qty</th>
                          <th style="padding:10px; color:#C6A962; font-size:13px; text-align:right;">Amount</th>
                        </tr>
                        {items_rows}
                      </table>

                      <!-- TOTAL -->
                      <div style="background:#f9f9f9; padding:15px; margin:20px 0; text-align:right;">
                        <p style="margin:0; color:#555; font-size:14px;">Delivery: <span style="color:#16a34a; font-weight:bold;">FREE</span></p>
                        <p style="margin:10px 0 0; color:#064E3B; font-size:20px; font-weight:bold;">
                          Grand Total: Rs.{total}
                        </p>
                      </div>

                      <!-- ACTION BUTTON -->
                      <div style="text-align:center; margin:25px 0;">
                        <a href="https://www.khajurkart.com/admin/orders"
                           style="background:#064E3B; color:#C6A962; padding:14px 30px;
                                  text-decoration:none; border-radius:4px;
                                  font-weight:bold; font-size:14px;">
                          View Order in Admin Panel
                        </a>
                      </div>

                    </td>
                  </tr>

                  <!-- FOOTER -->
                  <tr>
                    <td style="background:#064E3B; padding:20px; text-align:center;">
                      <p style="color:#C6A962; margin:0; font-size:13px;">KhajurKart Admin Notification</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """

        resend.Emails.send(
            {
                "from": "KhajurKart <contact@khajurkart.com>",
                "to": ["khajurkart@gmail.com"],
                "subject": f"New Order Received - {order_id} | Rs.{total}",
                "html": html,
                "headers": {"X-Priority": "1", "Importance": "high"},
            }
        )
        logging.info("✅ ADMIN ORDER EMAIL SENT")
    except Exception as e:
        logging.error("❌ ADMIN ORDER EMAIL ERROR", exc_info=True)


# ============ CONTACT ROUTES ============


@api_router.post("/contact")
async def contact_form(data: ContactForm):
    name = data.name
    email = data.email
    phone = data.phone
    message = data.message
    # ✅ Save to DB
    await db.contacts.insert_one(
        {
            "name": name,
            "email": email,
            "phone": phone,
            "message": message,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    # ✅ Send admin email
    await send_email(name, email, phone, message)
    # ✅ Send auto reply to user
    await send_auto_reply(name, email)
    return {"message": "Message received successfully"}


# =========== MULTI-ADDRESS SUPPORT ROUTES ============


@api_router.post("/user/address")
async def add_address(address: dict, current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": current_user["id"]}, {"$push": {"addresses": address}}
    )
    return {"message": "Address added"}


@api_router.get("/user/address")
async def get_addresses(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one(
        {"id": current_user["id"]}, {"_id": 0, "addresses": 1}
    )
    return user.get("addresses", [])


@api_router.delete("/user/address/{index}")
async def delete_address(index: int, current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": current_user["id"]}, {"$unset": {f"addresses.{index}": 1}}
    )
    await db.users.update_one(
        {"id": current_user["id"]}, {"$pull": {"addresses": None}}
    )
    return {"message": "Address removed"}


@api_router.put("/user/address/default/{index}")
async def set_default_address(
    index: int, current_user: dict = Depends(get_current_user)
):
    user = await db.users.find_one({"id": current_user["id"]})

    addresses = user.get("addresses", [])

    if index < 0 or index >= len(addresses):
        raise HTTPException(400, "Invalid index")

    # remove default from all
    for addr in addresses:
        addr["isDefault"] = False

    # set selected as default
    addresses[index]["isDefault"] = True

    await db.users.update_one(
        {"id": current_user["id"]}, {"$set": {"addresses": addresses}}
    )

    return {"message": "Default address updated"}


# ==================== INVOICE PDF DOWNLOAD ========================


def generate_invoice(order):
    file_path = f"/tmp/invoice_{order['id']}.pdf"
    c = canvas.Canvas(file_path, pagesize=letter)
    width, height = letter
    # 🎨 DARK GREEN THEME
    header_color = colors.HexColor("#064E3B")  # dark green
    light_line = colors.HexColor("#A7F3D0")  # light green

    # ================= HEADER =================

    c.setFillColor(header_color)
    c.rect(0, height - 160, width, 160, fill=1)

    # 📄 INVOICE (moved below logo properly)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(40, height - 130, "INVOICE")

    # 🏢 COMPANY DETAILS (RIGHT)

    c.setFont("Helvetica-Bold", 16)
    c.drawRightString(width - 40, height - 50, "KhajurKart")
    c.setFont("Helvetica", 10)
    c.drawRightString(width - 40, height - 70, "Number: 7981002137")
    c.drawRightString(width - 40, height - 85, "Email: khajurkart@gmail.com")

    # ✅ FULL ADDRESS (multi-line)

    c.setFont("Helvetica", 9)
    c.drawRightString(width - 40, height - 100, "10-3-313/a, AR Raheem Residency")
    c.drawRightString(width - 40, height - 112, "Beside Govt IASE College")
    c.drawRightString(width - 40, height - 124, "Potti Sriramulu Nagar")
    c.drawRightString(width - 40, height - 136, "Vijaya Nagar Colony")
    c.drawRightString(width - 40, height - 148, "Hyderabad, Telangana 500057")

    # ================= LINE =================

    c.setStrokeColor(light_line)
    c.line(40, height - 170, width - 40, height - 170)

    # ================= BILL TO =================

    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(40, height - 190, "Bill To:")
    c.setFont("Helvetica", 10)
    c.drawString(40, height - 205, order["customer_name"])
    c.drawString(40, height - 220, order["customer_email"])

    # ================= ORDER INFO =================

    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(width - 40, height - 190, f"Order ID: {order['id']}")
    c.drawRightString(width - 40, height - 205, f"Date: {order['created_at'][:10]}")

    # ================= LINE =================

    c.line(40, height - 255, width - 40, height - 255)

    # ================= TABLE =================

    y = height - 275
    c.setFillColor(header_color)
    c.rect(40, y, width - 80, 25, fill=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(45, y + 8, "S.No")
    c.drawString(80, y + 8, "Item Name")
    c.drawString(260, y + 8, "Qty")
    c.drawString(310, y + 8, "Price")
    c.drawString(380, y + 8, "Disc %")
    c.drawString(440, y + 8, "Final Amount")

    # ================= ITEMS =================

    y -= 30
    c.setFillColor(colors.black)
    c.setFont("Helvetica", 10)

    total_delivery = order.get("delivery_charges", 0)
    items = order["items"]

    for i, item in enumerate(items, start=1):
        discount = item.get("discount", 0)
        original = item.get("original_price", item["price"])
        quantity = item["quantity"]
        size = item.get("size", "")

        # ✅ FINAL PRICE
        final_price = item["price"] * quantity

        c.drawString(45, y, str(i))
        c.drawString(80, y, f"{item['product_name']} ({size})")
        c.drawString(265, y, str(quantity))
        c.drawString(305, y, f"Rs.{original}")
        c.drawString(390, y, f"{discount}%")
        c.drawString(450, y, f"Rs.{final_price}")  # ✅ FIXED

        y -= 20

        # ✅ DRAW LINE ONLY IF NOT LAST ITEM
        if i < len(items):
            c.setStrokeColor(colors.black)
            c.setDash(3, 2)
            c.line(40, y, width - 40, y)
            c.setDash()

            y -= 20

    # ================= TOTAL =================

    c.line(40, y, width - 40, y)
    c.setFont("Helvetica-Bold", 12)
    f"Items Total: Rs.{order['total_amount']}"
    c.drawRightString(width - 40, y - 20, f"Items Total: Rs.{order['total_amount']}")
    c.drawRightString(width - 40, y - 40, "Delivery: FREE")
    c.drawRightString(width - 40, y - 60, f"Grand Total: Rs.{order['total_amount']}")
    c.save()
    return file_path


# ============ CATEGORY ROUTES ============


@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories


@api_router.post("/admin/categories")
async def create_category(category: Category, admin: dict = Depends(get_admin_user)):
    await db.categories.insert_one(category.dict())
    return category


# ============ PRODUCT ROUTES ============


def serialize(product):
    product["_id"] = str(product["_id"])
    return product


@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None, featured: Optional[bool] = None):
    try:
        query = {}
        if category:
            query["category"] = category
        if featured is not None:
            query["featured"] = featured

        products = await db.products.find(query, {"_id": 0}).to_list(1000)
        for p in products:
            sizes = p.get("sizes") or []

            if len(sizes) > 0:
                selected_size = sizes[0]

                price = selected_size.get("price", 0)
                original_price = selected_size.get("original_price")
                if not original_price:
                    original_price = p.get("original_price", price)

                p["price"] = price
                p["original_price"] = original_price

                if original_price > price:
                    p["discount"] = round(
                        ((original_price - price) / original_price) * 100
                    )
                else:
                    p["discount"] = 0
            else:
                # 👇 fallback if no sizes
                price = p.get("price", 0)
                original_price = p.get("original_price") or price

                p["price"] = price

                if original_price > price:
                    p["discount"] = round(
                        ((original_price - price) / original_price) * 100
                    )
                else:
                    p["discount"] = 0

        return products

    except Exception as e:
        print("❌ PRODUCT ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@api_router.get("/search")
async def search_products(q: str):
    if not q:
        return []

    # Case-insensitive search in product name and description
    products = await db.products.find(
        {
            "$or": [
                {"name": {"$regex": q, "$options": "i"}},
                {"description": {"$regex": q, "$options": "i"}},
            ]
        },
        {"_id": 0},
    ).to_list(50)

    return products


@api_router.post("/products")
async def create_product(product: Product):
    data = product.dict()
    await db.products.insert_one(data)
    return data


# ============ REVIEW ROUTES ============


@api_router.get("/reviews/{product_id}")
async def get_reviews(product_id: str):
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).to_list(100)
    return reviews


@api_router.post("/reviews")
async def add_review(review: Review):
    await db.reviews.insert_one(review.dict())
    return {"message": "Review added"}


# ============ CART ROUTES ============


@api_router.get("/cart")
async def get_cart(current_user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user["id"]}, {"_id": 0})

    if not cart:
        return {"user_id": current_user["id"], "items": []}

    # Populate product details
    for item in cart["items"]:
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            sizes = product.get("sizes") or []

            if sizes:
                selected_size = item.get("size")

                size_data = next(
                    (s for s in sizes if s.get("weight") == selected_size),
                    sizes[0],  # fallback
                )

                product["price"] = size_data.get("price", 0)
                product["original_price"] = size_data.get(
                    "original_price", product["price"]
                )
            else:
                product["price"] = product.get("price", 0)
            item["product"] = product

    return cart


@api_router.post("/cart/add")
async def add_to_cart(
    cart_item: CartItem, current_user: dict = Depends(get_current_user)
):
    # Check if product exists
    product = await db.products.find_one({"id": cart_item.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Get or create cart
    cart = await db.carts.find_one({"user_id": current_user["id"]})
    if not cart:
        cart = {"user_id": current_user["id"], "items": []}

    # Check if item already in cart
    item_exists = False
    for item in cart["items"]:
        if (
            item["product_id"] == cart_item.product_id
            and item["size"] == cart_item.size  # ✅ FIXED
        ):
            item["quantity"] += cart_item.quantity
            item_exists = True
            break

    if not item_exists:
        cart["items"].append(
            {
                "product_id": cart_item.product_id,
                "quantity": cart_item.quantity,
                "size": cart_item.size,  # ✅ FIXED
            }
        )

    # Update cart
    await db.carts.update_one(
        {"user_id": current_user["id"]}, {"$set": cart}, upsert=True
    )

    return {"message": "Item added to cart"}


@api_router.post("/cart/update")
async def update_cart_item(
    cart_item: CartItem, current_user: dict = Depends(get_current_user)
):
    cart = await db.carts.find_one({"user_id": current_user["id"]})

    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    # Update quantity
    for item in cart["items"]:
        if item["product_id"] == cart_item.product_id:
            item["quantity"] = cart_item.quantity
            item["size"] = cart_item.size
            break

    await db.carts.update_one(
        {"user_id": current_user["id"]}, {"$set": {"items": cart["items"]}}
    )

    return {"message": "Cart updated"}


@api_router.delete("/cart/remove/{product_id}")
async def remove_from_cart(
    product_id: str, current_user: dict = Depends(get_current_user)
):
    cart = await db.carts.find_one({"user_id": current_user["id"]})

    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    # Remove item
    cart["items"] = [item for item in cart["items"] if item["product_id"] != product_id]

    await db.carts.update_one(
        {"user_id": current_user["id"]}, {"$set": {"items": cart["items"]}}
    )

    return {"message": "Item removed from cart"}


@api_router.delete("/cart/clear")
async def clear_cart(current_user: dict = Depends(get_current_user)):
    await db.carts.update_one({"user_id": current_user["id"]}, {"$set": {"items": []}})
    return {"message": "Cart cleared"}


# ============ ORDER ROUTES ============


@api_router.post("/orders")
async def create_order(
    order_data: CreateOrder, current_user: dict = Depends(get_current_user)
):
    order_id = f"KK-{uuid.uuid4().hex[:10].upper()}"
    # 🔥 STOCK CHECK + DEDUCT
    for item in order_data.items:
        result = await db.products.update_one(
            {"id": item.product_id, "stock": {"$gte": item.quantity}},
            {"$inc": {"stock": -item.quantity}},
        )
        if result.modified_count == 0:
            raise HTTPException(400, f"Product {item.product_id} out of stock")

    # Delivery charges disabled (free delivery)
    delivery_charges = 0
    items_with_discount = []
    for item in order_data.items:
        product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if not product:
            continue
        selected_size = item.size or product.get("sizes", [])[0]["weight"]
        size_data = next(
            (s for s in product.get("sizes", []) if s["weight"] == selected_size), None
        )
        if not size_data:
            raise HTTPException(400, "Invalid size selected")
        # ✅ find selected size
        selected_size = item.size or product.get("sizes", [])[0]["weight"]

        size_data = next(
            (s for s in product.get("sizes", []) if s["weight"] == selected_size), None
        )

        if not size_data:
            raise HTTPException(400, "Invalid size selected")

        price = size_data["price"]
        original_price = size_data.get("original_price", price)
        # ✅ CALCULATE DISCOUNT %
        if original_price > price:
            discount = round(((original_price - price) / original_price) * 100)
        else:
            discount = 0
        items_with_discount.append(
            {
                "product_id": item.product_id,  # ✅ ADD THIS
                "product_name": product.get("name"),
                "quantity": item.quantity,
                "size": item.size,
                "original_price": original_price,
                "price": price,  # discounted price
                "discount": discount,
                "delivery_charge": 0,  # Free delivery
            }
        )

    order_doc = {
        "id": order_id,
        "user_id": current_user["id"],
        "customer_name": current_user.get("name", ""),
        "customer_email": current_user.get("email", ""),
        "items": items_with_discount,
        "total_amount": order_data.total_amount,
        "delivery_charges": delivery_charges,
        "payment_method": order_data.payment_method,
        "payment_status": (
            "pending" if order_data.payment_method == "razorpay" else "cod"
        ),
        "shipping_address": order_data.shipping_address,
        "status": "pending",
        "tracking_id": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.orders.insert_one(order_doc)

    # ✅ Send confirmation to customer
    await send_order_email(
        current_user["email"],
        current_user["name"],
        order_id,
        items_with_discount,
        order_data.total_amount,
    )

    # ✅ Send notification to admin
    await send_admin_order_notification(
        order_id,
        current_user.get("name", ""),
        current_user.get("email", ""),
        order_data.shipping_address,
        items_with_discount,
        order_data.total_amount,
        order_data.payment_method,
    )

    # Clear cart
    await db.carts.update_one({"user_id": current_user["id"]}, {"$set": {"items": []}})

    return {"order_id": order_id, "message": "Order created successfully"}


@api_router.get("/orders")
async def get_orders(current_user: dict = Depends(get_current_user)):
    try:
        orders = await db.orders.find(
            {"user_id": current_user["id"]}, {"_id": 0}
        ).to_list(100)
        return orders
    except Exception as e:
        print("ERROR:", str(e))  # ✅ DEBUG
        raise HTTPException(500, str(e))


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    try:
        order = await db.orders.find_one(
            {"id": order_id, "user_id": current_user["id"]}, {"_id": 0}
        )
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return order
    except Exception as e:
        print("ERROR:", str(e))
        raise HTTPException(500, str(e))


@api_router.put("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id, "user_id": current_user["id"]})
    if not order:
        raise HTTPException(404, "Order not found")
    if order["status"] not in ["pending", "confirmed"]:
        raise HTTPException(400, "Order cannot be cancelled")
    if order["status"] == "cancelled":
        raise HTTPException(400, "Order already cancelled")  # ✅ FIXED INDENT
    # ✅ Restore stock
    for item in order["items"]:
        await db.products.update_one(
            {"id": item["product_id"]}, {"$inc": {"stock": item["quantity"]}}
        )
    # ✅ Update order
    await db.orders.update_one({"id": order_id}, {"$set": {"status": "cancelled"}})
    return {"message": "Order cancelled"}


@app.delete("/api/orders/{order_id}")
async def delete_order(order_id: str):
    await db.orders.delete_one({"id": order_id})
    return {"message": "Order deleted"}


# ============ INVOICE ROUTES ============


@api_router.get("/invoice/{order_id}")
async def download_invoice(
    order_id: str, current_user: dict = Depends(get_current_user)
):
    order = await db.orders.find_one(
        {"id": order_id, "user_id": current_user["id"]}, {"_id": 0}
    )
    if not order:
        raise HTTPException(404, "Order not found")
    file_path = generate_invoice(order)
    return FileResponse(file_path, filename=f"invoice_{order_id}.pdf")


@app.get("/api/invoice/{order_id}")
async def get_invoice(order_id: str):
    try:
        order = await db.orders.find_one({"id": order_id})
        if not order:
            raise HTTPException(404, "Order not found")
        print("ORDER DATA:", order)  # ✅ DEBUG
        file_path = generate_invoice(order)
        return FileResponse(file_path, media_type="application/pdf")
    except Exception as e:
        print("INVOICE ERROR:", str(e))  # ✅ SEE REAL ERROR
        raise HTTPException(500, str(e))


# ============ RAZORPAY ROUTES ============


@api_router.post("/razorpay/create-order")
async def create_razorpay_order(
    order: RazorpayOrder, current_user: dict = Depends(get_current_user)
):
    try:
        # Amount in paise (smallest currency unit)
        amount_paise = int(order.amount * 100)

        razorpay_order = razorpay_client.order.create(
            {"amount": amount_paise, "currency": order.currency, "payment_capture": 1}
        )

        return {
            "id": razorpay_order["id"],
            "amount": razorpay_order["amount"],
            "currency": razorpay_order["currency"],
            "key_id": os.environ["RAZORPAY_KEY_ID"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/razorpay/verify-payment")
async def verify_razorpay_payment(
    payment_data: RazorpayVerify, current_user: dict = Depends(get_current_user)
):
    try:
        # Verify signature
        params_dict = {
            "razorpay_order_id": payment_data.razorpay_order_id,
            "razorpay_payment_id": payment_data.razorpay_payment_id,
            "razorpay_signature": payment_data.razorpay_signature,
        }

        razorpay_client.utility.verify_payment_signature(params_dict)

        # Update order
        await db.orders.update_one(
            {"id": payment_data.order_id, "user_id": current_user["id"]},
            {
                "$set": {
                    "payment_status": "paid",
                    "razorpay_order_id": payment_data.razorpay_order_id,
                    "razorpay_payment_id": payment_data.razorpay_payment_id,
                    "status": "confirmed",
                }
            },
        )
        order = await db.orders.find_one({"id": payment_data.order_id})
        await send_order_email(
            order["customer_email"],
            order["customer_name"],
            order["id"],
            order["items"],
            order["total_amount"],
        )

        return {"message": "Payment verified successfully"}
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/razorpay/webhook")
async def razorpay_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature")
    try:
        razorpay_client.utility.verify_webhook_signature(
            body, signature, os.environ["RAZORPAY_WEBHOOK_SECRET"]
        )
    except:
        raise HTTPException(400, "Invalid signature")
    data = json.loads(body)
    if data["event"] == "payment.captured":
        order_id = data["payload"]["payment"]["entity"]["order_id"]
        await db.orders.update_one(
            {"razorpay_order_id": order_id}, {"$set": {"payment_status": "paid"}}
        )
    return {"status": "ok"}


# ============ ADMIN ROUTES ============


@api_router.get("/admin/check")
async def check_admin(admin: dict = Depends(get_admin_user)):
    return {"is_admin": True, "email": admin["email"]}


@api_router.post("/admin/products")
async def create_product(
    product_data: ProductCreate, admin: dict = Depends(get_admin_user)
):
    try:
        # ✅ STEP 1: CATEGORY BASED SIZES
        category = product_data.category.lower()

        if category == "saffron":
            product_data.sizes = [
                {"weight": "0.5g", "price": 0, "original_price": 0},
                {"weight": "1g", "price": 0, "original_price": 0},
                {"weight": "2g", "price": 0, "original_price": 0},
                {"weight": "3g", "price": 0, "original_price": 0},
                {"weight": "4g", "price": 0, "original_price": 0},
                {"weight": "5g", "price": 0, "original_price": 0},
            ]
        else:
            product_data.sizes = [
                {"weight": "100g", "price": 0, "original_price": 0},
                {"weight": "250g", "price": 0, "original_price": 0},
                {"weight": "500g", "price": 0, "original_price": 0},
                {"weight": "1kg", "price": 0, "original_price": 0},
            ]

        # ✅ STEP 2: CREATE PRODUCT
        product_id = f"product_{datetime.now(timezone.utc).timestamp()}"
        product_doc = {"id": product_id, **product_data.model_dump()}

        result = await db.products.insert_one(product_doc)

        # ✅ STEP 3: RETURN WITH _id
        product_doc["_id"] = str(result.inserted_id)

        return product_doc

    except Exception as e:
        print("❌ ERROR:", str(e))
        raise HTTPException(500, str(e))


@api_router.put("/admin/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str, product_data: ProductUpdate, admin: dict = Depends(get_admin_user)
):

    update_data = product_data.model_dump(exclude_none=True)

    result = await db.products.update_one({"id": product_id}, {"$set": update_data})

    if result.matched_count == 0:
        raise HTTPException(404, "Product not found")

    updated_product = await db.products.find_one({"id": product_id}, {"_id": 0})
    return Product(**updated_product)


@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}


@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(
    order_id: str, status: str, admin: dict = Depends(get_admin_user)
):
    valid_statuses = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "exchange",
        "return",
        "cancelled",
    ]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}",
        )

    # Generate tracking ID if status is shipped and doesn't have one
    update_data = {"status": status}
    if status == "shipped":
        order = await db.orders.find_one({"id": order_id}, {"_id": 0})
        if order and not order.get("tracking_id"):
            update_data["tracking_id"] = (
                f"KK{datetime.now(timezone.utc).strftime('%Y%m%d')}{order_id[-6:].upper()}"
            )

    result = await db.orders.update_one({"id": order_id}, {"$set": update_data})

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")

    return {"message": "Order status updated successfully"}


@app.delete("/api/admin/orders/{order_id}")
async def delete_order(order_id: str):
    await db.orders.update_one({"id": order_id}, {"$set": {"is_deleted": True}})
    return {"message": "Order deleted"}


@api_router.get("/admin/orders")
async def get_all_orders(admin: dict = Depends(get_admin_user)):
    return await db.orders.find({"is_deleted": {"$ne": True}}, {"_id": 0}).to_list(1000)


@api_router.get("/orders/track/{tracking_id}")
async def track_order(tracking_id: str):
    order = await db.orders.find_one({"tracking_id": tracking_id}, {"_id": 0})
    if not order:
        raise HTTPException(
            status_code=404, detail="Order not found with this tracking ID"
        )
    return order


@api_router.get("/admin/reviews")
async def get_all_reviews(admin: dict = Depends(get_admin_user)):
    reviews = await db.reviews.find({}, {"_id": 0}).to_list(1000)
    return reviews


@api_router.delete("/admin/reviews/{review_id}")
async def delete_review(review_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.reviews.delete_one({"id": review_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Review deleted successfully"}


@api_router.delete("/admin/returns/{return_id}")
async def delete_return(return_id: str, admin: dict = Depends(get_admin_user)):
    await db.returns.update_one({"id": return_id}, {"$set": {"is_deleted": True}})
    return {"message": "Return deleted successfully"}


@api_router.get("/admin/returns")
async def get_all_returns(admin: dict = Depends(get_admin_user)):
    returns = await db.returns.find(
        {"is_deleted": {"$ne": True}}, {"_id": 0}  # hide deleted
    ).to_list(1000)
    return returns


# ============ RETURN/EXCHANGE ROUTES ============


@api_router.post("/returns")
async def create_return_request(
    return_data: CreateReturnRequest, current_user: dict = Depends(get_current_user)
):
    # Verify order exists and belongs to user
    order = await db.orders.find_one(
        {"id": return_data.order_id, "user_id": current_user["id"]}, {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Check if order is delivered (can only return/exchange delivered orders)
    if order["status"] != "delivered":
        raise HTTPException(
            status_code=400, detail="Can only return/exchange delivered orders"
        )

    # Check if return already exists for this order
    existing_return = await db.returns.find_one({"order_id": return_data.order_id})
    if existing_return:
        raise HTTPException(
            status_code=400,
            detail="Return/Exchange request already exists for this order",
        )

    return_id = f"return_{datetime.now(timezone.utc).timestamp()}"

    return_doc = {
        "id": return_id,
        "order_id": return_data.order_id,
        "user_id": current_user["id"],
        "customer_name": current_user.get("name", ""),
        "customer_email": current_user.get("email", ""),
        "items": [item.model_dump() for item in return_data.items],
        "reason": return_data.reason,
        "request_type": return_data.request_type,
        "status": "pending",
        "images": return_data.images or [],
        "admin_notes": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.returns.insert_one(return_doc)
    return {
        "return_id": return_id,
        "message": f"{return_data.request_type.title()} request submitted successfully",
    }


@api_router.get("/returns")
async def get_user_returns(current_user: dict = Depends(get_current_user)):
    returns = (
        await db.returns.find({"user_id": current_user["id"]}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(100)
    )
    return returns


@api_router.get("/returns/{return_id}", response_model=ReturnRequest)
async def get_return_detail(
    return_id: str, current_user: dict = Depends(get_current_user)
):
    return_req = await db.returns.find_one(
        {"id": return_id, "user_id": current_user["id"]}, {"_id": 0}
    )
    if not return_req:
        raise HTTPException(status_code=404, detail="Return request not found")
    return return_req


@api_router.delete("/returns/{return_id}")
async def delete_return(return_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.returns.delete_one({"id": return_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Return request not found")

    return {"message": "Return deleted successfully"}


# ============ ADMIN RETURN ROUTES ============


@api_router.get("/admin/returns")
async def get_all_returns(admin: dict = Depends(get_admin_user)):
    returns = await db.returns.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return returns


@api_router.put("/admin/returns/{return_id}/status")
async def update_return_status(
    return_id: str,
    status: str,
    admin_notes: Optional[str] = None,
    admin: dict = Depends(get_admin_user),
):
    valid_statuses = ["pending", "approved", "rejected", "completed"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}",
        )

    update_data = {"status": status}
    if admin_notes:
        update_data["admin_notes"] = admin_notes

    result = await db.returns.update_one({"id": return_id}, {"$set": update_data})

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Return request not found")

    return {"message": "Return status updated successfully"}


# Include router
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "http://localhost:3000",
        "https://khajurkart1-ho0847ugh-khajurkart.vercel.app",
        "https://khajurkart1.vercel.app",
        "https://khajurkart.com",
        "https://www.khajurkart.com",
        "https://khajurkart1.onrender.com",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
