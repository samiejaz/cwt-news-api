import prisma from "../config/database.config.js";
import { generateRandomFileName, imageValidator } from "../utils/helpers.js";

export default class ProfileController {
  static index = async (req, res) => {
    try {
      const user = req.user;
      return res.status(200).json({ message: "Profile", user });
    } catch (error) {
      return res.status(500).json({ message: "Something went wrong..." });
    }
  };

  static async store() {}
  static async destroy() {}
  static async show() {}
  static async update(req, res) {
    try {
      const { id } = req.params;

      const authUser = req.user;

      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: "No files were uploaded." });
      }
      if (Number(id) !== authUser.id) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const profile = req.files.profile;

      const message = imageValidator(profile?.size, profile?.mimetype);

      if (message !== null) {
        return res.status(400).json({
          errors: {
            profile: message,
          },
        });
      }

      const imageExtention = profile.mimetype.split("/")[1];
      const fileName = `${generateRandomFileName()}.${imageExtention}`;
      const filePath = process.cwd() + "/public/images/" + fileName;

      profile.mv(filePath, (err) => {
        if (err) throw err;
      });

      await prisma.user.update({
        where: { id: authUser.id },
        data: { profile: fileName },
      });

      return res.status(200).json({
        message: "Profile updated successfully!",
        fileName: profile.name,
        size: profile.size,
        mime: profile.mimetype,
      });
    } catch (error) {
      return res.status(500).json({ message: "Something went wrong..." });
    }
  }
}
