const mongoose = require('mongoose');
const vacationrequestsSchema = new mongoose.Schema({
    registrationID     : { type: String, required: true },
    fromDate           : { type : Date, required: true},
    toDate             : { type : Date, required: true},
    purpose            : { type: String, required: true},
    status             : { type: String }
})

mongoose.model('vacationrequests',vacationrequestsSchema);
module.exports = mongoose.model('vacationrequests');