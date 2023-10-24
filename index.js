const express = require("express");
const axios = require("axios");
const querystring = require("querystring");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const app = express();
const port = 8080;

dotenv.config(); // Load environment variables

// Define your Spotify API credentials
const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;
const scope =
  "user-read-private user-read-email user-top-read app-remote-control"; // Add required scopes

app.use(bodyParser.urlencoded({ extended: true }));

// Add a route for the root URL ("/")
app.get("/", (req, res) => {
  res.send("Welcome to the Spotify User Authentication Example");
});

// Route for initiating the Spotify authorization process
app.get("/login", (req, res) => {
  const state = "some-random-state"; // Use a random state to enhance security

  // Construct the Spotify authorization URL
  const authUrl = `https://accounts.spotify.com/authorize?${querystring.stringify(
    {
      response_type: "code",
      client_id,
      scope,
      redirect_uri,
      state,
    }
  )}`;

  res.redirect(authUrl); // Redirect the user to the Spotify authorization page
});

// Route to handle the Spotify callback after user authorization
app.get("/callback", async (req, res) => {
  const code = req.query.code; // Extract the authorization code from the callback URL
  const state = req.query.state; // Check the state for security (optional)

  if (!code) {
    res.status(400).send("Authorization code not found");
    return;
  }

  // Exchange the authorization code for an access token
  try {
    const tokenResponse = await axios({
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      params: {
        code,
        redirect_uri,
        grant_type: "authorization_code",
      },
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${client_id}:${client_secret}`
        ).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const accessToken = tokenResponse.data.access_token;

    // Make a request to get the user's profile data
    const userProfileResponse = await axios.get(
      "https://api.spotify.com/v1/me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Handle the user profile data
    const userProfile = userProfileResponse.data;

    res.json(userProfile);
  } catch (error) {
    res.status(500).send("Error getting access token: " + error.message);
  }
});

// Start the Node.js server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
