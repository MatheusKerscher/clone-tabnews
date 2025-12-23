import webserver from "infra/webserver";
import activation from "models/activation";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails()
});


describe("Use case: Registration Flow (all successful)", () => {
  let createdUser;

  test("Create user account", async () => {
    const response = await fetch("http://localhost:3000/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "FlowRegistration",
        email: "flow.registration@email.com",
        password: "senha123",
      }),
    });
    expect(response.status).toBe(201);

    createdUser = await response.json();

    expect(createdUser).toEqual({
      id: createdUser.id,
      username: "FlowRegistration",
      email: "flow.registration@email.com",
      features: ["read:activation_token"],
      password: createdUser.password,
      created_at: createdUser.created_at,
      updated_at: createdUser.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const activationEmail = await orchestrator.getLastEmail()

    expect(activationEmail.sender).toBe("<contato@kerscher.dev.br>");
    expect(activationEmail.recipients[0]).toBe("<flow.registration@email.com>");
    expect(activationEmail.subject).toBe("Ative seu cadastro no Clone do TabNews!");
    expect(activationEmail.text).toContain("FlowRegistration");

    const tokenUUID = orchestrator.extractUUID(activationEmail.text);
    const activationToken = await activation.findOneValidById(tokenUUID)

    expect(activationEmail.text).toContain(`${webserver.origin}/cadastro/ativar${activationToken.id}`)
    expect(activationToken.user_id).toBe(createdUser.id)
    expect(activationToken.used_at).toBe(null)
  });

  test("Activate account", async () => {
  });

  test("Login", async () => {
  });

  test("Get user information", async () => {
  });
});

