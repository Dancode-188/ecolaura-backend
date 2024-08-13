const express = require("express");
const router = express.Router();
const sustainabilityPostController = require("../controllers/sustainabilityPostController");
const { requireAuth } = require("../middlewares/authMiddleware");

router.post("/", requireAuth, sustainabilityPostController.createPost);
router.get("/", sustainabilityPostController.getPosts);
router.post("/:id/like", requireAuth, sustainabilityPostController.likePost);
router.post(
  "/:id/comment",
  requireAuth,
  sustainabilityPostController.addComment
);

module.exports = router;
