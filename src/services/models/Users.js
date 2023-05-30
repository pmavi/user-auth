const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({

    email:{
        type:String,
        unique:true
    },
    password:{
        type:String
    },
    first_name:String,
   last_name:String
},{timestamp:true});

const Users = mongoose.model("Users", UserSchema);

module.exports = Users;
