import type { NextApiRequest, NextApiResponse } from "next";

import { runner as migrationsRunner, type RunnerOption } from "node-pg-migrate";
import { join } from "path";

import database from "infra/database";
import { cwd } from "process";

export default async function migrations(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const allowedMethods = ["GET", "POST"];
  const currentMethod = req.method!;

  if (!allowedMethods.includes(currentMethod)) {
    return res.status(405).json({
      message: `Method ${currentMethod} not allowed to this request!`,
    });
  }

  let client;

  try {
    client = await database.getNewClient();

    const defaultMigrationOptions: RunnerOption = {
      dbClient: client,
      dryRun: true,
      dir: join(cwd(), "infra", "migrations"),
      direction: "up",
      migrationsTable: "pgmigrations",
      verbose: true,
    };

    if (currentMethod === "GET") {
      const pendingMigrations = await migrationsRunner(defaultMigrationOptions);

      return res.status(200).json(pendingMigrations);
    }

    const migratedMigrations = await migrationsRunner({
      ...defaultMigrationOptions,
      dryRun: false,
    });

    if (migratedMigrations.length) {
      return res.status(201).json(migratedMigrations);
    }

    return res.status(200).json(migratedMigrations);
  } catch (error) {
    console.log(error);
    throw error;
  } finally {
    await client?.end();
  }
}
