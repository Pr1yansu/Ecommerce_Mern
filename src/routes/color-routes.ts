import express from "express";
import { ColorFunctions } from "../controller/color.js";
import { AuthMiddleware } from "../middleware/auth-middleware.js";

const router = express.Router();
const colorFunctions = new ColorFunctions();
const authMiddleware = new AuthMiddleware();

router.post("/create", colorFunctions.createColor);
router.get("/all", colorFunctions.getAllColors);
router.get("/:colorId", colorFunctions.getColorById);
router.delete("/:colorId", colorFunctions.deleteColor);
router.put("/:colorId", colorFunctions.updateColor);

export default router;
