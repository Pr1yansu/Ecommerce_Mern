import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import upload from "../lib/multer-config.js";
import { BillBoard } from "@prisma/client";
import NodeCache from "node-cache";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

const __filename = fileURLToPath(import.meta.url);
const dist = path.dirname(__filename);
const __dirname = path.resolve(dist, "..");

export class BillboardFunctions {
  createBillboard = async (req: Request<{}, {}, BillBoard>, res: Response) => {
    try {
      const uploadSingle = upload.single("billboardImage");
      uploadSingle(req, res, async (err: any) => {
        if (err) {
          console.error(err);
          return res.status(400).json("Image upload failed");
        }
        const { name, description } = req.body;
        if (!name || !description) {
          return res.status(400).json("Title and description are required");
        }
        if (req.file === undefined) {
          return res.status(400).json("Image is required");
        }

        const imageUrl = `${req.protocol}://${req.get(
          "host"
        )}/uploads/billboards/${req.file.filename}`;

        await prisma.billBoard.create({
          data: {
            name,
            description,
            image: imageUrl,
          },
        });
        return res.status(201).json("Billboard created");
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal server error");
    }
  };
  getAllBillboards = async (req: Request, res: Response) => {
    try {
      const cachedBillboards = myCache.get("allBillboards");
      if (cachedBillboards) {
        return res.status(200).json(cachedBillboards);
      }

      const billboards = await prisma.billBoard.findMany({
        include: {
          products: true,
        },
      });
      myCache.set("allBillboards", billboards);

      return res.status(200).json(billboards);
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal server error");
    }
  };
  getBillboardById = async (
    req: Request<{
      billboardId: string;
    }>,
    res: Response
  ) => {
    try {
      const { billboardId } = req.params;

      const cachedBillboard = myCache.get(`billboard_${billboardId}`);
      if (cachedBillboard) {
        return res.status(200).json(cachedBillboard);
      }

      const billboard = await prisma.billBoard.findUnique({
        where: {
          id: billboardId,
        },
        include: {
          products: true,
        },
      });
      if (!billboard) {
        return res.status(404).json("Billboard not found");
      }

      myCache.set(`billboard_${billboardId}`, billboard);

      return res.status(200).json(billboard);
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal server error");
    }
  };
  deleteBillboard = async (
    req: Request<{
      billboardId: string;
    }>,
    res: Response
  ) => {
    try {
      const { billboardId } = req.params;
      const billboard = await prisma.billBoard.findUnique({
        where: {
          id: billboardId,
        },
      });
      if (!billboard) {
        return res.status(404).json("Billboard not found");
      }
      const imagePath = path.join(
        __dirname,
        "..",
        billboard.image.replace(/.*\/uploads\//, "/uploads/")
      );
      fs.unlinkSync(imagePath);
      await prisma.billBoard.delete({
        where: {
          id: billboardId,
        },
      });
      myCache.del(`billboard_${billboardId}`);
      return res.status(200).json("Billboard deleted");
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal server error");
    }
  };
  updateBillboard = async (
    req: Request<
      {
        billboardId: string;
      },
      {},
      BillBoard
    >,
    res: Response
  ) => {
    try {
      const { billboardId } = req.params;
      upload.single("billboardImage")(req, res, async (err: any) => {
        const { name, description } = req.body;
        const billboard = await prisma.billBoard.findUnique({
          where: {
            id: billboardId,
          },
        });
        if (!billboard) {
          if (req.file) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(404).json("Billboard not found");
        }
        if (req.file) {
          const imagePath = path.join(
            __dirname,
            "..",
            billboard.image.replace(/.*\/uploads\//, "/uploads/")
          );
          fs.unlinkSync(imagePath);
        }
        if (err) {
          console.error(err);
          if (req.file) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(400).json("Image upload failed");
        }
        const imageUrl = req.file
          ? `${req.protocol}://${req.get("host")}/uploads/billboards/${
              req.file.filename
            }`
          : billboard.image;
        await prisma.billBoard.update({
          where: {
            id: billboardId,
          },
          data: {
            name,
            description,
            image: imageUrl,
          },
        });
        myCache.del(`billboard_${billboardId}`);
        return res.status(200).json("Billboard updated");
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal server error");
    }
  };
}
