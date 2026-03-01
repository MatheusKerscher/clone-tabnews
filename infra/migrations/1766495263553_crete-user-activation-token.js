exports.up = (pgm) => {
  pgm.createTable("user_activation_tokens", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    user_id: {
      type: "uuid",
      notNull: true,
      // Why not use a FK? Because I wanna see the consequences
    },

    // Why timestamp with timezone? https://justatheory.com/2012/04/postgres-use-timestamptz/
    used_at: {
      type: "timestamptz",
      notNull: false,
    },

    expires_at: {
      type: "timestamptz",
      notNull: true,
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', NOW())"),
    },

    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', NOW())"),
    },
  });
};

exports.down = false;
