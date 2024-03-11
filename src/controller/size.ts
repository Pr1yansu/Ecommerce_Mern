import { Response, Request } from "express";
import { prisma } from "../lib/prisma.js";
import NodeCache from "node-cache";
import { Size } from "@prisma/client";

const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

export class SizeFunctions {
  createSize = async (req: Request<{}, {}, Size>, res: Response) => {
    try {
      const { name, value } = req.body;
      if (!name) {
        return res.status(400).json("Name is required");
      }
      await prisma.size.create({
        data: {
          name,
          value,
        },
      });
      return res.status(201).json("Size created successfully");
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal server error");
    }
  };
  getAllSizes = async (req: Request, res: Response) => {
    try {
      const cachedSizes = myCache.get("allSizes");
      if (cachedSizes) {
        return res.status(200).json(cachedSizes);
      }

      const sizes = await prisma.size.findMany();
      myCache.set("allSizes", sizes);
      return res.status(200).json(sizes);
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal server error");
    }
  };
  getSizeById = async (
    req: Request<{
      sizeId: string;
    }>,
    res: Response
  ) => {
    try {
      const { sizeId } = req.params;

      if (!sizeId) {
        return res.status(400).json("Id is required");
      }

      const cachedSize = myCache.get(`size_${sizeId}`);
      if (cachedSize) {
        return res.status(200).json(cachedSize);
      }

      const size = await prisma.size.findUnique({
        where: {
          id: sizeId,
        },
      });
      if (!size) {
        return res.status(404).json("Size not found");
      }
      myCache.set(`size_${sizeId}`, size);
      return res.status(200).json(size);
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal server error");
    }
  };
  deleteSize = async (
    req: Request<{
      sizeId: string;
    }>,
    res: Response
  ) => {
    try {
      const { sizeId } = req.params;

      if (!sizeId) {
        return res.status(400).json("Id is required");
      }

      const size = await prisma.size.delete({
        where: {
          id: sizeId,
        },
      });

      myCache.del(`size_${sizeId}`);

      return res.status(200).json("Size deleted successfully");
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal server error");
    }
  };
  updateSize = async (
    req: Request<
      {
        sizeId: string;
      },
      {},
      Size
    >,
    res: Response
  ) => {
    try {
      const { sizeId } = req.params;
      const { name, value } = req.body;
      if (!sizeId) {
        return res.status(400).json("Id is required");
      }
      const size = await prisma.size.update({
        where: {
          id: sizeId,
        },
        data: {
          name,
          value,
        },
      });

      myCache.set(`size_${sizeId}`, size);

      return res.status(200).json("Size updated successfully");
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal server error");
    }
  };
}
