'use strict';

//All the required modules are associated with the system.
const path = require("path");
const express = require('express'); //express module
const app = express();
const bodyParser = require("body-parser"); //body-parser module 
const cookieparser = require("cookie-parser"); //cookie-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieparser());

// Assigning the port and host and matching the url of the database.
const PORT = 8000;
const HOST = '0.0.0.0';
var url = "mongodb+srv://nullpointer:admp@nullpointer.9sqch.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

const { MongoClient } = require("mongodb");
const { response } = require("express");

const client = new MongoClient(url);

// connect to the port
client.connect((err)=>{
    if(err) {panic(err);}
    else{console.log("Connected!")}
})

//connect to the database
const database = client.db("nullpointer");
const users = database.collection("users");
const garagesales = database.collection("garageSales");

const panic = (err) => console.error(err)

//This method is to register a new user account.
// It takes all the inputs and inserts it in the database to create a new user while checking the validity of the username and password.
app.post('/register', (req,res) => {
    
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var cpassword = req.body.cpassword;
    var streetaddress = req.body.streetaddress;
    var city = req.body.city;
    var province = req.body.province;
    var country = req.body.country;
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var rewards = 15;
    
    async function insertion(param1,param2,param3,param4,param5,param6,param7,param8,param9,param10,param11,param12,param13){
        var result = "";
        var response = new Object();
        //matches the username and gets the details of the user from the database
        const existUsername = await users.findOne({ Username: username});
        //If the username already exists
        if (existUsername) {
            result = "Username taken";
        }
        //else create a new user
        else{
            users.insertOne({Firstname: param1, Lastname: param2, Email: param3, Username: param4, Password: param5, Cpassword: param6,
                StreetAddress: param7, City: param8, Province: param9, Country: param10, Latitude: param11, Longitude: param12, Rewards: param13});
            result = "Successfully registered."
        }   
        response.answer = result;
        res.send(JSON.stringify(response)); 
    }
    insertion(firstname,lastname,email,username,password,cpassword,streetaddress,city,province,country,latitude,longitude,rewards);
    
});

//This method is to sign with the username and password.
// It checks if the  user exists and if exists it logs in while giving some reward points for signing in.
//It creates a cookie for the user until he/she logs out.
app.post('/signin', (req,res) => {
    var username = req.body.username;
    var password = req.body.password;
    signin();
    async function signin() {
        var response = new Object();
        var check = "" 
        //matches the username and gets the details of the user from the database
        const user = await users.findOne({ Username: username});   
        //if the user exists
        if (user) {
            //if the password matches
            if (user.Password === password){
                var rewards_db = user.Rewards;
                var latitude = user.Latitude;
                var longitude = user.Longitude;
                //update rewards
                rewards_db += 5;
                users.updateOne(
                    {"Username" : username},
                    {$set: { "Rewards" : rewards_db}});
                check = "Login successful";
                //creates a cookie
                res.cookie('username', username); 
                res.cookie('latitude',latitude);
                res.cookie('longitude',longitude);
            }
            else{
                check = "Invalid password"   
            }    
        }
        //User not found
        else {
            check = "No user found";
        }
        
        response.answer = check
        res.send(JSON.stringify(response));
     }
});

//This method is to log out the user.
//It also deletes the cookie which checks if the user is logged in or not.
app.get('/logout', (req,res) => {
    //deletes a cookie
    res.clearCookie("username");
    response.answer = "Logout successful"
    res.send(JSON.stringify(response));
});

//This method checks how many rewards does the user have with the help of the created cookie for the user.
app.get('/rewards', (req,res) => {
    rewards();
    async function rewards() {
        let username = req.cookies.username;
        //matches the username and gets the details of the user from the database
        const user = await users.findOne({ Username: username}); 
        var response = new Object();
        if (user){
            //gets the rewards
            response.answer = user.Rewards
        }
        res.send(JSON.stringify(response));
     }
});

//This method is used for posting a new sale. It is associated with the user by the use of cookie and stores the unique userId.
//It also gives some rewards for posting a sale.
app.post('/post', (req,res) => {
    var title = req.body.title;
    var startdatetime = req.body.startdatetime;
    var enddatetime = req.body.enddatetime;
    var location = req.body.location; 
    var city = req.body.city;
    var province = req.body.province;
    var country = req.body.country;
    var description = req.body.description;
    var tags = req.body.tags;
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    let username = req.cookies.username;


    var response = new Object();
    async function insertion(param1,param2,param3,param4,param5,param6,param7,param8,param9,param10, param11){
        const existUsername = await users.findOne({ Username: username});
        if (existUsername) {
        garagesales.insertOne({Title: param1, StartDatetime: param2, EndDatetime: param3, 
            Location: param4, City: param5, Province: param6, Country: param7 , Description: param8, Tags: param9, Latitude: param10, Longitude: param11, UserId: existUsername._id});
            var rewards_db = existUsername.Rewards;
            //update rewards
            rewards_db += 10;
            users.updateOne(
                {"Username" : username},
                {$set: { "Rewards" : rewards_db}});
        }
    }
    insertion(title,startdatetime,enddatetime,location,city,province,country,description,tags,latitude,longitude);
    response.answer = " Successfully posted."
    res.send(JSON.stringify(response));
});

