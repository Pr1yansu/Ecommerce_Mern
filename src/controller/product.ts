import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import upload from "../lib/multer-config.js";
import { Products } from "@prisma/client";
import fs from "fs";
import NodeCache from "node-cache";

const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

export class ProductFunctions {
  createProduct = (req: Request, res: Response) => {
    upload.array("images")(req, res, async (err: any) => {
      try {
        const {
          name,
          description,
          price,
          sizeId,
          colorId,
          billBoardId,
          categoryId,
        } = req.body;

        if (
          !name ||
          !description ||
          !price ||
          !sizeId ||
          !colorId ||
          !billBoardId ||
          !categoryId
        ) {
          if (req.files) {
            (req.files as Express.Multer.File[]).forEach((file) => {
              const filePath = `./uploads/products/${file.filename}`;
              fs.unlinkSync(filePath);
            });
          }
          return res.status(400).json("All fields are required");
        }
        if (err) {
          console.error(err);
          return res.status(400).json("Image upload failed");
        }
        if (req.files === undefined) {
          return res.status(400).json("Image is required");
        }
        const images = (req.files as Express.Multer.File[]).map(
          (file: Express.Multer.File) => {
            return `${req.protocol}://${req.get("host")}/uploads/products/${
              file.filename
            }`;
          }
        );
        await prisma.products.create({
          data: {
            name,
            description,
            price,
            banner: images[0],
            Size: {
              connect: {
                id: sizeId,
              },
            },
            Color: {
              connect: {
                id: colorId,
              },
            },
            BillBoard: {
              connect: {
                id: billBoardId,
              },
            },
            Category: {
              connect: {
                id: categoryId,
              },
            },
            images: {
              create: images.map((image) => ({
                image,
              })),
            },
          },
        });
        return res.status(201).json("Product created successfully");
      } catch (error) {
        console.error(error);
        if (req.files) {
          (req.files as Express.Multer.File[]).forEach((file) => {
            const filePath = `./uploads/products/${file.filename}`;
            fs.unlinkSync(filePath);
          });
        }
        return res.status(500).json("Internal server error");
      }
    });
  };
  getAllProducts = async (
    req: Request<
      {},
      {},
      {},
      {
        limit: string;
        offset: string;
        categoryId: string;
        sizeId: string;
        colorId: string;
        billBoardId: string;
      }
    >,
    res: Response
  ) => {
    try {
      const { limit, offset, categoryId, sizeId, colorId, billBoardId } =
        req.query;

      const cacheKey = `allProducts:${limit}:${offset}:${categoryId}:${sizeId}:${colorId}:${billBoardId}`;

      const cachedProducts = myCache.get(cacheKey);
      if (cachedProducts) {
        return res.status(200).json(cachedProducts);
      }

      const products = await prisma.products.findMany({
        include: {
          Size: true,
          Color: true,
          BillBoard: true,
          images: true,
        },
        where: {
          categoryId: categoryId ? categoryId : undefined,
          sizeId: sizeId ? sizeId : undefined,
          colorId: colorId ? colorId : undefined,
          billBoardId: billBoardId ? billBoardId : undefined,
        },
        skip: offset ? parseInt(offset) : undefined,
        take: limit ? parseInt(limit) : undefined,
      });

      myCache.set(cacheKey, products);

      return res.status(200).json(products);
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal server error");
    }
  };
  getProductById = async (
    req: Request<{
      productId: string;
    }>,
    res: Response
  ) => {
    try {
      const { productId } = req.params;

      if (!productId) {
        return res.status(400).json("Id is required");
      }

      const cachedProduct = myCache.get(`product_${productId}`);
      if (cachedProduct) {
        return res.status(200).json(cachedProduct);
      }

      const product = await prisma.products.findUnique({
        where: {
          id: productId,
        },
        include: {
          Size: true,
          Color: true,
          BillBoard: true,
          images: true,
        },
      });
      if (!product) {
        return res.status(404).json("Product not found");
      }
      myCache.set(`product_${productId}`, product);
      return res.status(200).json(product);
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal server error");
    }
  };
  deleteProduct = async (
    req: Request<{
      productId: string;
    }>,
    res: Response
  ) => {
    try {
      const { productId } = req.params;

      if (!productId) {
        return res.status(400).json("Id is required");
      }

      const product = await prisma.products.findUnique({
        where: {
          id: productId,
        },
        include: {
          images: true,
        },
      });

      if (!product) {
        return res.status(404).json("Product not found");
      }

      if (product.images) {
        product.images.forEach((image) => {
          const filePath = image.image.replace(/.*\/uploads\//, "./uploads/");
          fs.unlinkSync(filePath);
        });
      }
      await prisma.products.delete({
        where: {
          id: productId,
        },
      });

      myCache.del(`product_${productId}`);

      return res.status(200).json("Product deleted successfully");
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal server error");
    }
  };
  updateProduct = async (
    req: Request<
      {
        productId: string;
      },
      {},
      Products
    >,
    res: Response
  ) => {
    upload.array("images")(req, res, async (err: any) => {
      try {
        const { productId } = req.params;
        const {
          name,
          description,
          price,
          sizeId,
          colorId,
          billBoardId,
          categoryId,
        } = req.body;

        if (
          !name ||
          !description ||
          !price ||
          !sizeId ||
          !colorId ||
          !billBoardId ||
          !categoryId
        ) {
          return res.status(400).json("All fields are required");
        }
        if (err) {
          console.error(err);
          return res.status(400).json("Image upload failed");
        }
        if (req.files === undefined) {
          return res.status(400).json("Image is required");
        }

        const product = await prisma.products.findUnique({
          where: {
            id: productId,
          },
          include: {
            images: true,
          },
        });

        if (!product) {
          if (req.files) {
            (req.files as Express.Multer.File[]).forEach((file) => {
              const filePath = `./uploads/products/${file.filename}`;
              fs.unlinkSync(filePath);
            });
          }
          return res.status(404).json("Product not found");
        }

        // Delete old images
        if (product.images) {
          product.images.forEach((image) => {
            fs.unlinkSync(image.image.replace(/.*\/uploads\//, "./uploads/"));
          });
        }

        // Create new images
        const images = (req.files as Express.Multer.File[]).map(
          (file: Express.Multer.File) => {
            return `${req.protocol}://${req.get("host")}/uploads/products/${
              file.filename
            }`;
          }
        );

        // Update the product with new images and banner
        await prisma.products.update({
          where: {
            id: productId,
          },
          data: {
            name,
            description,
            price,
            banner: images[0],
            Size: {
              connect: {
                id: sizeId,
              },
            },
            Color: {
              connect: {
                id: colorId,
              },
            },
            BillBoard: {
              connect: {
                id: billBoardId,
              },
            },
            Category: {
              connect: {
                id: categoryId,
              },
            },
            images: {
              deleteMany: {},
              create: images.map((image) => ({
                image,
              })),
            },
          },
        });

        myCache.del(`product_${productId}`);
        return res.status(200).json("Product updated successfully");
      } catch (error) {
        console.error(error);
        if (req.files) {
          (req.files as Express.Multer.File[]).forEach((file) => {
            const filePath = `./uploads/products/${file.filename}`;
            fs.unlinkSync(filePath);
          });
        }
        return res.status(500).json("Internal server error");
      }
    });
  };
}
