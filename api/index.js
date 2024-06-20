const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();

const yelpApiKey = process.env.YELP_API_KEY;

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

    const businessesWithPhotos = await Promise.all(
      response.data.businesses.map(async (business) => {
        const businessDetails = await axios.get(
          `https://api.yelp.com/v3/businesses/${business.id}`,
          {
            headers: { Authorization: `Bearer ${yelpApiKey}` },
          }
        );
        return { ...business, photos: businessDetails.data.photos };
      })
    );

    res.json({ businesses: businessesWithPhotos });
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
