const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const fsqDevelopers = require("@api/fsq-developers");

const app = express();
const yelpApiKey = process.env.YELP_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const foursquareApiKey = process.env.FOURSQUARE_API_KEY;

if (!supabaseUrl || !supabaseKey || !foursquareApiKey) {
  console.error(
    "Supabase URL, Key, and Foursquare API Key must be provided as environment variables"
  );
  process.exit(1);
}

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key:", supabaseKey);
console.log("Foursquare API Key:", foursquareApiKey);

const supabase = createClient(supabaseUrl, supabaseKey);

fsqDevelopers.auth(foursquareApiKey);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the API Proxy Server!");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log("Server running on port ${PORT}"));

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
  console.log("Fetching details for restaurant ID: ${id}");

  try {
    const response = await axios.get(
      https://api.yelp.com/v3/businesses/${id},
      {
        headers: { Authorization: `Bearer ${yelpApiKey}` },
      }
    );

    console.log("Response from Yelp:", response.data);
    res.json(response.data);
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

// Endpoint for fetching Foursquare venue ID
app.get("/api/foursquare-venue-id", async (req, res) => {
  const { name, latitude, longitude } = req.query;

  if (!name || !latitude || !longitude) {
    return res.status(400).json({
      error:
        "Query parameters 'name', 'latitude', and 'longitude' are required",
    });
  }

  console.log(
    "Fetching Foursquare venue ID for name: ${name}, latitude: ${latitude}, longitude: ${longitude}"
  );

  try {
    const response = await axios.get(
      "https://api.foursquare.com/v3/places/search",
      {
        headers: {
          Authorization: `Bearer ${foursquareApiKey}`,
        },
        params: {
          query: name,
          ll:"${latitude},${longitude}",
          limit: 1,
        },
      }
    );

    if (response.data.results.length > 0) {
      const venueId = response.data.results[0].fsq_id;
      console.log("Found venue ID: ${venueId}");
      res.json({ venueId });
    } else {
      console.log("No venue found");
      res.status(404).json({ error: "Venue not found" });
    }
  } catch (error) {
    console.error("Error fetching Foursquare venue ID:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
    res.status(500).json({ error: "Failed to fetch Foursquare venue ID" });
  }
});

// Endpoint for fetching menu from Foursquare
app.get("/api/menu", async (req, res) => {
  const { venueId } = req.query;

  if (!venueId) {
    return res
      .status(400)
      .json({ error: "Query parameter 'venueId' is required" });
  }

  console.log("Fetching menu for venue ID: ${venueId}");

  try {
    const response = await fsqDevelopers.placeDetails({ fsq_id: venueId });
    console.log("Response from Foursquare:", response.data);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching menu from Foursquare:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
    res.status(500).json({ error: "Failed to fetch menu" });
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