//This method is used for displaying all the sales on the page.
//It also uses the cookie for getting the userID and the first name and last name of the user.
app.get('/viewdata', (req,res) => {
    var datalist = [];
    
    async function viewallsales() {
        const statement = await garagesales.find({}).toArray();
        var response = new Object();
        Object.keys(statement).forEach(function(key) {
            var sale = statement[key];
            var data = []
            data.push(sale.Title)
            data.push(sale.StartDatetime)
            data.push(sale.EndDatetime)
            data.push(sale.Location)
            data.push(sale.City)
            data.push(sale.Province)
            data.push(sale.Country)
            data.push(sale.Description)
            data.push(sale.Tags)
            data.push(sale.Latitude)
            data.push(sale.Longitude) 
            
            datalist.push(data) 
            response.answer = datalist 
        });
        res.send(response.answer);
    }    
    viewallsales();
});

//This method is used for viewing the sales by the filters which are stored as tags as well as a specified radius. 
//It displays all the sales with a specific tag searched by a filter which is within the desired radius.
app.post('/viewsalesradius', (req,res) => {
    var filter = req.body.filter;
    var radius = req.body.radius;

    var datalist = [];
    sql_request();
    async function sql_request() {
        const statement = await garagesales.find({}).toArray();

        var startAddress;
        let username = req.cookies.username;
        //matches the username and gets the details of the user from the database
        const user = await users.findOne({ Username: username}); 
        var response = new Object();
        if (user){
            //gets the rewards
            var address = user.StreetAddress;
            var city = user.City;
            var province = user.Province;
            var country = user.Country;
            startAddress = address + ","+ city + "," + province + "," + country ;
        }

        //grab user location from cookies
        let userlat = parseFloat(req.cookies.latitude);
        let userlon = parseFloat(req.cookies.longitude);
        
        var response = new Object();
        Object.keys(statement).forEach(function(key) {
            var sale = statement[key];
            var tagstring = sale.Tags
            var salelat = parseFloat(sale.Latitude)
            var salelon = parseFloat(sale.Longitude)

            //grab only the garage sales which contain the desired tags as well as are within the specified radius of the user
            if (tagstring.search(filter) != -1 && isWithinRadius(radius, userlat, userlon, salelat, salelon)) {
                var data = []
                data.push(sale.Title)
                data.push(sale.StartDatetime)
                data.push(sale.EndDatetime)
                data.push(sale.Location)
                data.push(sale.City)
                data.push(sale.Province)
                data.push(sale.Country)
                data.push(sale.Description)
                data.push(sale.Tags)
                data.push(sale.Latitude)
                data.push(sale.Longitude)
                data.push(startAddress)
                datalist.push(data)
            }

            response.answer = datalist 
        });
        res.send(response.answer);
    }    
});


app.use("/", express.static(path.join(__dirname, "pages")))

app.listen(PORT,HOST);
console.log("up!")


/**
 * This function determines if one global coordinate is within the specified radius of another
 * global coordiante.
 * @param {number} radius - distance in kilometers to check if coordinates are within
 * @param {number} centrelat - Latitude of "centre" coordinate
 * @param {number} centrelon - Longitude of "centre" coordinate
 * @param {number} checklat - Latitude of "check" coordinate
 * @param {number} checklon - Longitude of "check" coordinate
 * @returns True if coordinates are within the given radius
 */
function isWithinRadius(radius, centrelat, centrelon, checklat, checklon) {
    var centretocheckdistance = getDistanceFromLatLonInKm(centrelat, centrelon, checklat, checklon)
    if (centretocheckdistance <= radius) {
        return true
    }
    else {
        return false
    }
}

/**
 * This function calculates the distance (in kilometers) between two global coordinates.
 * This calculation is made using the Haversine method. This method is not perfectly accurate
 * as the earth is not a pefect sphere but should be close enough for our purposes.
 * @param {number} lat1 - Latitude of coordinate 1
 * @param {number} lon1 - Longitude of coordinate 1
 * @param {number} lat2 - Latitude of coordinate 2
 * @param {number} lon2 - Longitude of coordinate 2
 * @returns Distance in kilomerters
 */
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);
    var dLon = deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
}

/**
 * This function converts Degrees to Radians
 * @param {number} deg - A decimal degree value
 * @returns A Radian value
 */  
function deg2rad(deg) {
    return deg * (Math.PI/180)
}
