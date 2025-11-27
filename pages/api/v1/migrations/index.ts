import type { NextApiRequest, NextApiResponse } from "next";

import { createRouter } from "next-connect";

import controller from "infra/controller";
import migrator from "models/migrator";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandler);

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  const pendingMigrations = await migrator.runPendingMigrations(true);

  res.status(200).json(pendingMigrations);
}

async function postHandler(req: NextApiRequest, res: NextApiResponse) {
  const migratedMigrations = await migrator.runPendingMigrations(false);

  if (migratedMigrations.length) {
    return res.status(201).json(migratedMigrations);
  }

  res.status(200).json(migratedMigrations);
}
