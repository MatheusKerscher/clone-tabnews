import { version as uuidVersion } from "uuid";

import password from "models/password";
import user from "models/user";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With new 'password'", async () => {
      const createdUser = await orchestrator.createUser();

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: "strongpassword",
          }),
        },
      );
      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        message: "Você não possui permissão para executar essa ação.",
        action: "Verifique se o seu usuário tem a autorização \"update:user\".",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  })

  describe("Default user", () => {
    test("With nonexistent 'username'", async () => {
      const user = await orchestrator.createUser();
      await orchestrator.activateUser(user.id)
      const userSessionObject = await orchestrator.createSession(user.id)

      const response = await fetch(
        "http://localhost:3000/api/v1/users/NonExistentUsername",
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${userSessionObject.token}`
          },
          body: JSON.stringify({
            username: "newusername",
          }),
        },
      );
      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "o username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
        status_code: 404,
      });
    });

    test("With duplicated 'username'", async () => {
      const createdUser1 = await orchestrator.createUser();

      const createdUser2 = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser2.id)
      const user2SessionObject = await orchestrator.createSession(createdUser2.id)

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${user2SessionObject.token}`
          },
          body: JSON.stringify({
            username: createdUser1.username,
          }),
        },
      );
      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O username informado já está sendo utilizado.",
        action: "Utilize outro username para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With duplicated 'email'", async () => {
      const createdUser1 = await orchestrator.createUser();
      const createdUser2 = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser2.id)
      const user2SessionObject = await orchestrator.createSession(createdUser2.id)

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${user2SessionObject.token}`
          },
          body: JSON.stringify({
            email: createdUser1.email,
          }),
        },
      );
      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O e-mail informado já está sendo utilizado.",
        action: "Utilize outro e-mail para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With 'userA' targeting 'userB'", async () => {
      const createdUser1 = await orchestrator.createUser({
        username: "userA"
      });
      const createdUser2 = await orchestrator.createUser({
        username: "userB"
      });
      await orchestrator.activateUser(createdUser2.id)
      const user2SessionObject = await orchestrator.createSession(createdUser2.id)

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser1.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${user2SessionObject.token}`
          },
          body: JSON.stringify({
            username: "userC",
          }),
        },
      );
      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para atualizar outro usuário.",
        action: "Verifique se você possui a feature necessária para atualizar outro usuário.",
        status_code: 403,
      });
    });

    test("With unique 'username'", async () => {
      const createdUser = await orchestrator.createUser({
        username: "uniqueUsername",
      });
      await orchestrator.activateUser(createdUser.id)
      const userSessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        "http://localhost:3000/api/v1/users/uniqueusername",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userSessionObject.token}`
          },
          body: JSON.stringify({
            username: "UniqueUsername",
          }),
        },
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "UniqueUsername",
        features: ["read:session", "create:session", "update:user"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With unique 'email'", async () => {
      const createdUser = await orchestrator.createUser({
        email: "uniqueemail@gmail.com",
      });
      await orchestrator.activateUser(createdUser.id)
      const userSessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userSessionObject.token}`
          },
          body: JSON.stringify({
            email: "newuniqueemail@gmail.com",
          }),
        },
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: createdUser.username,
        features: ["read:session", "create:session", "update:user"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With new 'password'", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser.id)
      const userSessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userSessionObject.token}`
          },
          body: JSON.stringify({
            password: "strongpassword",
          }),
        },
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: createdUser.username,
        features: ["read:session", "create:session", "update:user"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const userInDatabase = await user.findOneByUsername(createdUser.username);

      const correctPasswordMatch = await password.compare(
        "strongpassword",
        userInDatabase.password,
      );

      const incorrectPasswordMatch = await password.compare(
        "senha123",
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });

    test("With same 'username' but different case", async () => {
      const createdUser = await orchestrator.createUser({
        username: "usercase1",
      });
      await orchestrator.activateUser(createdUser.id)
      const userSessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        "http://localhost:3000/api/v1/users/usercase1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userSessionObject.token}`
          },
          body: JSON.stringify({
            username: "UserCase1",
          }),
        },
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "UserCase1",
        features: ["read:session", "create:session", "update:user"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
  });

  describe("Privileged user", () => {
    test("With 'update:user:other' targeting 'default user'", async () => {
      const defaultUser = await orchestrator.createUser()

      const privilegedUser = await orchestrator.createUser()
      await orchestrator.activateUser(privilegedUser.id)
      await orchestrator.addFeaturesToUser(privilegedUser.id, ["update:user:others"])
      const privilegedUserSession = await orchestrator.createSession(privilegedUser.id)

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${defaultUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${privilegedUserSession.token}`
          },
          body: JSON.stringify({
            username: "AlteradoPorPrivilegiado",
          }),
        },
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: defaultUser.id,
        username: "AlteradoPorPrivilegiado",
        features: defaultUser.features,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    })
  })
});
