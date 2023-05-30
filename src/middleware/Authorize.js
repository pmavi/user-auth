const {Users} = require('../services/models/index');

const jwt = require('jsonwebtoken')


module.exports.verify = async (req,res,next) =>{
    try{
        let auth_token = req.headers['authorization'];

    if(!auth_token){
        return res.json({
            status:false,
            message:'Invalid token'
        })
    }
    let decoded_data = jwt.verify(auth_token, "FGDKGND@!54954FDGX");
   
    // Check Auth user
    const auth_user = await Users.findOne({
      
            _id: decoded_data.user_id,
        
    });
    if (decoded_data?.user_id !== auth_user?.id) {
        return res.redirect("/");
    }

    req.auth_user = auth_user;
}
    catch(err){
        return res.json({
            status:false,
            err:err,
            message:'Something went wrong.'
        }) 
    }
    next();
}