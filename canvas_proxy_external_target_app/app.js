const express = require("express");
const path = require("path");

const app = express();
const port = 3456;

// Serve static files from the 'public' directory
app.use(express.static("public"));

// Serve the index.html file for the root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
