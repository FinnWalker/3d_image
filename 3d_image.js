const express = require("express");
const app = express();

app.use("/3d_image/", express.static("hena"));

app.listen(1235);
