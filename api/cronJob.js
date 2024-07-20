const { createClient } = require("@supabase/supabase-js");
const express = require("express");
const axios = require("axios");
const cron = require("node-cron");

const app = express();
const PORT = process.env.PORT || 3000;

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

// Middleware to parse JSON bodies
app.use(express.json());

// Yelp API endpoint to fetch location suggestions
app.get("/api/location-suggestions", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  const yelpApiKey = process.env.YELP_API_KEY;

  if (!yelpApiKey) {
    return res.status(500).json({ error: "Yelp API key not configured" });
  }

  try {
    const response = await axios.get(
      "https://api.yelp.com/v3/businesses/search",
      {
        headers: {
          Authorization: `Bearer ${yelpApiKey}`,
        },
        params: {
          term: query,
          location: "US", // Default location, you can customize this as needed
          limit: 5,
        },
      }
    );

    const suggestions = response.data.businesses.map((business) => ({
      name: business.name,
      address: business.location.display_address.join(", "),
    }));

    res.json(suggestions);
  } catch (error) {
    console.error("Error fetching location suggestions from Yelp:", error);
    res.status(500).json({ error: "Failed to fetch location suggestions" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
