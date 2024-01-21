const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const yelpApiKey = process.env.yelpApiKey;

app.use(cors());

app.get("/", (req, res) => {
  res.send("Welcome to the Yelp Proxy Server!");
});

app.get("/api/restaurants", async (req, res) => {
  const latitude = req.query.latitude;
  const longitude = req.query.longitude;

  if (!latitude || !longitude) {
    return res
      .status(400)
      .json({ message: "Location required" });
  }

  try {
    const response = await axios.get(
      "https://api.yelp.com/v3/businesses/search",
      {
        headers: {
          Authorization: `Bearer U45r0s0HJ09NC_XDq7mqffd-xFFDIaMdZr6IPQqzJbIUY13aYWSpmxNRNbxXZSTXBP1zRW7Y42qqMsR1eehYFy7fy63MNQm_MwHQs3ZsHfcRGYkYwl9Ra5HzcHarZXYx`,
        },
        params: {
          latitude: latitude,
          longitude: longitude,
          categories: "restaurants",
          limit: 20,
        },
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
