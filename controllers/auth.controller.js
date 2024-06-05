import vine, { errors } from "@vinejs/vine";
import { loginSchema, registerSchema } from "../validations/auth.validation.js";
import bcrypt from "bcryptjs";
import prisma from "../config/database.config.js";
import jwt from "jsonwebtoken";
export class AuthController {
  static register = async (req, res) => {
    const body = req.body;

    try {
      const validator = vine.compile(registerSchema);
      const result = await validator.validate(body);

      const hashedPassword = await bcrypt.hash(result.password, 10);
      result.password = hashedPassword;

      const doesUserExists = await prisma.user.findUnique({
        where: { email: result.email },
      });

      if (doesUserExists) {
        return res.status(400).json({
          message: "User already exists",
        });
      }

      const user = await prisma.user.create({
        data: result,
      });

      return res.status(201).json({
        message: "User created successfully!",
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
  };

  static login = async (req, res) => {
    const body = req.body;

    try {
      const validator = vine.compile(loginSchema);
      const result = await validator.validate(body);

      const user = await prisma.user.findUnique({
        where: { email: result.email },
      });

      const comparePassword = await bcrypt.compare(
        result.password,
        user?.password || ""
      );

      if (!comparePassword) {
        return res.status(400).json({
          message: "Invalid credentials",
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          profile: user.profile,
        },
        process.env.JWT_SECRET_KEY,
        {
          expiresIn: "365d",
        }
      );

      return res.status(200).json({
        message: "User logged in successfully!",
        access_token: `Bearer ${token}`,
      });
    } catch (error) {
      console.log(error);
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
  };
}
