import { join } from "path";
import { cwd } from "process";

import { runner as migrationsRunner, type RunnerOption } from "node-pg-migrate";

import database from "infra/database";
import { ServiceError } from "infra/errors";

const migrationOptions = {
  dryRun: true,
  dir: join(cwd(), "infra", "migrations"),
  direction: "up",
  migrationsTable: "pgmigrations",
  verbose: true,
};

async function listPendingMigrations() {
  let client;

  try {
    client = await database.getNewClient();

    const pendingMigrations = await migrationsRunner({
      ...migrationOptions,
      dbClient: client,
    } as RunnerOption);

    return pendingMigrations;
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      cause: error,
      message: "Erro ao rodar as migrações no modo dryRun.",
    });

    throw serviceErrorObject;
  } finally {
    await client?.end();
  }
}

async function runPendingMigrations() {
  let client;

  try {
    client = await database.getNewClient();

    const pendingMigrations = await migrationsRunner({
      ...migrationOptions,
      dryRun: false,
      dbClient: client,
    } as RunnerOption);

    return pendingMigrations;
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      cause: error,
      message: "Erro ao rodar as migrações no modo liveRun.",
    });

    throw serviceErrorObject;
  } finally {
    await client?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
