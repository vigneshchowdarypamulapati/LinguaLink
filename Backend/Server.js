const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");

// CORS configuration for production and development
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://lingualink-422af.web.app',
    'https://lingualink-422af.firebaseapp.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(cookieParser());
const mongoose = require("mongoose");
app.use(express.json());

const mongourl = process.env.MONGO_URL || 
  "mongodb+srv://vignesh:Vignesh27@cluster0.djtreds.mongodb.net/NLP";

mongoose
  .connect(mongourl, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("connected to database");
  })
  .catch((e) => console.log(e));

require("./Userdetails");
const User = mongoose.model("user");

// Auth routes - matching frontend expectations
app.get("/auth/verify", async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (!userId) {
      return res.json({ status: false, message: "Not authenticated" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ status: false, message: "User not found" });
    }
    res.json({ 
      status: true, 
      user: { _id: user._id, email: user.email, fname: user.fname }
    });
  } catch (err) {
    console.error("Auth verify error:", err);
    res.json({ status: false, message: "Authentication failed" });
  }
});

app.post("/auth/signup", async (req, res) => {
  const { fname, lname, dob, email, pass } = req.body;
  try {
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.json({ status: "error", message: "User already exists" });
    }
    const newUser = await User.create({ fname, lname, dob, email, pass });
    // Set cookie for session
    res.cookie("userId", newUser._id.toString(), {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    res.json({ 
      status: "Registration successful", 
      user: { _id: newUser._id, email: newUser.email, fname: newUser.fname }
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.json({ status: "error", message: "Registration failed" });
  }
});

app.post("/auth/signin", async (req, res) => {
  const { email, pass } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.json({ status: "error", message: "User not found" });
    }
    if (user.pass !== pass) {
      return res.json({ status: "error", message: "Invalid password" });
    }
    // Set cookie for session
    res.cookie("userId", user._id.toString(), {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    res.json({ 
      status: "Login successful", 
      user: { _id: user._id, email: user.email, fname: user.fname }
    });
  } catch (err) {
    console.error("Signin error:", err);
    res.json({ status: "error", message: "Login failed" });
  }
});

app.post("/auth/logout", (req, res) => {
  res.clearCookie("userId");
  res.json({ status: "Logged out" });
});

// Legacy routes (for backward compatibility)
app.post("/signup", async (req, res) => {
  const { fname, lname, dob, email, pass } = req.body;
  try {
    const em = await User.findOne({ email: email });
    if (em) {
      res.json("user already exists");
    } else {
      await User.create({ fname, lname, dob, email, pass });
      res.json("Registration successfull");
    }
  } catch (err) {
    res.send({ status: "error" });
  }
});

app.post("/signin", async (req, res) => {
  const { email, pass } = req.body;
  try {
    const em = await User.findOne({ email: email });
    if (!em) {
      res.json("user not found");
    } else if (em.pass !== pass) {
      res.json("Invalid password");
    } else {
      res.json("Login successfull");
    }
  } catch (err) {
    res.send({ status: "error" });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server Started On Port ${PORT}`);
});
