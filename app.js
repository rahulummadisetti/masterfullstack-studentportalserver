const express  = require('express');
const bodyParser = require('body-parser');
const { MongoClient,ServerApiVersion } = require("mongodb");
const config = require('config');
const app = express();
const mongoose = require('mongoose');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');

let db;

const classrooms = require('./models/classrooms');
const notifications = require('./models/notifications');
const users = require('./models/users');
const vacationrequests = require('./models/vacationrequests');

app.use(bodyParser.urlencoded({extension: 'true'}));
app.use(bodyParser.json());
app.use(cors());

app.set('view engine', 'ejs');
app.set('views','./views');


const IsValidUser = (req,res,next) =>{
    if(req.headers.authorization){
        const secret = config.get('authenticationSecret');

        jwt.verify(req.headers.authorization.replace("bearer ",""),secret,function(err,decoded){
            if(err) return res.status(500).send("invalid token");

            users.findOne({registrationID:decoded.registrationID},function(err,user){

                if(err) return res.status(500).send(err.message);

                if(user == undefined || user == null){
                    res.status(500).send("not a valid user");
                    return;
                }

                next();

            });
        });
    } else {
        return res.status(500).send("invalid token");
    }
}

app.get('/',(req,res) => {
    res.render("template.ejs");
})


app.post('/login',(req,res) => {

    if(req.body.registrationID == undefined || req.body.registrationID == null || req.body.password == undefined || req.body.password == null) {
        res.status(500).send(`Invalid registration ID or Password`);
        return
    }

    users.findOne({registrationID:req.body.registrationID},(err,user) => {

        if(err){
            res.status(500).send("not a valid user");
            return;
        }

        if(user == undefined || user == null){
            res.status(500).send("not a valid user");
            return;
        }

        if(bcrypt.compareSync(req.body.password, user.password)){
            const secret = config.get('authenticationSecret');
            const tokenTimeout = config.get('tokenExpireInTime');
            const token = jwt.sign({registrationID : req.body.registrationID},secret,{expiresIn : tokenTimeout});

            const userinfo = {
                token : token,
                name: user.name,
                email: user.email,
                profession:user.profession,
                department:user.department ,
                DOB:user.DOB,
                DOJ: user.DOJ,
                phno: user.phno,
                Active: user.Active,
                registrationID: user.registrationID
            }

            res.status(200).send(userinfo);
        }
    })
})

app.post('/user',(req,res)=>{
    users.find({department:req.body.department},function(err,_users){
        if(err) return res.status(500).send(err.message);
        const hashpassword = bcrypt.hashSync(req.body.password,8);
        users.create({
                name: req.body.name,
                email: req.body.email,
                password:hashpassword,
                profession:req.body.profession,
                department:req.body.department ,
                DOB:req.body.DOB,
                DOJ: req.body.DOJ,
                phno: req.body.phno,
                Address: req.body.Address,
                Active: false,
                registrationID: req.body.department+"_"+(_users.length+1),
        },function(err,user){
            if(err) return res.status(500).send(err.message);
            res.status(200).send({"Active": user.Active,"registrationID":user.registrationID});
        });
    })
})

app.get('/user',IsValidUser,(req,res)=>{

    if(req.query.name){
        users.find({name:req.query.name},function(err,user){
            if(err) return res.status(500).send(err.message);
            res.status(200).send(user);
        });
    } else if(req.query.department){ 
        users.find({department:req.query.department},function(err,user){
            if(err) return res.status(500).send(err.message);
            res.status(200).send(user);
        });
    } else if(req.query.profession) {
        users.find({profession:req.query.profession},function(err,user){
            if(err) return res.status(500).send(err.message);
            res.status(200).send(user);
        });
    } else if(req.query.registrationID) {
        users.findOne({registrationID:req.query.registrationID},function(err,user){
            if(err) return res.status(500).send(err.message);
            res.status(200).send(user);
        });
    } else {
        users.find({},function(err,user){
            if(err) return res.status(500).send(err.message);
            res.status(200).send(user);
        });
    }

})

app.put('/user',IsValidUser,(req,res)=>{

    users.findOne({registrationID:req.body.registrationID},function(err,_user){

        if(err) return res.status(500).send(err.message);

        _user.name = req.body.name;
        _user.email = req.body.email;
        _user.password = req.body.password;
        _user.profession = req.body.profession;
        _user.department = req.body.department;
        _user.DOB = req.body.DOB;
        _user.DOJ = req.body.DOJ;
        _user.phno = req.body.phno;
        _user.Address = req.body.Address;
        _user.Active = req.body.Active;
        _user.registrationID = req.body.registrationID;

        users.updateOne({registrationID: req.body.registrationID},_user,{upsert:true},function(err,objUser){

            if(err) return res.status(500).send(err.message);

            return res.status(200).send(objUser);
        });
    });
})

app.put('/updatePassword', function(req, res){
    users.findOne({registrationID:req.body.registrationID},function(err,_user){
        if(err) return res.status(500).send(err.message);
        const hashpassword = bcrypt.hashSync(req.body.password,8);
        _user.password = hashpassword;
        users.updateOne({registrationID: req.body.registrationID},_user,{upsert:true},function(err,objUser){

            if(err) return res.status(500).send(err.message);

            return res.status(200).send(objUser);
        });
    })
})

