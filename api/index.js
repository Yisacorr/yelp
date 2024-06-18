require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();

const yelpApiKey = process.env.YELP_API_KEY;

app.use(
  cors({
    origin: "*", // Change this to the specific origin if you want to restrict access
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json()); // To parse JSON bodies

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

    console.log("Requesting Yelp with params:", params); // Added for debugging

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

app.get("/api/yelp/photos/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`Fetching photos for restaurant ID: ${id}`); // Log the ID

  try {
    const response = await axios.get(
      `https://api.yelp.com/v3/businesses/${id}`,
      {
        headers: { Authorization: `Bearer ${yelpApiKey}` },
      }
    );

    console.log("Response from Yelp:", response.data); // Log the response data
    res.json(response.data.photos);
  } catch (error) {
    console.error(
      "Error fetching photos from Yelp:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      message: "Error fetching photos from Yelp",
      details: error.response ? error.response.data : error.message,
    });
  }
});
