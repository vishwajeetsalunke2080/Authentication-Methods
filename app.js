import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import env from "dotenv";
import bcrypt from "bcrypt";
// import encrypt from 'mongoose-encryption';
// import md5 from 'md5';

env.config();

const app = express();
const port = process.env.PORT || 3000;

const saltRounds = 10;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://127.0.0.1:27017/UserDB");
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

// userSchema.plugin(encrypt,{secret:process.env.KEY,encryptedFields:["password"]})

const User = mongoose.model("user", userSchema);

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/logout", (req, res) => {
  res.redirect("/login");
});

app.post("/login", (req, res) => {
  async function login() {
    const user = await User.findOne({ email: req.body.username });
    if (user) {
      const match = await bcrypt.compare(req.body.password, user.password);
      if (user.email === req.body.username && match) {
        
        res.render("secrets");
      } else {
        res.redirect("login");
      }
    }
  }
  login();
});

app.post("/register", (req, res) => {
  async function register() {
    bcrypt.hash(req.body.password, saltRounds).then((result) => {
      const user = new User({
        email: req.body.username,
        password: result,
      });
      user.save();
    });
    res.render("login");
  }
  register();
});

app.listen(port, () => {
  console.log("listening on port 3000");
});
