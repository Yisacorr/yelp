const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const yelpApiKey = process.env.YELP_API_KEY;

app.use(cors());
app.use(express.json()); // To parse JSON bodies

app.get("/", (req, res) => {
  res.send("Welcome to the Yelp Proxy Server!");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.get("/api/restaurants", async (req, res) => {
  const { latitude, longitude, category, searchQuery } = req.query;

  try {
    const params = {
      latitude,
      longitude,
      term: searchQuery, // `term` can be used to search for text within Yelp
      categories: category,
      limit: 10,
    };

    // Remove any undefined or empty parameters
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
      error.response || error.message
    );
    res.status(500).json({
      message: "Error fetching data from Yelp",
      details: error.message,
    });
  }
});
