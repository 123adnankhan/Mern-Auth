import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js';
import { EMAIL_VERIFY_TEMPLATE,PASSWORD_RESET_TEMPLATE } from '../config/emailTemplates.js';
export const register = async (req , res)=>{
    const {name,email,password} = req.body ;

    if(!name || !email || !password){
        return res.json({
            success:false,
            message:"Missing Details "
        })
    }
    try{
        const existingUser = await userModel.findOne({email})
        if(existingUser){
            return res.json({
                success:false,
                message:"User already exist "
            })
        }
        const hashedPassword = await bcrypt.hash(password,10);

        const user = new userModel({
            name,
            email,
            password:hashedPassword
        })
        await user.save();

        const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'})
        res.cookie('token',token,{
            httpOnly:true,
            secure:process.env.NODE_ENV === 'production',
            sameSite:process.env.NODE_ENV === 'production' ? 'none':'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 
        })

        // Sending welcome email 

        const mailOptions = {
            from:process.env.MAIL_USER,
            to:email,
            subject:'Welcome to Greatstack',
            text:`Welcome to greatstack website. Your account has been created with id : ${email}`
        }
        await transporter.sendMail(mailOptions);

        return res.json({
            success:true
        })

    }catch(error){
        res.json({
            success:false,
            message:error.message
        })
    }
}

export const login = async (req,res)=>{
    const {email , password } = req.body ;

    if(!email || !password){
        return res.json({
            success:false,
            message:'Email and password are required '
        })
    }

    try{
        const user = await userModel.findOne({email});

        if(!user){
            return res.json({
                success:false,
                message:'Invalid email or user Does not exist'
            })
        }

        const isMatch = await bcrypt.compare(password,user.password);

        if(!isMatch){
            return res.json({
                success:false,
                message:"Invalid password"
            })
        }

        const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'})
        res.cookie('token',token,{
            httpOnly:true,
            secure:process.env.NODE_ENV === 'production',
            sameSite:process.env.NODE_ENV === 'production' ? 'none':'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 
        })
        return res.json({
            success:true
        })

    }
    catch(error){
        return res.json({
            success:false,
            message:error.message
        })
    }
}

// send verify otp to the user's email 

export const sendVerifyOtp = async (req,res)=>{
 try{
    const userId = req.userId ;

    const user = await userModel.findById(userId);

    if(user.isAccountVerified){
        return res.json({
            success:false,
            message:"Account already verified"
        })
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000 ));

    user.verifyOtp = otp ;
    user.verifyOtpExpiresAt = Date.now() + 24 * 60 * 60 * 1000 ;
    await user.save();


    const mailOption = {
        from:process.env.MAIL_USER,
        to:user.email,
        subject:'Account Verification OTP',
        // text:`Your otp is ${otp},verify your account using this OTP.`
        html:EMAIL_VERIFY_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
    }

    await transporter.sendMail(mailOption);

    res.json({
        success:true,
        message:'Verification otp is sent on email '
    })

 }catch(error){
    return res.json({
        success:false,
        message:error.message
    })
 }
}


export const logout = async (req,res)=>{
    try{
        res.clearCookie('token',{
            httpOnly:true,
            secure:process.env.NODE_ENV === 'production',
            sameSite:process.env.NODE_ENV === 'production' ? 'none': 'strict'
        })
        return res.json({
            success:true,
            message:"Logged Out Successfully!"
        })
    }catch(error){
        return res.json({
            success:false,
            message:error.message
        })
    }
}

export const verifyEmail = async (req,res)=>{
    try{
        const userId = req.userId;
        const { otp } = req.body ;

        if(!userId || !otp ){
            return res.json({
                success:false,
                message:"Missing Details"
            })
        }

        const user = await userModel.findById(userId);

        if(!user){
           return res.json({
            success:false,
            message:'User not found '
           })
        }

        if(user.verifyOtp === '' || user.verifyOtp !== otp){
            return res.json({
                success:false,
                message:'Invalid otp '
            })
        }

        if(user.verifyOtpExpiresAt < Date.now()){
            return res.json({
                success:false,
                message:'OTP Expired'
            })
        }

        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpiresAt = 0 ;

        await user.save();

        return res.json({
            success:true,
            message:"Email Verified Successfully "
        })
    }catch(error){
        return res.json({
            success:false,
            message:error.message
        })
    }
}

// check if user is authenticated 
export const isAuthenticated = async (req,res)=>{
    try{
        return res.json({
            success:true
        })
    }catch(error){
        return res.json({
            success:false,
            message:error.message
        })
    }
}
// send password reset otp 

export const sendResetOtp = async (req,res)=>{
    const {email} = req.body ;
    if(!email){
        return res.json({
            success:false,
            message:'Email is required '
        })
    }

    try{
        const user = await userModel.findOne({email})
        if(!user){
            return res.json({
                success:false,
                message:'User not found '
            })
        }
        const otp = String(Math.floor(100000 + Math.random() * 900000 ));

        user.resetOtp = otp ;
        // otp valid for 15 mins
        user.resetOtpExpiresAt = Date.now() + 15 * 60 * 1000;
        await user.save();  
        
        
    const mailOption = {
        from:process.env.MAIL_USER,
        to:user.email,
        subject:'Password Reset Otp',
        // text:`Your OTP for resetting your password is ${otp}.
        // Use this otp to proceed with resetting your password `
        html:PASSWORD_RESET_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
    }

    await transporter.sendMail(mailOption);

    return res.json({
        success:true,
        message:'Otp is sent to your email '
    })

    }catch(error){
        return res.json({
            success:false,
            message:error.message
        })
    }
}

// Reset user password 
export const resetPassword = async (req,res)=>{
    const {email,otp,newPassword} = req.body ;
    if(!email || !otp || !newPassword){
        return res.json({
            success:false,
            message:'Email,Otp and new password are requried. '
        })
    }
    try{
        const user = await userModel.findOne({email});
        if(!user){
            return res.json({
                success:false,
                message:'User not found '
            })
        }
        if(user.resetOtp === '' || user.resetOtp !== otp){
            return res.json({
                success:false,
                message:'Invalid otp'
            })
        }
        if(user.resetOtpExpiresAt < Date.now()){
            return res.json({
                success:false,
                message:'Otp Expired'
            })
        }
        const hashedPassword = await bcrypt.hash(newPassword,10);
        user.password = hashedPassword ;
        user.resetOtp = ''
        user.resetOtpExpiresAt = 0 ;
        await user.save();
        
        return res.json({
            success:true,
            message:'Password has been reset successfully !'
        })
    }catch(error){
        return res.json({
            success:false,
            message:error.message
        })
    }
}