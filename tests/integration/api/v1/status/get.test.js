import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status");
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const updateAt = new Date(responseBody.update_at).toISOString();
      expect(responseBody.update_at).toEqual(updateAt);

      expect(responseBody.dependencies.database.max_connections).toEqual(100);
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);
      expect(responseBody.dependencies.database).not.toHaveProperty("version");
    });
  });

  describe("Default user", () => {
    test("Retrieving current system status", async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser.id);
      const defaultUserSession = await orchestrator.createSession(
        defaultUser.id,
      );

      const response = await fetch("http://localhost:3000/api/v1/status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${defaultUserSession.token}`,
        },
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const updateAt = new Date(responseBody.update_at).toISOString();
      expect(responseBody.update_at).toEqual(updateAt);

      expect(responseBody.dependencies.database.max_connections).toEqual(100);
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);
      expect(responseBody.dependencies.database).not.toHaveProperty("version");
    });
  });

  describe("Privileged user", () => {
    test("With 'read:status:all' retrieving current system status", async () => {
      const privilegedUser = await orchestrator.createUser();
      await orchestrator.activateUser(privilegedUser.id);
      await orchestrator.addFeaturesToUser(privilegedUser.id, [
        "read:status:all",
      ]);
      const privilegedUserSession = await orchestrator.createSession(
        privilegedUser.id,
      );

      const response = await fetch("http://localhost:3000/api/v1/status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${privilegedUserSession.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const updateAt = new Date(responseBody.update_at).toISOString();
      expect(responseBody.update_at).toEqual(updateAt);

      expect(responseBody.dependencies.database.version).toEqual("18.0");
      expect(responseBody.dependencies.database.max_connections).toEqual(100);
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);
    });
  });
});
