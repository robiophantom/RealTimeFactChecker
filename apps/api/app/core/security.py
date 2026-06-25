from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from app.core.config import settings

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

def get_current_user(payload: dict = Depends(verify_token)):
    user_id = payload.get("sub")
    role = payload.get("user_role", "user")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found in token",
        )
    return {"id": user_id, "role": role, "email": payload.get("email")}

def get_admin_user(current_user: dict = Depends(get_current_user)):
    # Supabase roles can be custom mapped, assuming 'admin' role in JWT or check DB
    # For now, we will assume a simple check.
    # In a real scenario, you query the database or trust a custom claim in JWT.
    if current_user.get("role") != "admin":
         # Fallback check if it's not in the JWT, in production check DB or set custom claims in Supabase
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return current_user
