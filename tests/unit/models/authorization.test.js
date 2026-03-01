const { InternalServerError } = require("infra/errors");
const { default: authorization } = require("models/authorization");

describe("models/authorization.js", () => {
  describe(".can()", () => {
    test("Without 'user'", () => {
      expect(() => {
        authorization.can();
      }).toThrow(InternalServerError);
    });

    test("Without 'user.features'", () => {
      const createUser = {
        username: "semFeatures",
      };

      expect(() => {
        authorization.can(createUser);
      }).toThrow(InternalServerError);
    });

    test("Without unknown 'feature'", () => {
      const createUser = {
        features: ["read:user"],
      };

      expect(() => {
        authorization.can(createUser, "unknown:object");
      }).toThrow(InternalServerError);
    });

    test("With valid 'user' and known 'feature'", () => {
      const createUser = {
        features: ["read:user"],
      };

      expect(authorization.can(createUser, "read:user")).toBe(true);
    });
  });

  describe(".filterOutput()", () => {
    test("Without 'user'", () => {
      expect(() => {
        authorization.filterOutput();
      }).toThrow(InternalServerError);
    });

    test("Without 'user.features'", () => {
      const createUser = {
        username: "semFeatures",
      };

      expect(() => {
        authorization.filterOutput(createUser);
      }).toThrow(InternalServerError);
    });

    test("With unknown 'feature'", () => {
      const createUser = {
        features: ["read:user"],
      };

      expect(() => {
        authorization.filterOutput(createUser, "unknown:object");
      }).toThrow(InternalServerError);
    });

    test("With valid 'user', known 'feature' but no 'resource'", () => {
      const createUser = {
        features: ["read:user"],
      };

      expect(() => {
        authorization.filterOutput(createUser, "read:user");
      }).toThrow(InternalServerError);
    });

    test("With valid 'user', known 'feature' and 'resource'", () => {
      const createUser = {
        features: ["read:user"],
      };

      const resource = {
        id: 1,
        username: "resource",
        features: ["create:user"],
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        email: "resource@email.com",
        password: "resource1234",
      };

      const result = authorization.filterOutput(
        createUser,
        "read:user",
        resource,
      );

      expect(result).toEqual({
        id: 1,
        username: "resource",
        features: ["create:user"],
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      });
    });
  });
});
