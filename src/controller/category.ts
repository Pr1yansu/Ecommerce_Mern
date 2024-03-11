import { Category } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { Request, Response } from "express";
import NodeCache from "node-cache";

const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

export class CategoryFunctions {
  createCategory = async (req: Request<{}, {}, Category>, res: Response) => {
    try {
      const { name, value } = req.body;
      if (!name) {
        return res.status(400).json("Name is required");
      }
      await prisma.category.create({
        data: {
          name,
          value,
        },
      });
      return res.status(201).json("Category created");
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal server error");
    }
  };
  getAllCategories = async (req: Request, res: Response) => {
    try {
      const cachedCategories = myCache.get("allCategories");
      if (cachedCategories) {
        return res.status(200).json(cachedCategories);
      }

      const categories = await prisma.category.findMany({
        include: {
          products: true,
        },
      });
      myCache.set("allCategories", categories);
      return res.status(200).json(categories);
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal server error");
    }
  };
  getCategoryById = async (
    req: Request<{
      categoryId: string;
    }>,
    res: Response
  ) => {
    try {
      const { categoryId } = req.params;

      if (!categoryId) {
        return res.status(400).json("Id is required");
      }

      const cachedCategory = myCache.get(`category_${categoryId}`);
      if (cachedCategory) {
        return res.status(200).json(cachedCategory);
      }

      const category = await prisma.category.findUnique({
        where: {
          id: categoryId,
        },
        include: {
          products: true,
        },
      });
      if (!category) {
        return res.status(404).json("Category not found");
      }
      myCache.set(`category_${categoryId}`, category);
      return res.status(200).json(category);
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal server error");
    }
  };
  updateCategory = async (
    req: Request<
      {
        categoryId: string;
      },
      {},
      Category
    >,
    res: Response
  ) => {
    try {
      const { categoryId } = req.params;
      const { name, value } = req.body;
      if (!categoryId) {
        return res.status(400).json("Id is required");
      }
      await prisma.category.update({
        where: {
          id: categoryId,
        },
        data: {
          name,
          value,
        },
      });
      return res.status(200).json("Category updated");
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal server error");
    }
  };
  deleteCategory = async (
    req: Request<{
      categoryId: string;
    }>,
    res: Response
  ) => {
    try {
      const { categoryId } = req.params;
      if (!categoryId) {
        return res.status(400).json("Id is required");
      }
      await prisma.category.delete({
        where: {
          id: categoryId,
        },
      });
      myCache.del(`category_${categoryId}`);
      return res.status(200).json("Category deleted");
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal server error");
    }
  };
}
