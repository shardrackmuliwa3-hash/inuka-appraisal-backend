require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const templateRoutes = require("./routes/template.routes");
const cycleRoutes = require("./routes/cycle.routes");
const reportRoutes = require("./routes/report.routes");
const passwordRoutes = require("./routes/password.routes");

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ status: "ok", service: "inuka-appraisal-backend" }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/cycles", cycleRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", passwordRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Inuka Appraisal backend running on port ${PORT}`));
