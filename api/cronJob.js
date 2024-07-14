// cronJob.js

const { createClient } = require("@supabase/supabase-js");
const cron = require("node-cron");

// Initialize Supabase client
const supabaseUrl = "https://your-project-url.supabase.co";
const supabaseKey = "public-anon-key";
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to perform the keep-alive task
const keepAlive = async () => {
  try {
    // This can be any simple query that keeps the database active
    const { data, error } = await supabase
      .from("your_table")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Error keeping the database alive:", error);
    } else {
      console.log("Keep alive query successful:", data);
    }
  } catch (error) {
    console.error("Error executing keep alive query:", error);
  }
};

// Schedule the task to run every 3 days
cron.schedule("0 0 */3 * *", () => {
  console.log("Running the keep-alive task...");
  keepAlive();
});
