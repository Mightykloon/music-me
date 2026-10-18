import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    // schema changes go over Neon's direct (unpooled) connection when it's set;
    // the app itself queries through the pooled DATABASE_URL (src/lib/db)
    url:
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.DATABASE_URL ??
      "postgresql://musicme:musicme@localhost:5432/musicme?schema=public",
  },
});
