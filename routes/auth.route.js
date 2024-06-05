import e from "express";
import { AuthController } from "../controllers/auth.controller.js";
import ProfileController from "../controllers/profile.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import NewController from "../controllers/news.controller.js";

const router = e.Router();

router.post("/auth/register", AuthController.register);
router.post("/auth/login", AuthController.login);

// Profile
router.get("/profile", authMiddleware, ProfileController.index);
router.put("/profile/:id", authMiddleware, ProfileController.update);

// News
router.get("/news", authMiddleware, NewController.index);
router.post("/news", authMiddleware, NewController.store);
router.get("/news/:id", authMiddleware, NewController.show);
router.put("/news/:id", authMiddleware, NewController.update);
router.delete("/news/:id", authMiddleware, NewController.delete);

export default router;
