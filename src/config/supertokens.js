const supertokens = require("supertokens-node");
const Session = require("supertokens-node/recipe/session");
const EmailPassword = require("supertokens-node/recipe/emailpassword");
const {
  middleware,
  errorHandler,
} = require("supertokens-node/framework/express");

supertokens.init({
  framework: "express",
  supertokens: {
    connectionURI: process.env.SUPERTOKENS_CONNECTION_URI,
    apiKey: process.env.SUPERTOKENS_API_KEY,
  },
  appInfo: {
    appName: "Ecolaura",
    apiDomain: process.env.API_DOMAIN || "http://localhost:3000",
    websiteDomain: process.env.WEBSITE_DOMAIN || "http://localhost:3000",
    apiBasePath: "/auth",
    websiteBasePath: "/auth",
  },
  recipeList: [EmailPassword.init(), Session.init()],
});

module.exports = {
  middleware,
  errorHandler,
  getAllCORSHeaders: supertokens.getAllCORSHeaders,
  EmailPassword,
  Session,
};
