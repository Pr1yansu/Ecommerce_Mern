import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";

dotenv.config({
  path: ".env",
});

const port = process.env.PORT || 4000;

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// import routes
import userRoutes from "./routes/user-routes.js";
import billboardRoutes from "./routes/billboard-routes.js";
import categoryRoutes from "./routes/category-route.js";
import colorRoutes from "./routes/color-routes.js";
import sizeRoutes from "./routes/size-routes.js";
import productRoutes from "./routes/product-routes.js";

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/billboard", billboardRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/color", colorRoutes);
app.use("/api/v1/size", sizeRoutes);
app.use("/api/v1/product", productRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
