import { supportedMimeTypes } from "../config/filesystem.config.js";
import { v4 as uuidV4 } from "uuid";
import fs from "fs";
export const imageValidator = (size, mime) => {
  if (bytesToMB(size) > 2) {
    return "Image size should be less than 2 MB";
  } else if (!supportedMimeTypes.includes(mime)) {
    return "Image type should be one of png, jpeg, jpg, webp, gif, svg";
  }
  return null;
};

export const bytesToMB = (bytes) => {
  return bytes / (1024 * 1024);
};

export const generateRandomFileName = () => {
  return uuidV4();
};

export const getImageUrl = (imageNmae) => {
  return `${process.env.API_URL}/images/${imageNmae}`;
};

export const removeImage = (imageNmae) => {
  const path = `${process.cwd()}/public/images/${imageNmae}`;

  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }
};
