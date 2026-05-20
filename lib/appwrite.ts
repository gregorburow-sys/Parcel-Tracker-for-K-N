"use client";

import { Client, Databases } from "appwrite";
import { config } from "./config";

const client = new Client()
  .setEndpoint(config.appwriteEndpoint)
  .setProject(config.appwriteProjectId);

export const databases = new Databases(client);
export { client };
