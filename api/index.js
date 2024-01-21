const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const yelpApiKey = process.env.YELP_API_KEY;

app.use(cors());

app.get("/", (req, res) => {
  res.send("Welcome to the Yelp Proxy Server!");
});

app.get("/api/restaurants", async (req, res) => {
  const { latitude, longitude, category } = req.query;

  try {
    const params = {
      latitude,
      longitude,
      categories: category, // Use the provided category
      limit: 10,
    };

    const response = await axios.get(
      "https://api.yelp.com/v3/businesses/search",
      {
        headers: { Authorization: `Bearer ${yelpApiKey}` },
        params: params,
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching data from Yelp:", error);
    res.status(500).json({ message: "Error fetching data from Yelp" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
