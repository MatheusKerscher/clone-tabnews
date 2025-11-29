import { join } from "path";
import { cwd } from "process";

import migrationsRunner, { type RunnerOption } from "node-pg-migrate";

import database from "infra/database";
import { ServiceError } from "infra/errors";

const migrationOptions = {
  dir: join(cwd(), "infra", "migrations"),
  direction: "up",
  migrationsTable: "pgmigrations",
  log: () => {},
};

async function runPendingMigrations(isDryRun: boolean) {
  let client;

  try {
    client = await database.getNewClient();

    const pendingMigrations = await migrationsRunner({
      ...migrationOptions,
      dryRun: isDryRun,
      dbClient: client,
    } as RunnerOption);

    return pendingMigrations;
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      cause: error,
      message: `Erro ao rodar as migrações no modo ${isDryRun ? "dryRun" : "liveRun"}.`,
    });

    throw serviceErrorObject;
  } finally {
    await client?.end();
  }
}

const migrator = {
  runPendingMigrations,
};

export default migrator;
