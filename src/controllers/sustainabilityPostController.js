const { SustainabilityPost, User, Comment } = require("../models");
const notificationService = require("../services/notificationService");

exports.createPost = async (req, res) => {
  try {
    const { title, content, type } = req.body;
    const userId = req.session.getUserId();

    const post = await SustainabilityPost.create({
      title,
      content,
      type,
      UserId: userId,
    });

    res.status(201).json(post);
  } catch (error) {
    console.error("Error creating sustainability post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const posts = await SustainabilityPost.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "name"],
        },
        {
          model: Comment,
          include: [
            {
              model: User,
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(posts);
  } catch (error) {
    console.error("Error fetching sustainability posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await SustainabilityPost.findByPk(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    await post.increment("likes");
    res.json({ likes: post.likes + 1 });
  } catch (error) {
    console.error("Error liking sustainability post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.session.getUserId();

    const post = await SustainabilityPost.findByPk(id, {
      include: [{ model: User }],
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = await Comment.create({
      content,
      UserId: userId,
      SustainabilityPostId: id,
    });

    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          attributes: ["id", "name"],
        },
      ],
    });

    // Send notification to the post owner if it's not their own comment
    if (post.User.id !== userId) {
      await notificationService.sendNotification(
        post.User.id,
        `${commentWithUser.User.name} commented on your sustainability post: "${post.title}"`,
        "comment"
      );
    }

    res.status(201).json(commentWithUser);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};