import { Client, Databases } from "appwrite";
import config from "./config";

const client = new Client()
  .setEndpoint(config.appwriteURL)
  .setProject(config.appwriteProjectID);

const databases = new Databases(client);

export { client, databases };
