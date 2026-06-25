import jwt from 'jsonwebtoken'

const userAuth = async (req,res ,next)=>{
    const {token} = req.cookies;

    if(!token){
        return res.json({
            success:false,
            message:'Not Authorized , login again'
        })
    }
    try{
        const token_decode = jwt.verify(token,process.env.JWT_SECRET);
        if(token_decode.id){
            req.userId = token_decode.id ;
        }else{
            return res.json({
                success:false,
                message:'Not authorized , login again '
            })
        }
        next();
    }catch(error){
        return res.json({
            success:false,
            message:error.message
        })
    }
}

export default userAuth ;