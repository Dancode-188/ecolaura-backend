const {
  verifySession,
} = require("supertokens-node/recipe/session/framework/express");

const requireAuth = verifySession();

module.exports = { requireAuth };
