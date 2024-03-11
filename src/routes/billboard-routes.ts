import express from "express";
import { BillboardFunctions } from "../controller/billboard.js";
import { AuthMiddleware } from "../middleware/auth-middleware.js";

const router = express.Router();
const billboardFunctions = new BillboardFunctions();
const authMiddleware = new AuthMiddleware();

router.post("/create", billboardFunctions.createBillboard);
router.get("/all", billboardFunctions.getAllBillboards);
router.get("/:billboardId", billboardFunctions.getBillboardById);
router.delete("/:billboardId", billboardFunctions.deleteBillboard);
router.put("/:billboardId", billboardFunctions.updateBillboard);

export default router;
