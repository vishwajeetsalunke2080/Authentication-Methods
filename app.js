import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import env from "dotenv";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import session from "express-session";
import {Strategy} from 'passport-google-oauth20';
import findOrCreate from 'mongoose-findorcreate';

env.config();

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// creating session using following params
app.use(
  session({
    secret: process.env.KEY,
    resave: false,
    saveUninitialized: false,
  })
);

// initialize passport to be used in project
app.use(passport.initialize());
// telling passport to use session in authentication
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/UserDB");
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId:String
});

// creating userSchema and plugging it to passport-local-mongoose
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// creating a user Collection and telling it to use above mentioned schema
const User = mongoose.model("user", userSchema);

// createStrategy is a new addon to creating a new LocalStrategy in Passport authentication
passport.use(User.createStrategy());

// serializeUser is basically creating a new user Cookie
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username, name: user.name });
  });
});

// deserializeUser is basically removing user Cookie
passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});


passport.use(new Strategy({
  clientID:process.env.CLIENT_ID,
  clientSecret:process.env.CLIENT_SECRET,
  callbackURL:"http://localhost:3000/auth/google/secrets",
  userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
}, 
(accessToken,refreshToken,profile,cb)=>{
  User.findOrCreate({googleId:profile.id,email:profile.emails[0].value},(err,user)=>{
    console.log(profile);
    return cb(err,user)
  })
}
))

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/auth/google", passport.authenticate("google",{scope:['profile','email']}))

app.get('/auth/google/secrets', 
  passport.authenticate("google", { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
  });

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/logout", (req, res) => {
  req.logOut((err)=>{
    if(err){
      console.error(err);
    }else{
      console.log("logged out successfully");
      res.redirect("/login");
    }
  });  
});

app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.logIn(user, (err) => {
    if(err) {
      console.error(err);
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/register", (req, res) => {
  User.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        res.render("register",{err:err})
      } else {
        console.log(user);
        User.authenticate("local")(req, res, () => {
          res.redirect("/login");
        });
      }
    }
  );
});

app.listen(port, () => {
  console.log("listening on port 3000");
});
