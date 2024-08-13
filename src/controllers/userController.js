const { User } = require("../models");

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.session.getUserId());
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const [updatedRows] = await User.update(req.body, {
      where: { id: req.session.getUserId() },
    });
    if (updatedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
