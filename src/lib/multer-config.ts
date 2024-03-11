import multer from "multer";
import { v4 as uuid } from "uuid";
import { billboardsDir, productsDir } from "./ensure-upload-dir.js";

const storage = multer.diskStorage({
  destination(req, file, callback) {
    if (file.fieldname === "billboardImage") {
      callback(null, billboardsDir);
    }

    if (file.fieldname === "images") {
      callback(null, productsDir);
    }
  },
  filename(req, file, callback) {
    const id = uuid();
    const extName = file.originalname.split(".").pop();
    callback(null, `${id}.${extName}`);
  },
});

const upload = multer({ storage });

export default upload;
