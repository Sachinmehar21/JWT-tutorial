const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const connectToDb = require("./config/db");
const User = require("./models/user.model");

const app = express();
connectToDb();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);
app.set("view engine", "ejs");

// Token Verification Middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(403).send("Access denied. No token provided.");

  jwt.verify(token, "secret", (err, decoded) => {
    if (err) return res.status(401).send("Invalid token.");
    req.user = decoded; // Attach the decoded user info to the request
    next(); // Proceed to the next middleware or route handler
  });
};

// Routes
app.get("/", (req, res) => res.render("register"));

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    if (await User.findOne({ email })) return res.status(400).send("User already registered");

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });
    const token = jwt.sign({ email }, "secret", { expiresIn: "1h" });

    res.cookie("token", token).send("Registration successful");
  } catch (err) {
    res.status(500).send("Error registering user");
  }
});

app.get("/login", (req, res) => res.render("login"));

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).send("Invalid email or password");
    }

    const token = jwt.sign({ email }, "secret");
    res.cookie("token", token).send("Login successful");
  } catch (err) {
    res.status(500).send("Error logging in user");
  }
});

// Forgot Password Route (Protected)
app.get("/forgot-password", verifyToken, (req, res) => {
  // Render the forgot-password page with the user's email pre-filled
  res.render("forgot-password", { email: req.user.email });
});

app.post("/forgot-password", verifyToken, async (req, res) => {
  const { email, newPassword } = req.body;

  // Ensure the email provided matches the user in the token
  if (req.user.email !== email) return res.status(400).send("Email mismatch.");

  const user = await User.findOne({ email });
  if (!user) return res.status(400).send("User not found");

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.send("Password reset successful");
});

// Start server
app.listen(3000, () => console.log("Server running on http://localhost:3000"));