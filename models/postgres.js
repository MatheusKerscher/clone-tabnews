import database from "infra/database";

async function showDatabaseVersion() {
  const databaseVersion = await runShowQuery();

  return databaseVersion;

  async function runShowQuery() {
    const results = await database.query("SHOW server_version;")

    return results.rows[0].server_version;
  }
}

async function showDatabaseMaxConnections() {
  const databaseMaxConnection = await runShowQuery();

  return databaseMaxConnection;

  async function runShowQuery() {
    const results = await database.query("SHOW max_connections;")

    return results.rows[0].max_connections;
  }
}

async function countOpenedConnections() {
  const openedConnections = await runShowQuery();

  return openedConnections;

  async function runShowQuery() {
    const databaseName = process.env.POSTGRES_DB;

    const results = await database.query({
      text: "SELECT COUNT(*)::int AS opened_connections FROM pg_stat_activity WHERE datname = $1;",
      values: [databaseName],
    })

    return results.rows[0].opened_connections;
  }
}

const postgres = {
  showDatabaseVersion,
  showDatabaseMaxConnections,
  countOpenedConnections
};

export default postgres;
