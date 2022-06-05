const mongoose = require('mongoose');
const notificationsSchema = new mongoose.Schema({
    registrationID  : { type : String },
    departmentID    : { type : String },
    notification    : { type : String, required: true},
    fromDate        : { type : Date, required: true },
    toDate          : { type : Date, required: true }
});

mongoose.model('notifications',notificationsSchema);
module.exports = mongoose.model('notifications');