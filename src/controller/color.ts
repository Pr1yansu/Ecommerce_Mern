import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import NodeCache from "node-cache";
import { Color } from "@prisma/client";

const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

export class ColorFunctions {
  createColor = async (req: Request<{}, {}, Color>, res: Response) => {
    try {
      const valueRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      const { name, value } = req.body;
      if (!name) {
        return res.status(400).json("Name is required");
      }
      if (!value) {
        return res.status(400).json("Value is required");
      }
      if (!valueRegex.test(value)) {
        return res.status(400).json("Invalid color value");
      }
      const color = await prisma.color.create({
        data: {
          name,
          value,
        },
      });
      return res.status(201).json("Color created successfully");
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal server error");
    }
  };
  getAllColors = async (req: Request, res: Response) => {
    try {
      const cachedColors = myCache.get("allColors");
      if (cachedColors) {
        return res.status(200).json(cachedColors);
      }

      const colors = await prisma.color.findMany();
      myCache.set("allColors", colors);
      return res.status(200).json(colors);
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal server error");
    }
  };
  getColorById = async (
    req: Request<{
      colorId: string;
    }>,
    res: Response
  ) => {
    try {
      const { colorId } = req.params;

      if (!colorId) {
        return res.status(400).json("Id is required");
      }

      const cachedColor = myCache.get(`color_${colorId}`);
      if (cachedColor) {
        return res.status(200).json(cachedColor);
      }

      const color = await prisma.color.findUnique({
        where: {
          id: colorId,
        },
      });

      if (!color) {
        return res.status(404).json("Color not found");
      }

      myCache.set(`color_${colorId}`, color);
      return res.status(200).json(color);
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal server error");
    }
  };
  updateColor = async (
    req: Request<
      {
        colorId: string;
      },
      {},
      Color
    >,
    res: Response
  ) => {
    try {
      const valueRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      const { colorId } = req.params;
      const { name, value } = req.body;

      if (!colorId) {
        return res.status(400).json("Id is required");
      }

      if (!name) {
        return res.status(400).json("Name is required");
      }

      if (!value) {
        return res.status(400).json("Value is required");
      }

      if (!valueRegex.test(value)) {
        return res.status(400).json("Invalid color value");
      }

      const color = await prisma.color.update({
        where: {
          id: colorId,
        },
        data: {
          name,
          value,
        },
      });

      myCache.set(`color_${colorId}`, color);
      return res.status(200).json("Color updated successfully");
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal server error");
    }
  };
  deleteColor = async (
    req: Request<{
      colorId: string;
    }>,
    res: Response
  ) => {
    try {
      const { colorId } = req.params;

      if (!colorId) {
        return res.status(400).json("Id is required");
      }

      await prisma.color.delete({
        where: {
          id: colorId,
        },
      });

      myCache.del(`color_${colorId}`);

      return res.status(200).json("Color deleted successfully");
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal server error");
    }
  };
}
