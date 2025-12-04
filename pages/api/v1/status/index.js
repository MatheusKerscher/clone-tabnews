import database from "infra/database";
import { createRouter } from "next-connect";
import controller from "infra/controller";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandler);

async function getHandler(req, res) {
  const updateAt = new Date().toISOString();
  const databaseVersion = (await database.query("SHOW server_version;")).rows[0]
    .server_version;
  const maxConnections = (await database.query("SHOW max_connections;")).rows[0]
    .max_connections;

  const databaseName = process.env.POSTGRES_DB;
  const openedConnections = (
    await database.query({
      text: "SELECT COUNT(*)::int AS opened_connections FROM pg_stat_activity WHERE datname = $1;",
      values: [databaseName],
    })
  ).rows[0].opened_connections;

  res.status(200).json({
    update_at: updateAt,
    dependencies: {
      database: {
        version: databaseVersion,
        max_connections: parseInt(maxConnections),
        opened_connections: openedConnections,
      },
    },
  });
}
