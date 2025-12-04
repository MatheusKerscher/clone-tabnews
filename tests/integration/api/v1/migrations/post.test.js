import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
});

const runMigrationsByAPI = async () => {
  const response = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });

  return response;
};

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    describe("Running pending migrations", () => {
      test("For the first time", async () => {
        const response1 = await runMigrationsByAPI();

        expect(response1.status).toBe(201);

        const responseBody1 = await response1.json();
        expect(Array.isArray(responseBody1)).toBe(true);
        expect(responseBody1.length).toBeGreaterThanOrEqual(1);
      });

      test("For the second time", async () => {
        const response2 = await runMigrationsByAPI();

        expect(response2.status).toBe(200);

        const responseBody2 = await response2.json();
        expect(Array.isArray(responseBody2)).toBe(true);
        expect(responseBody2.length).toBe(0);
      });
    });
  });
});
