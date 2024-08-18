const request = require("supertest");
const express = require("express");
const { SustainabilityPost, User, Comment } = require("../../src/models");
const notificationService = require("../../src/services/notificationService");

// Mocks
jest.mock("../../src/models", () => ({
  SustainabilityPost: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    increment: jest.fn(),
    reload: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
  },
  Comment: {
    create: jest.fn(),
    findByPk: jest.fn(),
  },
}));
jest.mock("../../src/services/notificationService");

// Mock session
const mockSession = {
  getUserId: jest.fn().mockReturnValue("mockUserId"),
};

// Mock auth middleware
jest.mock("../../src/middlewares/authMiddleware", () => ({
  requireAuth: (req, res, next) => {
    req.session = mockSession;
    next();
  },
}));

const app = express();
const sustainabilityPostRoutes = require("../../src/routes/sustainabilityPostRoutes");

app.use(express.json());
app.use("/community", sustainabilityPostRoutes);

describe("Sustainability Post Routes", () => {
    const originalConsoleError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalConsoleError;
    });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /community", () => {
    it("should create a new sustainability post", async () => {
      const mockPost = {
        id: 1,
        title: "Test Post",
        content: "Test Content",
        type: "goal",
      };
      SustainabilityPost.create.mockResolvedValue(mockPost);

      const res = await request(app)
        .post("/community")
        .send({ title: "Test Post", content: "Test Content", type: "goal" });

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(mockPost);
    });

    it("should handle errors when creating a post", async () => {
      SustainabilityPost.create.mockRejectedValue(new Error("Database error"));

      const res = await request(app)
        .post("/community")
        .send({ title: "Test Post", content: "Test Content", type: "goal" });

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: "Internal server error" });
    });
  });

  describe("GET /community", () => {
    it("should return community posts", async () => {
      const mockPosts = [
        {
          id: 1,
          title: "Post 1",
          User: { id: 1, name: "User 1" },
          Comments: [],
        },
        {
          id: 2,
          title: "Post 2",
          User: { id: 2, name: "User 2" },
          Comments: [],
        },
      ];
      SustainabilityPost.findAll.mockResolvedValue(mockPosts);

      const res = await request(app).get("/community");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockPosts);
    });

    it("should handle errors when fetching posts", async () => {
      SustainabilityPost.findAll.mockRejectedValue(new Error("Database error"));

      const res = await request(app).get("/community");

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: "Internal server error" });
    });
  });

  describe("POST /community/:id/like", () => {
    it("should like a post", async () => {
      const mockPost = {
        id: 1,
        likes: 1,
        increment: jest.fn().mockResolvedValue({}),
        reload: jest.fn().mockImplementation(function () {
          this.likes += 1;
          return Promise.resolve(this);
        }),
      };
      SustainabilityPost.findByPk.mockResolvedValue(mockPost);

      const res = await request(app).post("/community/1/like");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ likes: 2 });
      expect(mockPost.increment).toHaveBeenCalledWith("likes");
      expect(mockPost.reload).toHaveBeenCalled();
    });

    it("should handle post not found when liking", async () => {
      SustainabilityPost.findByPk.mockResolvedValue(null);

      const res = await request(app).post("/community/999/like");

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ message: "Post not found" });
    });
  });

  describe("POST /community/:id/comment", () => {
    it("should add a comment to a post", async () => {
      const mockPost = {
        id: 1,
        title: "Test Post",
        User: { id: "postOwnerId" },
      };
      const mockComment = {
        id: 1,
        content: "Test Comment",
        User: { id: "mockUserId", name: "Commenter" },
      };
      SustainabilityPost.findByPk.mockResolvedValue(mockPost);
      Comment.create.mockResolvedValue(mockComment);
      Comment.findByPk.mockResolvedValue(mockComment);

      const res = await request(app)
        .post("/community/1/comment")
        .send({ content: "Test Comment" });

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(mockComment);
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });

    it("should not send notification for self-comment", async () => {
      const mockPost = {
        id: 1,
        title: "Test Post",
        User: { id: "mockUserId" },
      };
      const mockComment = {
        id: 1,
        content: "Test Comment",
        User: { id: "mockUserId", name: "Commenter" },
      };
      SustainabilityPost.findByPk.mockResolvedValue(mockPost);
      Comment.create.mockResolvedValue(mockComment);
      Comment.findByPk.mockResolvedValue(mockComment);

      const res = await request(app)
        .post("/community/1/comment")
        .send({ content: "Test Comment" });

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(mockComment);
      expect(notificationService.sendNotification).not.toHaveBeenCalled();
    });

    it("should handle post not found when commenting", async () => {
      SustainabilityPost.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .post("/community/999/comment")
        .send({ content: "Test Comment" });

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ message: "Post not found" });
    });
  });
});
