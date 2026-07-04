import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Render deployment only: when both the API and the built dashboard are
// shipped as a single web service (no shared reverse proxy like Replit's),
// serve the dashboard's static build output and fall back to its index.html
// for any non-/api route. This is a no-op on Replit, where the dashboard
// runs as its own artifact/service.
if (process.env.SERVE_STATIC_DASHBOARD === "true") {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const dashboardDir = path.resolve(
    currentDir,
    "../../office-dashboard/dist/public",
  );
  app.use(express.static(dashboardDir));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(dashboardDir, "index.html"));
  });
}

export default app;
