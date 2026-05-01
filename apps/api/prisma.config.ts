import { config } from "dotenv";
import { resolve } from "path";
import { defineConfig } from "prisma/config";

config({ path: resolve(__dirname, "../../.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
});
