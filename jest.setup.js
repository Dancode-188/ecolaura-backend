jest.mock("./src/config/database", () => ({
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(),
    sync: jest.fn().mockResolvedValue(),
  },
}));