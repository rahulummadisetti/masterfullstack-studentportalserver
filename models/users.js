const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    name                    : { type : String, required: true},
    email                   : { type : String, required: true},
    password                : { type : String, required: true},
    profession              : { type : String, required: true},
    department              : { type : String, required: true},
    DOB                     : { type : Date, required: true},
    DOJ                     : { type : Date, required: true},
    phno                    : { type : String, required: true},
    Address                 : { type : String, required: true},
    Active                  : {type : Boolean, required: true , default: false},
    registrationID          : { type : String, required: true},
})

mongoose.model('users',UserSchema);
module.exports = mongoose.model('users');