import webserver from "infra/webserver";
import activation from "models/activation";
import user from "models/user";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails()
});


describe("Use case: Registration Flow (all successful)", () => {
  let createdUser;
  let tokenUUID;
  let createSessionResponseBody;

  test("Create user account", async () => {
    const response = await fetch("http://localhost:3000/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "RegistrationFlow",
        email: "flow.registration@email.com",
        password: "senha123",
      }),
    });
    expect(response.status).toBe(201);

    createdUser = await response.json();

    expect(createdUser).toEqual({
      id: createdUser.id,
      username: "RegistrationFlow",
      features: ["read:activation_token"],
      created_at: createdUser.created_at,
      updated_at: createdUser.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const activationEmail = await orchestrator.getLastEmail()

    expect(activationEmail.sender).toBe("<contato@kerscher.dev.br>");
    expect(activationEmail.recipients[0]).toBe("<flow.registration@email.com>");
    expect(activationEmail.subject).toBe("Ative seu cadastro no Clone do TabNews!");
    expect(activationEmail.text).toContain("RegistrationFlow");

    tokenUUID = orchestrator.extractUUID(activationEmail.text);
    const activationToken = await activation.findOneValidById(tokenUUID)

    expect(activationEmail.text).toContain(`${webserver.origin}/cadastro/ativar${activationToken.id}`)
    expect(activationToken.user_id).toBe(createdUser.id)
    expect(activationToken.used_at).toBe(null)
  });

  test("Activate account", async () => {
    const activationResponse = await fetch(`http://localhost:3000/api/v1/activations/${tokenUUID}`, {
      method: "PATCH",
    });

    expect(activationResponse.status).toBe(200)

    const activationResponseBody = await activationResponse.json()

    expect(Date.parse(activationResponseBody.used_at)).not.toBeNaN()

    const activatedUser = await user.findOneByUsername("RegistrationFlow")
    expect(activatedUser.features).toEqual(["read:session", "create:session", "update:user"])
  });

  test("Login", async () => {
    const createSessionResponse = await fetch("http://localhost:3000/api/v1/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "flow.registration@email.com",
        password: "senha123",
      }),
    });

    expect(createSessionResponse.status).toBe(201);

    createSessionResponseBody = await createSessionResponse.json();

    expect(createSessionResponseBody.user_id).toBe(createdUser.id)
  });

  test("Get user information", async () => {
    const userResponse = await fetch("http://localhost:3000/api/v1/user", {
      headers: {
        Cookie: `session_id=${createSessionResponseBody.token}`,
      },
    });

    expect(userResponse.status).toBe(200);

    const userResponseBody = await userResponse.json()

    expect(userResponseBody.id).toBe(createdUser.id)
  });
});

