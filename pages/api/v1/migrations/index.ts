import type { NextApiRequest, NextApiResponse } from "next";

import { runner as migrationsRunner, type RunnerOption } from "node-pg-migrate";
import { join } from "path";

import database from "infra/database";

export default async function migrations(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const client = await database.getNewClient();

  const defaultMigrationOptions: RunnerOption = {
    dbClient: client,
    dryRun: true,
    dir: join("infra", "migrations"),
    direction: "up",
    migrationsTable: "pgmigrations",
    verbose: true,
  };

  if (req.method === "GET") {
    const pendingMigrations = await migrationsRunner(defaultMigrationOptions);
    await client.end();

    return res.status(200).json(pendingMigrations);
  }

  if (req.method === "POST") {
    const migratedMigrations = await migrationsRunner({
      ...defaultMigrationOptions,
      dryRun: false,
    });

    await client.end();

    if (migratedMigrations.length) {
      return res.status(201).json(migratedMigrations);
    }

    return res.status(200).json(migratedMigrations);
  }

  res.status(405).end();
}
