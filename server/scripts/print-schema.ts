import { printSchema } from "graphql";
import { schema } from "../src/app.js";

process.stdout.write(`${printSchema(schema)}\n`);
