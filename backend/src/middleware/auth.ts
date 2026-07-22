import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const payload = verifyToken(token);
      req.user = payload;
      return next();
    } catch (error) {
      // Token invalid, fallback to guest
    }
  }

  // Instant Guest Access fallback - No sign in required!
  req.user = {
    userId: "guest-user-id",
    email: "guest@local.user",
  };
  next();
}
