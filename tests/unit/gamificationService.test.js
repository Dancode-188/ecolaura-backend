const gamificationService = require("../../src/services/gamificationService");
const { User } = require("../../src/models");

jest.mock("../../src/models");
jest.mock("../../src/services/notificationService");

describe("Gamification Service", () => {
  test("awardPoints increases user points and levels up when appropriate", async () => {
    const mockUser = {
      id: 1,
      sustainabilityPoints: 50,
      level: 1,
      save: jest.fn(),
    };
    User.findByPk.mockResolvedValue(mockUser);

    await gamificationService.awardPoints(1, 60, "test reason");

    expect(mockUser.sustainabilityPoints).toBe(110);
    expect(mockUser.level).toBe(2);
    expect(mockUser.save).toHaveBeenCalled();
  });
});
