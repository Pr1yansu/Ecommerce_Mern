import express from "express";
import { CategoryFunctions } from "../controller/category.js";
import { AuthMiddleware } from "../middleware/auth-middleware.js";

const router = express.Router();
const categoryFunctions = new CategoryFunctions();
const authMiddleware = new AuthMiddleware();

router.post("/create", categoryFunctions.createCategory);
router.get("/all", categoryFunctions.getAllCategories);
router.get("/:categoryId", categoryFunctions.getCategoryById);
router.delete("/:categoryId", categoryFunctions.deleteCategory);
router.put("/:categoryId", categoryFunctions.updateCategory);

export default router;
