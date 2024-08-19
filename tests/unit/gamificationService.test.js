const {
  User,
  Achievement,
  Order,
  Review,
  SustainabilityGoal,
} = require("../../src/models");
const gamificationService = require("../../src/services/gamificationService");
const notificationService = require("../../src/services/notificationService");

// Mocks
jest.mock("../../src/models", () => ({
  User: {
    findByPk: jest.fn(),
  },
  Achievement: {
    findAll: jest.fn(),
  },
  Order: {
    count: jest.fn(),
  },
  Review: {
    count: jest.fn(),
  },
  SustainabilityGoal: {
    count: jest.fn(),
  },
}));

jest.mock("../../src/services/notificationService", () => ({
  sendNotification: jest.fn(),
}));

describe("Gamification Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("awardPoints", () => {
    it("should award points to a user", async () => {
      const mockUser = {
        id: "1",
        sustainabilityPoints: 50,
        level: 1,
        save: jest.fn(),
      };
      User.findByPk.mockResolvedValue(mockUser);

      const result = await gamificationService.awardPoints(
        "1",
        30,
        "test reason"
      );

      expect(mockUser.sustainabilityPoints).toBe(80);
      expect(mockUser.save).toHaveBeenCalled();
      expect(notificationService.sendNotification).toHaveBeenCalledWith(
        "1",
        "You've earned 30 sustainability points for test reason!",
        "points_earned"
      );
      expect(result).toEqual(mockUser);
    });

    it("should level up user when enough points are earned", async () => {
      const mockUser = {
        id: "1",
        sustainabilityPoints: 90,
        level: 1,
        save: jest.fn(),
      };
      User.findByPk.mockResolvedValue(mockUser);

      await gamificationService.awardPoints("1", 20, "test reason");

      expect(mockUser.sustainabilityPoints).toBe(110);
      expect(mockUser.level).toBe(2);
      expect(notificationService.sendNotification).toHaveBeenCalledWith(
        "1",
        "Congratulations! You've reached level 2!",
        "level_up"
      );
    });

    it("should throw an error if user is not found", async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(
        gamificationService.awardPoints("999", 10, "test")
      ).rejects.toThrow("User not found");
    });
  });

  describe("checkAchievements", () => {
    it("should check and award new achievements", async () => {
      const mockUser = {
        id: "1",
        achievements: [1],
        sustainabilityPoints: 100,
        save: jest.fn(),
      };
      const mockAchievements = [
        { id: 1, name: "Old Achievement", pointValue: 10 },
        { id: 2, name: "New Achievement", pointValue: 20 },
      ];
      User.findByPk.mockResolvedValue(mockUser);
      Achievement.findAll.mockResolvedValue(mockAchievements);

      // Mock that the user has met the criteria for the new achievement
      gamificationService.hasMetAchievementCriteria = jest
        .fn()
        .mockResolvedValue(true);

      const result = await gamificationService.checkAchievements("1");

      expect(result).toEqual([mockAchievements[1]]);
      expect(mockUser.achievements).toContain(2);
      expect(mockUser.sustainabilityPoints).toBe(120);
      expect(notificationService.sendNotification).toHaveBeenCalledWith(
        "1",
        'You\'ve earned the "New Achievement" achievement and 20 points!',
        "achievement_earned"
      );
    });

    it("should not award already earned achievements", async () => {
      const mockUser = {
        id: "1",
        achievements: [1, 2],
        sustainabilityPoints: 100,
        save: jest.fn(),
      };
      const mockAchievements = [
        { id: 1, name: "Old Achievement", pointValue: 10 },
        { id: 2, name: "Already Earned", pointValue: 20 },
      ];
      User.findByPk.mockResolvedValue(mockUser);
      Achievement.findAll.mockResolvedValue(mockAchievements);

      const result = await gamificationService.checkAchievements("1");

      expect(result).toEqual([]);
      expect(mockUser.sustainabilityPoints).toBe(100);
      expect(notificationService.sendNotification).not.toHaveBeenCalled();
    });
  });

  describe("hasMetAchievementCriteria", () => {
    const mockUser = { id: "1" };

    it('should check "First Purchase" achievement', async () => {
      const achievement = { name: "First Purchase" };
      Order.count.mockResolvedValue(1);

      const result = await gamificationService.hasMetAchievementCriteria(
        mockUser,
        achievement
      );

      expect(result).toBe(true);
    });

    it('should check "Eco Warrior" achievement', async () => {
      const achievement = { name: "Eco Warrior" };
      const mockUserWithPoints = { id: "1", sustainabilityPoints: 1000 };

      const result = await gamificationService.hasMetAchievementCriteria(
        mockUserWithPoints,
        achievement
      );

      expect(result).toBe(true);
    });

    it('should check "Review Master" achievement', async () => {
      const achievement = { name: "Review Master" };
      Review.count.mockResolvedValue(10);

      const result = await gamificationService.hasMetAchievementCriteria(
        mockUser,
        achievement
      );

      expect(result).toBe(true);
    });

    // Add more tests for other achievement types...

    it("should return true for unknown achievement", async () => {
      const achievement = { name: "Unknown Achievement" };

      const result = await gamificationService.hasMetAchievementCriteria(
        mockUser,
        achievement
      );

      expect(result).toBe(true);
    });
  });
});
