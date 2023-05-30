"use strict";

require("dotenv").config({
    path: __dirname + "/.env",
});

const https = require("https");
const cors = require("cors");
const path = require("path");
//const cookie = require("cookie");
const express = require("express");
const jwt = require("jsonwebtoken");
const pug = require('pug')
//var cookieParser = require("cookie-parser");

//const flash = require("express-flash-messages");
//const expressSession = require("express-session");

const app = express();

app.use(cors());
//app.use(flash());

// Set Global
global.appRoot = __dirname;
global.server_url = process.env.APP_URL;

// cookieParser middleware
//app.use(cookieParser());

// app.use(
//     expressSession({
//         secret: "P5&A%R3s1Z3Ea!dN@n!T3R7A",
//         cookie: {
//             secure: false,
//             maxAge: 3600000,
//             expires: new Date(Date.now() + 3600000),
//         },
//         resave: true,
//         saveUninitialized: false,
//     })
// );

// app.use(function (req, res, next) {
//     res.locals.session = req.session;
//     next();
// });

// Parsers for POST data
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: false })); // for parsing application/x-www-form-urlencoded


//set public folder path
app.use(express.static(__dirname + "/public"));
app.set(express.static(path.join(__dirname, "public/upload")));

// Global variables
// // Check Server Cookies For Auth User
// app.get("/*", (req, res, next) => {
//     if (req.auth_user) {
//           res.redirect('/dashobard')
//     }

//    else {
//     res.redirect('/login')
//    }
    
//     next();
// });

app.use(require("./src/services"));

// set the view engine to pug
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.set(express.static(path.join(__dirname, "public/upload")));

//The 404 Route (ALWAYS Keep this as the last route)
app.get("*", function (req, res) {
    return res.redirect("/");
    // res.render("404");
});

let http_options = {};
if (
    process.env.NODE_ENV === "production"
    || process.env.NODE_ENV === "development"
) {
    http_options = {
        ...http_options
    
    };
}

/*** Get port from environment and store in Express. ***/
const http_port = process.env.http_port || "8002";
const httpServer = require("http").Server(app);
httpServer.listen(http_port, function () {
    console.log(`httpServer App started on port ${http_port}`);
});

/*** Create an HTTPS service identical to the HTTP service. ***/
const https_port = process.env.https_port || "8001";
var httpsServer = https.createServer(http_options, app);
httpsServer.listen(https_port, () => {
    console.log(`httpsServer App started on port ${https_port}`);
});
