import type { NextApiRequest, NextApiResponse } from "next";

import { join } from "path";
import { cwd } from "process";

import { createRouter } from "next-connect";
import type { Client } from "pg";
import { runner as migrationsRunner, type RunnerOption } from "node-pg-migrate";

import controller from "infra/controller";
import database from "infra/database";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.get(getHandler).post(postHandler);

export default router.handler(controller.errorHandler);

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  let client;

  try {
    client = await database.getNewClient();
    const migrationOptions = getRunnerOptions(client, true);
    const pendingMigrations = await migrationsRunner(migrationOptions);
    res.status(200).json(pendingMigrations);
  } finally {
    await client?.end();
  }
}

async function postHandler(req: NextApiRequest, res: NextApiResponse) {
  let client;

  try {
    client = await database.getNewClient();
    const migrationOptions = getRunnerOptions(client, false);
    const migratedMigrations = await migrationsRunner(migrationOptions);

    if (migratedMigrations.length) {
      return res.status(201).json(migratedMigrations);
    }

    res.status(200).json(migratedMigrations);
  } finally {
    await client?.end();
  }
}

function getRunnerOptions(client: Client, isDryRun: boolean) {
  const migrationOptions: RunnerOption = {
    dbClient: client,
    dryRun: isDryRun,
    dir: join(cwd(), "infra", "migrations"),
    direction: "up",
    migrationsTable: "pgmigrations",
    verbose: true,
  };

  return migrationOptions;
}
