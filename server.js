require("dotenv").config();
const app = require("./src/app");
const { sequelize, syncDatabase } = require("./src/config/database");
const cron = require("node-cron");
const notificationService = require("./src/services/notificationService");

const PORT = process.env.PORT || 3000;

async function assertDatabaseConnectionOk() {
  console.log(`Checking database connection...`);
  try {
    await sequelize.authenticate();
    console.log("Database connection OK!");
  } catch (error) {
    console.log("Unable to connect to the database:");
    console.log(error.message);
    process.exit(1);
  }
}

async function init() {
  await assertDatabaseConnectionOk();
  await syncDatabase();

  console.log(`Starting Sequelize + Express example on port ${PORT}...`);

  app.listen(PORT, () => {
    console.log(`Express server started on port ${PORT}.`);
  });

  // Schedule the cron job to run daily at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("Running daily check for upcoming deliveries");
    await notificationService.checkUpcomingDeliveries();
  });
}

init();
