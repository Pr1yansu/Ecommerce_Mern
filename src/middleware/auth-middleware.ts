import JWT, { JsonWebTokenError } from "jsonwebtoken";
import { User } from "@prisma/client";
import { NextFunction, Response, Request as ExpressRequest } from "express";

export interface RequestWithUser<
  ResBody = any,
  Locals extends Record<string, any> = Record<string, any>
> extends ExpressRequest {
  user?: User;
}

export class AuthMiddleware {
  #role = "ADMIN";
  async generateToken(user: User) {
    const token = JWT.sign({ user }, process.env.SECRET!, { expiresIn: "30d" });
    return token;
  }
  checkAuth = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    const cookies = req.cookies;
    if (!cookies) {
      return res.status(401).json("Cookie not found");
    }
    const token = req.cookies.auth;
    if (!token) {
      return res.status(401).json("Unauthenticated");
    }
    try {
      const { user } = JWT.verify(token, process.env.SECRET!) as {
        user: User;
      };
      req.user = user;
      next();
    } catch (error) {
      const err = error as JsonWebTokenError;
      if (err.name === "TokenExpiredError") {
        return res.status(401).json("Token expired");
      }
      return res.status(401).json("Unauthenticated");
    }
  };
}
