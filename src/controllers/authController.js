const {
  emailPasswordSignUp,
  emailPasswordSignIn,
} = require("supertokens-node/recipe/emailpassword");
const Session = require("supertokens-node/recipe/session");

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const signUpResponse = await emailPasswordSignUp(email, password);

    if (signUpResponse.status === "OK") {
      return res.status(200).json({ message: "User registered successfully" });
    } else {
      return res.status(400).json({ message: signUpResponse.status });
    }
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const signInResponse = await emailPasswordSignIn(email, password);

    if (signInResponse.status === "OK") {
      await Session.createNewSession(req, res, signInResponse.user.id);
      return res.status(200).json({ message: "User logged in successfully" });
    } else {
      return res.status(400).json({ message: signInResponse.status });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
