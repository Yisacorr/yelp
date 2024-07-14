const cron = require("node-cron");

const keepAlive = () => {
  console.log("Running the keep-alive task...");
};

// Schedule the task to run every 3 days
cron.schedule("0 0 */3 * *", () => {
  console.log("Running the keep-alive task...");
  keepAlive();
});

console.log("Cron job scheduled to run every 3 days.");
