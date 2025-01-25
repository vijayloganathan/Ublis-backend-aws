"use strict";

const Hapi = require("@hapi/hapi");
import logger from "./helper/logger";
import Router from "./routes";

import * as DotEnv from "dotenv";

const init = async () => {
  try {
    DotEnv.config();

    // const server = Hapi.server({
    //   host: "0.0.0.0",
    //   port: 6201,
    //   routes: {
    //     cors: {
    //       origin: [
    //         "http://3.111.31.152",
    //         "http://localhost:5173",
    //         "http://43.204.98.66",
    //         "http://192.168.221.248:5173",
    //         "http://192.168.221.248:5174",
    //         "http://192.168.43.248",
    //         "http://3.109.210.24",
    //         "http://13.201.189.174",
    //         "http://65.1.147.86",
    //         "http://13.203.86.57",
    //         "http://192.168.221.248",
    //       ], // Allowed origins
    //       headers: ["Accept", "Authorization", "Content-Type", "If-None-Match"], // Allowed headers
    //       exposedHeaders: ["WWW-Authenticate", "Server-Authorization"], // Exposed headers
    //       credentials: true, // Allow credentials (cookies/auth headers)
    //     },
    //     payload: {
    //       maxBytes: 5242880,
    //     },
    //   },
    // });

    const server = Hapi.server({
      host: process.env.HOST || "localhost",
      port: process.env.PORT || 6201,
      routes: {
        cors: {
          origin: ["*"],
          headers: ["Accept", "Authorization", "Content-Type", "If-None-Match"],
          exposedHeaders: ["WWW-Authenticate", "Server-Authorization"],
          credentials: true,
        },
        security: true,
        payload: {
          maxBytes: 5242880,
        },
      },
    });

    // REGISTER HAPI ROUTES
    await Router.loadRoutes(server);

    await server.start((error: any) => {
      if (error) {
        logger.error(error);
        throw error;
      }
    });

    logger.info("server running --- from server.ts", process.env.PORT);
  } catch (error) {
    logger.error("Server not running...", error);
  }
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
