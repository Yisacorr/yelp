const { createClient } = require("@supabase/supabase-js");
const cron = require("node-cron");

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Supabase URL and Key must be provided as environment variables"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to perform the keep-alive task
const keepAlive = async () => {
  try {
    console.log("Executing keep-alive query...");
    // This can be any simple query that keeps the database active
    const { data, error } = await supabase
      .from("experiences")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Error keeping the database alive:", error);
    } else {
      console.log("Keep-alive query successful:", data);
    }
  } catch (error) {
    console.error("Error executing keep-alive query:", error);
  }
};

// Schedule the task to run every 3 days
cron.schedule("0 0 */3 * *", () => {
  console.log("Running the keep-alive task...");
  keepAlive();
});

console.log("Cron job scheduled to run every 3 days.");
