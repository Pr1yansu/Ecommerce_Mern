import express from "express";
import { UserFunctions } from "../controller/user.js";
import { AuthMiddleware } from "../middleware/auth-middleware.js";

const router = express.Router();
const userFunctions = new UserFunctions();
const authMiddleware = new AuthMiddleware();

router.post("/create", userFunctions.createUser);
router.post("/login", userFunctions.loginUser);
router.get("/all", userFunctions.getAllUsers);
router.get("/me", authMiddleware.checkAuth, userFunctions.getUserById);

export default router;
