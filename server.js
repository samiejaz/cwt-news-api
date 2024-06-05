import express from "express";
import fileupload from "express-fileupload";
import helmet from "helmet";
import cors from "cors";

import { limiter } from "./config/ratelimt.config.js";

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(fileupload());

app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.use(limiter);

import router from "./routes/auth.route.js";

app.use("/api", router);

app.listen(PORT, () => {
  console.log("Example app listening on port " + PORT);
});
