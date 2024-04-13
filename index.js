const mongoose=require('mongoose');
require("dotenv").config();
mongoose.connect("mongodb://127.0.0.1:27017/bolt&wire")
const express=require('express');
const path=require('path')
const session=require('express-session')
const flash = require('connect-flash')
const cors = require('cors')

const app=express();
const PORT=3000 || process.env.PORT;
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false,
}))

//connect flash
app.use(flash())
app.use(cors())

//for user routes
const userRoute=require('./routes/userRoute');
app.use('/',userRoute);

//Admin Route
const adminRoute=require('./routes/adminRoute')
app.use('/admin',adminRoute)

app.listen(PORT,()=>{console.log("server started");})