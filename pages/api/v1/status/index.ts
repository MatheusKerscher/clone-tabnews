import type { NextApiRequest, NextApiResponse } from "next";

import database from "infra/database";
import { InternalServerError, MethodNotAllowedError } from "infra/errors";
import { createRouter } from "next-connect";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.get(getHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

async function onNoMatchHandler(req: NextApiRequest, res: NextApiResponse) {
  const publicErrorObject = new MethodNotAllowedError();
  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function onErrorHandler(
  error: any,
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.log("\n Erro no next-connect:");
  console.error(publicErrorObject);

  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
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
