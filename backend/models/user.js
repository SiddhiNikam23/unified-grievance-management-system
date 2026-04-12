const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    name :{
        type : String,
        required : true,
        trim: true
    },
    email :{
        type : String,
        required : true,
        unique : true,
    },
    password:{
        type : String,
        required : true,
    },
    gender:{
        type : String,
        required : true,
    },
    phone:{
        type : Number,
        required : true,
    },
    address:{
        type : String,
        required : true,
    },
    city:{
        type : String,
        required : true,
        default: 'Not Specified',
        trim: true
    },
    state:{
        type : String,
        required : true,
    },
    pincode:{
        type: Number,
        required: false,
    }
})
const User = mongoose.model('User', userSchema);
module.exports = User;
