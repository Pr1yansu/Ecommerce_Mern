import { prisma } from "../lib/prisma.js";
import { User } from "@prisma/client/wasm";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import {
  AuthMiddleware,
  RequestWithUser,
} from "../middleware/auth-middleware.js";

export class UserFunctions {
  #role = "ADMIN";
  // create a new user
  createUser = async (
    req: Request<{}, {}, User>,
    res: Response<User | string>
  ) => {
    try {
      const { email, name, password, provider, providerId } = req.body;

      if (!email || !name || !password) {
        return res.status(400).json("Email, name and password are required");
      }
      const authMiddleware = new AuthMiddleware();
      if (provider || providerId) {
        const existingUser = await prisma.user.findUnique({
          where: {
            email,
          },
        });
        if (existingUser) {
          if (
            provider === existingUser.provider &&
            providerId === existingUser.providerId
          ) {
            const token = await authMiddleware.generateToken(existingUser);
            res.cookie("auth", token, {
              httpOnly: true,
              secure: true,
              sameSite: "none",
            });
            return res.status(200).json(`Welcome back ${existingUser.name}!`);
          }
          return res
            .status(400)
            .json(
              "User already exists with this email with different provider"
            );
        }
        const user = await prisma.user.create({
          data: {
            email,
            name,
            provider,
            providerId,
          },
        });
        res.cookie("auth", await authMiddleware.generateToken(user), {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        });
        return res.status(201).json(`Welcome ${user.name}!`);
      }

      const existingUser = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (existingUser?.provider) {
        return res.status(400).json("User already exists with this email");
      }

      if (existingUser) {
        return res.status(400).json("User already exists with this email");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
        },
      });

      res.cookie("auth", await authMiddleware.generateToken(user), {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });

      return res.status(201).json(`Welcome ${user.name}!`);
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal Server Error");
    }
  };
  // get all users
  getAllUsers = async (req: Request, res: Response<User[] | string>) => {
    try {
      const users = await prisma.user.findMany();
      return res.status(200).json(users);
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal Server Error");
    }
  };
  // get user by id
  getUserById = async (req: RequestWithUser, res: Response<User | string>) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(404).json("User not found");
      }
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
      if (!user) {
        return res.status(404).json("User not found");
      }
      return res.status(200).json(user);
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal Server Error");
    }
  };
  // login user
  loginUser = async (
    req: Request<{}, {}, { email: string; password: string }>,
    res: Response<User | string>
  ) => {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      });
      if (!user) {
        return res.status(404).json("User not found");
      }
      if (user.provider) {
        return res.status(400).json("User signed up with different provider");
      }
      if (!user.password) {
        return res.status(400).json("User signed up with different provider");
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json("Invalid email or password");
      }
      const token = await new AuthMiddleware().generateToken(user);
      res.cookie("auth", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
      return res.status(200).json(`Welcome ${user.name}!`);
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal Server Error");
    }
  };
  // logout user
  logoutUser = async (req: Request, res: Response<string>) => {
    try {
      res.clearCookie("auth");
      return res.status(200).json("Logged out successfully");
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal Server Error");
    }
  };
  // update user
  updateUser = async (req: RequestWithUser, res: Response<User | string>) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(404).json("User not found");
      }
      const { email, name, password } = req.body;
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
      if (!user) {
        return res.status(404).json("User not found");
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const updatedUser = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          email,
          name,
          password: hashedPassword,
        },
      });
      return res.status(200).json(updatedUser);
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal Server Error");
    }
  };
  // delete user
  deleteUser = async (req: RequestWithUser, res: Response<string>) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(404).json("User not found");
      }
      await prisma.user.delete({
        where: {
          id: userId,
        },
      });
      return res.status(200).json("User deleted successfully");
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal Server Error");
    }
  };
  // delete any user
  deleteAnyUser = async (
    req: RequestWithUser<{ id: string }>,
    res: Response<string>
  ) => {
    try {
      if (req.user?.role !== this.#role) {
        return res.status(403).json("Unauthorized");
      }
      const { id } = req.params;
      if (!id) {
        return res.status(404).json("User not found");
      }
      await prisma.user.delete({
        where: {
          id: id,
        },
      });
      return res.status(200).json("User deleted successfully");
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal Server Error");
    }
  };
}
