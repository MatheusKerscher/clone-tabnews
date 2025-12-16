import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";

import orchestrator from "tests/orchestrator.js";
import session from "models/session";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/user", () => {
  describe("Default user", () => {
    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithValidSession",
      });

      const createdSession = await orchestrator.createSession(createdUser.id);

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      });

      expect(response.status).toBe(200);

      const cacheControlHeader = response.headers.get("Cache-Control");
      expect(cacheControlHeader).toBe(
        "no-store,no-cache,max-age=0,must-revalidate",
      );

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      // Session renewal assertions
      const renewedSession = await session.findOneValidByToken(
        createdSession.token,
      );

      expect(renewedSession.expires_at > createdSession.expires_at).toEqual(
        true,
      );
      expect(renewedSession.updated_at > createdSession.updated_at).toEqual(
        true,
      );

      //Set-Cookie assertions
      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        httpOnly: true,
        maxAge: session.EXPIRES_IN_MILLISECONDS / 1000,
        path: "/",
        value: createdSession.token,
      });
    });

    test("With valid session created 15 days ago", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRES_IN_MILLISECONDS / 2),
      });

      const createdUser = await orchestrator.createUser({
        username: "User15DaysValidSession",
      });

      const createdSession = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      // Session created 15 days ago assertions
      const sessionExpiresAt = createdSession.expires_at;
      const now = new Date(Date.now());

      sessionExpiresAt.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);

      // Transform milliseconds in days
      expect((sessionExpiresAt - now) / 1000 / 60 / 60 / 24).toBe(15);

      // Session renewal assertions
      const renewedSession = await session.findOneValidByToken(
        createdSession.token,
      );

      expect(renewedSession.expires_at > createdSession.expires_at).toEqual(
        true,
      );
      expect(renewedSession.updated_at > createdSession.updated_at).toEqual(
        true,
      );

      //Set-Cookie assertions
      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        httpOnly: true,
        maxAge: session.EXPIRES_IN_MILLISECONDS / 1000,
        path: "/",
        value: createdSession.token,
      });
    });

    test("With nonexistent session", async () => {
      const sessionToken =
        "5a1fc65dcaa73d58260def60df307d6dec673cf707f0f168e9a5f8ba31a6d9b3867a1f228b507c223f0119f3ad5e9b14";

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${sessionToken}`,
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      });
    });

    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRES_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithExpiredSession",
      });

      const createdSession = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      });
    });
  });
});
