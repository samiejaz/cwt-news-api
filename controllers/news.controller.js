import vine, { errors } from "@vinejs/vine";
import { newsSchema } from "../validations/new.validation.js";
import {
  generateRandomFileName,
  getImageUrl,
  imageValidator,
  removeImage,
} from "../utils/helpers.js";
import prisma from "../config/database.config.js";

class NewController {
  static async index(req, res) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      if (page <= 0) {
        page = 1;
      }

      const offset = (page - 1) * limit;

      const news = await prisma.news.findMany({
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      const transformedNews = news.map((item) =>
        NewController.transformNews(item)
      );

      const totalNewsCount = await prisma.news.count();
      const totalPages = Math.ceil(totalNewsCount / limit);

      return res.status(200).json({
        message: "News",
        news: transformedNews,
        metaData: {
          totalNewsCount,
          totalPages,
          currentPage: page,
          currentLimit: limit,
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Something went wrong..." });
    }
  }
  static async store(req, res) {
    try {
      const user = req.user;
      const body = req.body;
      const validator = vine.compile(newsSchema);

      const result = await validator.validate(body);

      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: "Thumbail is required!." });
      }

      const thumbail = req.files.thumbail;
      const message = imageValidator(thumbail?.size, thumbail?.mimetype);

      if (message !== null) {
        return res.status(400).json({
          errors: {
            thumbail: message,
          },
        });
      }

      const imageExtention = thumbail.mimetype.split("/")[1];
      const fileName = `${generateRandomFileName()}.${imageExtention}`;
      const filePath = process.cwd() + "/public/images/" + fileName;

      thumbail.mv(filePath, (err) => {
        if (err) throw err;
      });

      const news = await prisma.news.create({
        data: {
          title: result.title,
          content: result.content,
          image: fileName,
          user_id: user.id,
        },
      });

      return res.status(201).json({
        message: "News created successfully!",
        news,
      });
    } catch (error) {
      if (error instanceof errors.E_VALIDATION_ERROR) {
        return res.status(400).json({
          errors: error.messages,
        });
      } else {
        return res.status(500).json({
          message: "Something went wrong...",
        });
      }
    }
  }
  static async update(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;
      const body = req.body;
      const validator = vine.compile(newsSchema);

      const result = await validator.validate(body);

      const newsExists = await prisma.news.findUnique({
        where: {
          id: Number(id),
          user_id: user.id,
        },
      });

      if (!newsExists) {
        return res.status(404).json({
          message: "News not found!",
        });
      }

      const image = req?.files?.image;

      if (image) {
        const message = imageValidator(image?.size, image?.mimetype);

        if (message !== null) {
          return res.status(400).json({
            errors: {
              image: message,
            },
          });
        }

        const imageExtention = image.mimetype.split("/")[1];
        const fileName = `${generateRandomFileName()}.${imageExtention}`;
        const filePath = process.cwd() + "/public/images/" + fileName;

        image.mv(filePath, (err) => {
          if (err) throw err;
        });
        await prisma.news.update({
          where: {
            id: Number(id),
            user_id: user.id,
          },
          data: {
            image: fileName,
          },
        });

        if (newsExists.image) {
          removeImage(newsExists.image);
        }
      }

      const news = await prisma.news.update({
        where: {
          id: Number(id),
          user_id: user.id,
        },
        data: {
          title: result.title,
          content: result.content,
          updated_at: new Date(),
        },
      });

      return res.status(200).json({
        message: "News updated successfully!",
        news,
      });
    } catch (error) {
      if (error instanceof errors.E_VALIDATION_ERROR) {
        return res.status(400).json({
          errors: error.messages,
        });
      } else {
        return res.status(500).json({
          message: "Something went wrong...",
        });
      }
    }
  }
  static async show(req, res) {
    try {
      const { id } = req.params;
      const news = await prisma.news.findUnique({
        where: {
          id: Number(id),
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!news) {
        return res.status(404).json({
          message: "News not found!",
        });
      }

      return res.status(200).json({
        message: "News",
        news: NewController.transformNews(news),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Something went wrong..." });
    }
  }
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;

      const newsExists = await prisma.news.findUnique({
        where: {
          id: Number(id),
          user_id: user.id,
        },
      });

      if (!newsExists) {
        return res.status(404).json({
          message: "News not found!",
        });
      }

      removeImage(newsExists.image);

      const news = await prisma.news.delete({
        where: {
          id: Number(id),
          user_id: user.id,
        },
      });

      if (!news) {
        return res.status(404).json({
          message: "News not found!",
        });
      }

      return res.status(200).json({
        message: "News deleted successfully!",
        news,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Something went wrong..." });
    }
  }

  static transformNews(news) {
    return {
      id: news.id,
      title: news.title,
      content: news.content,
      image: getImageUrl(news.image),
      user_id: news.user_id,
      username: news.user.name,
      created_at: news.created_at,
      updated_at: news.updated_at,
    };
  }
}

export default NewController;
