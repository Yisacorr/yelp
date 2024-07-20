const { createClient } = require("@supabase/supabase-js");
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const cron = require("node-cron");

const app = express();
const yelpApiKey = process.env.YELP_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Supabase URL and Key must be provided as environment variables"
  );
  process.exit(1);
}

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key:", supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the Yelp Proxy Server!");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Yelp API endpoint to fetch restaurant data
app.get("/api/restaurants", async (req, res) => {
  const { latitude, longitude, category, searchQuery, location } = req.query;

  try {
    const params = {
      latitude,
      longitude,
      location,
      term: searchQuery,
      categories: category,
      limit: 15,
    };

    Object.keys(params).forEach((key) => {
      if (params[key] === undefined || params[key] === "") {
        delete params[key];
      }
    });

    console.log("Requesting Yelp with params:", params);

    const response = await axios.get(
      "https://api.yelp.com/v3/businesses/search",
      {
        headers: { Authorization: `Bearer ${yelpApiKey}` },
        params: params,
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(
      "Error fetching data from Yelp:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      message: "Error fetching data from Yelp",
      details: error.response ? error.response.data : error.message,
    });
  }
});

// Yelp API endpoint to fetch business details
app.get("/api/yelp/business/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`Fetching details for restaurant ID: ${id}`);

  try {
    const response = await axios.get(
      `https://api.yelp.com/v3/businesses/${id}`,
      {
        headers: { Authorization: `Bearer ${yelpApiKey}` },
      }
    );

    console.log("Response from Yelp:", response.data);
    res.json(response.data); // Return the entire business details
  } catch (error) {
    console.error(
      "Error fetching business details from Yelp:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      message: "Error fetching business details from Yelp",
      details: error.response ? error.response.data : error.message,
    });
  }
});

// Yelp API endpoint to fetch location suggestions
app.get("/api/location-suggestions", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

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

// Yelp API endpoint to fetch name suggestions
app.get("/api/name-suggestions", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

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
    }));

    res.json(suggestions);
  } catch (error) {
    console.error("Error fetching name suggestions from Yelp:", error);
    res.status(500).json({ error: "Failed to fetch name suggestions" });
  }
});

// Keep-alive endpoint
app.get("/keep-alive", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("experiences")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Error keeping the database alive:", error);
      res.status(500).json({ error });
    } else {
      console.log("Keep alive query successful:", data);
      res.json({ message: "Keep alive query successful", data });
    }
  } catch (error) {
    console.error("Error executing keep alive query:", error);
    res.status(500).json({ error });
  }
});

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
