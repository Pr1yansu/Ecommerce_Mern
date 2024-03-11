import express from "express";
import { ProductFunctions } from "../controller/product.js";
import { AuthMiddleware } from "../middleware/auth-middleware.js";

const router = express.Router();
const productFunctions = new ProductFunctions();
const authMiddleware = new AuthMiddleware();

router.post("/create", productFunctions.createProduct);
router.get("/all", productFunctions.getAllProducts);
router.get("/:productId", productFunctions.getProductById);
router.delete("/:productId", productFunctions.deleteProduct);
router.put("/:productId", productFunctions.updateProduct);

export default router;
