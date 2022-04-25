const { route } = require("../routes/route");
const jwt = require("jsonwebtoken");

const auth = async (req,res,next)=>{
    try {
        let token = req.headers['x-api-key'];
        if(!token){
            return res.status(400).json({status:false, msg: "Token is Missing!"});
        }
        else{
            let decodedToken = jwt.verify(token,'functionup-project');
            //console.log(decodedToken)
            if(decodedToken){
                req.author = decodedToken;
                next();
            }
            else{
                res.status(400).json({status:false, msg: "Token is Missing"});
            }
        }
        
    } catch (error) {
        res.status(500).json({ msg: "Error", Error: error.message });
    }
}

module.exports = {
    auth
}