const mongoose = require('mongoose');
const classroomSchema = new mongoose.Schema({
    roomno     : { type: Number, required: true },
    name       : { type : String, required: true},
    section    : { type : String, required: true, maxLength:3},
    classID    : { type: String, required: true}
})

mongoose.model('classrooms',classroomSchema);
module.exports = mongoose.model('classrooms');