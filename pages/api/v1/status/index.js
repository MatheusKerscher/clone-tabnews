import database from "infra/database";
import { createRouter } from "next-connect";
import controller from "infra/controller";
import authorization from "models/authorization";
import postgres from "models/postgres";

const router = createRouter();

router.use(controller.injectAnonymousOrUser)
router.get(getHandler);

export default router.handler(controller.errorHandler);

async function getHandler(req, res) {
  const userTryingToGet = req.context.user
  let databaseVersion;

  if (authorization.can(userTryingToGet, "read:status:all", null)) {
    databaseVersion = await postgres.showDatabaseVersion()
  }

  const maxConnections = await postgres.showDatabaseMaxConnections()
  const openedConnections = await postgres.countOpenedConnections()

  const statusObject = {
    updateAt: new Date().toISOString(),
    database: {
      version: databaseVersion,
      maxConnections: parseInt(maxConnections),
      openedConnections: openedConnections,
    },
  }

  const secureOutputValues = authorization.filterOutput(userTryingToGet, "read:status", statusObject)

  res.status(200).json(secureOutputValues);
}
