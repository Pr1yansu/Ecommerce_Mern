import express from "express";
import { SizeFunctions } from "../controller/size.js";
import { AuthMiddleware } from "../middleware/auth-middleware.js";

const router = express.Router();
const sizeFunctions = new SizeFunctions();
const authMiddleware = new AuthMiddleware();

router.post("/create", sizeFunctions.createSize);
router.get("/all", sizeFunctions.getAllSizes);
router.get("/:sizeId", sizeFunctions.getSizeById);
router.delete("/:sizeId", sizeFunctions.deleteSize);
router.put("/:sizeId", sizeFunctions.updateSize);

export default router;
