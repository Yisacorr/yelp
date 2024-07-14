// cronJob.js

const { createClient } = require("@supabase/supabase-js");
const cron = require("node-cron");

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to perform the keep-alive task
const keepAlive = async () => {
  try {
    // This can be any simple query that keeps the database active
    const { data, error } = await supabase
      .from("experiences")
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
