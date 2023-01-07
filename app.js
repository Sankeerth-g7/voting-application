const express = require("express");

const app = express();

app.get("/", (req, res) => {
  return res.status(200).json({
    name: "Voting App",
    success: true,
  });
});

module.exports = app;