app.delete('/user/:registrationID',IsValidUser,(req,res)=>{
    users.findOneAndDelete({registrationID: req.params.registrationID},function(err,objuser){
        if(err) return res.status(500).send(err.message);
        return res.status(200).send(objuser);
    })
})

app.post('/classroom',IsValidUser,(req,res)=>{
    const classid = req.body.name +"_"+req.body.section;
    classrooms.create({
        roomno     : req.body.roomno,
        name       : req.body.name,
        section    : req.body.section,
        classID    : classid
    },function(err,classroom){
        if(err) return res.status(500).send(err.message);
        res.status(200).send(classroom);
    })
})

app.get('/classroom',(req,res)=>{
    if(req.query.classID){
        classrooms.find({classID:req.query.classID},function(err,classroom){
            if(err) return res.status(500).send(err.message);
            res.status(200).send(classroom);
        });
    }
    else if(req.query.name){
        classrooms.find({name:req.query.name},function(err,classroom){
            if(err) return res.status(500).send(err.message);
            res.status(200).send(classroom);
        });
    }
    else if(req.query.roomno){
        classrooms.find({roomno:req.query.roomno},function(err,classroom){
            if(err) return res.status(500).send(err.message);
            res.status(200).send(classroom);
        });
    } else {
        classrooms.find({},function(err,classroom){
            if(err) return res.status(500).send(err.message);
            res.status(200).send(classroom);
        });
    }
})

app.put('/classroom',IsValidUser,(req,res)=>{

})

app.delete('/classroom',IsValidUser,(req,res)=>{

})

app.post('/notification',IsValidUser,(req,res)=>{
    notifications.create({
        registrationID : req.body.registrationID,
        departmentID  : req.body.departmentID, 
        notification : req.body.notification,
        fromDate : req.body.fromDate,
        toDate : req.body.toDate
    },function(err,notification){
        if(err) return res.status(500).send(err.message);
        res.status(200).send(notification);
    })
})

app.get('/notification',IsValidUser,(req,res)=>{
    if(req.query.registrationID && req.query.departmentID)  {
        notifications.find({$or:[{registrationID : req.query.registrationID},{departmentID : req.query.departmentID}]}, function(err,_notifications) {
            if(err) return res.status(500).send(err.message);
            res.status(200).send(_notifications);
        });
    }  
    else if(req.query.registrationID) {
        notifications.find({registrationID : req.query.registrationID}, function(err,_notifications) {
            if(err) return res.status(500).send(err.message);
            res.status(200).send(_notifications);
        })
    } else if(req.query.departmentID) {
        notifications.find({departmentID : req.query.departmentID}, function(err,_notifications) {
            if(err) return res.status(500).send(err.message);
            res.status(200).send(_notifications);
        })

    } else {
        notifications.find({}, function(err,_notifications) {
            if(err) return res.status(500).send(err.message);
            res.status(200).send(_notifications);
        })
    }
})

app.put('/notification',IsValidUser,(req,res)=>{

})

app.delete('/notification',IsValidUser,(req,res)=>{

})

app.post('/vacationrequest',IsValidUser,(req,res)=>{
    vacationrequests.create({
    registrationID     : req.body.registrationID,
    fromDate           : req.body.fromDate,
    toDate             : req.body.toDate,
    purpose            : req.body.purpose,
    status             : req.body.status
    },function(err, objvacation){
        if(err) return res.status(500).send(err.message);
        res.status(200).send(objvacation);
    })
})

app.get('/vacationrequest',IsValidUser,(req,res)=>{
    vacationrequests.find({}, function(err,_vacationrequests){
        if(err) return res.status(500).send(err.message);
        res.status(200).send(_vacationrequests);
    })
})

app.get('/vacationrequest/:registrationID',IsValidUser,(req,res)=>{
    vacationrequests.find({registrationID:req.params.registrationID}, function(err,objvacation){
        if(err) return res.status(500).send(err.message);
        res.status(200).send(objvacation);
    })
})

app.put('/vacationrequest/:id',IsValidUser,(req,res)=>{
    vacationrequests.findById(req.params.id, function(err,_vacationrequest){
        _vacationrequest.registrationID = req.body.registrationID;
        _vacationrequest.fromDate = req.body.fromDate;
        _vacationrequest.toDate = req.body.toDate;
        _vacationrequest.purpose = req.body.purpose;
        _vacationrequest.status = req.body.status;
        vacationrequests.updateOne({_id:req.params.id},_vacationrequest,{upsert:true},function(err,objvacationrequest){

            if(err) return res.status(500).send(err.message);

            return res.status(200).send(objvacationrequest);
        });
    })
})

app.delete('/vacationrequest',IsValidUser,(req,res)=>{

})

mongoose.connect(config.get("MONGODB_URL"), { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 },(err)=>{
    if(err) throw err;

    let port = process.env.PORT || config.get("port");

    app.listen(port,()=>{
        console.log(`Server running on port ${port}`)
    })
})