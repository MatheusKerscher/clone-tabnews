import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Retrieving pending migrations", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations");

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action:
          'Verifique se o seu usuário tem a autorização "read:migration".',
        message: "Você não possui permissão para executar essa ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("Retrieving pending migrations", async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser.id);
      const defaultUserSession = await orchestrator.createSession(
        defaultUser.id,
      );

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${defaultUserSession.token}`,
        },
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action:
          'Verifique se o seu usuário tem a autorização "read:migration".',
        message: "Você não possui permissão para executar essa ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Privileged user", () => {
    test("Retrieving pending migrations", async () => {
      const privilegedUser = await orchestrator.createUser();
      await orchestrator.activateUser(privilegedUser.id);
      await orchestrator.addFeaturesToUser(privilegedUser.id, [
        "read:migration",
      ]);
      const privilegedUserSession = await orchestrator.createSession(
        privilegedUser.id,
      );

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${privilegedUserSession.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(Array.isArray(responseBody)).toBe(true);
    });
  });
});
