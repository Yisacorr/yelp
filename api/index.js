const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const yelpApiKey = process.env.YELP_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

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

// Keep-alive endpoint
app.get("/keep-alive", async (req, res) => {
  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "Supabase URL and Key must be provided as environment variables"
    );
    res
      .status(500)
      .json({
        error: "Supabase URL and Key must be provided as environment variables",
      });
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

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
