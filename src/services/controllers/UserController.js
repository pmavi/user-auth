require('dotenv').config({
    path: __dirname + "./env" ,
})

const {Users} = require('../models/index');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken')

module.exports.Signup = async (req,res) => {
    if(req.method === "POST"){
try{
   

    
    let request_body = req.body;

    if(!request_body.email || !request_body.password || !request_body.user_type){
        return res.json({
            status:false,
            message:'parmas required email and password'
        });
       
    }
    const e_check = await validator.isEmail(request_body.email);
    if(!e_check){
        return res.json({
            status:false,
            message:'invalid email!'
        }); 
    }
     
        
        const p_check = await validator.isLength(request_body.password,{min:6});
        if(!p_check){
        return res.json({
            status:false,
            message:'minimum length should be 6 !'
        }); 
    }
    
    let user =  await Users.findOne({email:request_body.email})
     if(user){
        return res.json({
            status:false,
            message:'user already exists!'
        });
    }
    console.log("---password!!!", request_body.password);

    if(request_body.password){
        request_body.password = await bcrypt.hash(request_body.password,10);
        console.log("---password", request_body.password);
    
    }
  
    await Users.create(request_body);
    return res.json({
        status:true,
        message:'User registerred',
        redirect_url: `${process.env.APP_URL}/login`,

    })
    
}


catch(err){
    console.log("-----error", err)
    return res.json({
        status:false,
        err:err,
        message:'Something went wrong.'
    })
}
}

res.render("frontend/auth/register");
   
}

module.exports.Login = async (req,res) => {
    console.log("-------callledddddd")
    if(req.method == "POST"){
try{

    let request_body = req.body;

    if(!request_body.email || !request_body.password ){
        return res.json({
            status:false,
            message:'parmas required email and password'
        });
       
    }
    
    let user =  await Users.findOne({email:request_body.email})
     if(!user){
        return res.json({
            status:false,
            message:'user not exists!'
        });
    }

    let payload = {
        user_id: user?._id,
        userrole:user?.user_type,
        expiresIn:7200
    }
    const TOKEN_SECRET = "FGDKGND@!54954FDGX"
    let token =  jwt.sign(payload ,TOKEN_SECRET)
  
    return res.json({
        status:true,
        message:'User logged in',
        token:token,
        id:user._id,
        redirect_url: `${process.env.APP_URL}/login`,

    })

}
catch(err){
    console.log("-----error", err)
    return res.json({
        status:false,
        err:err,
        message:'Something went wrong.'
    })
}
    }
    res.render("frontend/auth/login");

   
}

