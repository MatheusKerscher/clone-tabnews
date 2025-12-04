import { createRouter } from "next-connect";

import controller from "infra/controller";
import migrator from "models/migrator";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandler);

async function getHandler(req, res) {
  const pendingMigrations = await migrator.runPendingMigrations(true);

  res.status(200).json(pendingMigrations);
}

async function postHandler(req, res) {
  const migratedMigrations = await migrator.runPendingMigrations(false);

  if (migratedMigrations.length) {
    return res.status(201).json(migratedMigrations);
  }

  res.status(200).json(migratedMigrations);
}
