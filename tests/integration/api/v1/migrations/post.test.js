import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

const runMigrationsByAPI = async (headers) => {
  const response = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
    headers
  });

  return response;
};

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Running pending migrations", async () => {
      const response = await runMigrationsByAPI();
      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action: "Verifique se o seu usuário tem a autorização \"create:migration\".",
        message: "Você não possui permissão para executar essa ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("Running pending migrations", async () => {
      const defaultUser = await orchestrator.createUser()
      await orchestrator.activateUser(defaultUser.id)
      const defaultUserSession = await orchestrator.createSession(defaultUser.id)

      const response = await runMigrationsByAPI({
        "Content-Type": "application/json",
        Cookie: `session_id=${defaultUserSession.token}`
      })

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action: "Verifique se o seu usuário tem a autorização \"create:migration\".",
        message: "Você não possui permissão para executar essa ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Privileged user", () => {
    test("With 'create:migration' running pending migrations", async () => {
      const privilegedUser = await orchestrator.createUser()
      await orchestrator.activateUser(privilegedUser.id)
      await orchestrator.addFeaturesToUser(privilegedUser.id, ["create:migration"])
      const privilegedUserSession = await orchestrator.createSession(privilegedUser.id)

      const response = await runMigrationsByAPI({
        "Content-Type": "application/json",
        Cookie: `session_id=${privilegedUserSession.token}`
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(Array.isArray(responseBody)).toBe(true);
    });
  });
});
