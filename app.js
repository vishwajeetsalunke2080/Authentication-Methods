
import express from "express";
import bodyParser from "body-parser";
import mongoose from 'mongoose';
// import encrypt from 'mongoose-encryption';
import env from 'dotenv';
import md5 from 'md5';

env.config()

const app = express();
const port = process.env.PORT || 3000
app.set('view engine','ejs')
app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended:true}))

mongoose.connect("mongodb://127.0.0.1:27017/UserDB")
const userSchema = new mongoose.Schema({
    email:String,
    password:String
})

// userSchema.plugin(encrypt,{secret:process.env.KEY,encryptedFields:["password"]})

const User = mongoose.model("user",userSchema)

app.get("/",(req,res)=>{
    res.render("home");
})

app.get("/register",(req,res)=>{
    res.render("register");
})

app.get("/login",(req,res)=>{
    res.render("login");
})

app.get("/logout",(req,res)=>{
    res.redirect("/login");
})

app.post("/login",(req,res)=>{
    async function login(){
        const user = await User.findOne({email:req.body.username});
        if(user){
            if(user.email ===  req.body.username && user.password === md5(req.body.password)){
                console.log(md5(req.body.password));
                res.render("secrets")
            }else{
                res.redirect("login")
            }
        }
    }
    login()
    
})

app.post("/register",(req,res)=>{
    try {
        async function register(){
            const user = new User({
                email:req.body.username,
                password:md5(req.body.password)
            })
            user.save()
            res.render("login")
        }    
        register()    
    } catch (error) {
        console.log(error);
        res.redirect("home")
    } 
})

app.listen(port,()=>{
    console.log("listening on port 3000");
})