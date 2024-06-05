import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 60 * 60,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
