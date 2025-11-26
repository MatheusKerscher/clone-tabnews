/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from "next";

import { createRouter } from "next-connect";
import { InternalServerError, MethodNotAllowedError } from "infra/errors";

import { runner as migrationsRunner, type RunnerOption } from "node-pg-migrate";
import { join } from "path";

import database from "infra/database";
import { cwd } from "process";
import type { Client } from "pg";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.get(getHandler).post(postHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

async function onNoMatchHandler(req: NextApiRequest, res: NextApiResponse) {
  const publicErrorObject = new MethodNotAllowedError();
  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

async function onErrorHandler(
  error: any,
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const publicErrorObject = new InternalServerError({ cause: error });

  console.log("\n Erro no next-connect:");
  console.error(publicErrorObject);

  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

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
