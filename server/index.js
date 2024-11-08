require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ strict: true }));
app.enable("trust proxy");
app.disable("x-powered-by");

app.use("/calculate", require("./routes/calc"));

app.use("/", function (req, res) {
  res.json({ error: "endpoint not found" });
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
