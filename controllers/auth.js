const User = require('../models/user');
const jwt = require('jsonwebtoken'); // to generate signed token
const expressJwt = require('express-jwt'); // for authorization check
const { errorHandler } = require('../helpers/dbErrorHandler');
const Otp  = require("../models/otpModel.js");
const asyncHandler = require('express-async-handler')

const nodemailer = require('nodemailer')
// using promise
exports.signup = (req, res) => {
    // console.log("req.body", req.body);
    const user = new User(req.body);
    user.save((err, user) => {
        if (err) {
            return res.status(400).json({
                // error: errorHandler(err)
                error: 'Email is taken'
            });
        }
        user.salt = undefined;
        user.hashed_password = undefined;
        res.json({
            user
        });
    });
};

// using async/await
// exports.signup = async (req, res) => {
//     try {
//         const user = await new User(req.body);
//         console.log(req.body);

//         await user.save((err, user) => {
//             if (err) {
//                 // return res.status(400).json({ err });
//                 return res.status(400).json({
//                     error: 'Email is taken'
//                 });
//             }
//             res.status(200).json({ user });
//         });
//     } catch (err) {
//         console.error(err.message);
//     }
// };

exports.signin = (req, res) => {
    // find the user based on email
    const { email, password } = req.body;
    User.findOne({ email }, (err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User with that email does not exist. Please signup'
            });
        }
        // if user is found make sure the email and password match
        // create authenticate method in user model
        if (!user.authenticate(password)) {
            return res.status(401).json({
                error: 'Email and password dont match'
            });
        }
        // generate a signed token with user id and secret
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
        // persist the token as 't' in cookie with expiry date
        res.cookie('t', token, { expire: new Date() + 9999 });
        // return response with user and token to frontend client
        const { _id, name, email, role } = user;
        return res.json({ token, user: { _id, email, name, role } });
    });
};

exports.signout = (req, res) => {
    res.clearCookie('t');
    res.json({ message: 'Signout success' });
};

exports.requireSignin = expressJwt({
    secret: process.env.JWT_SECRET,
    userProperty: 'auth'
});

exports.isAuth = (req, res, next) => {
    let user = req.profile && req.auth && req.profile._id == req.auth._id;
    if (!user) {
        return res.status(403).json({
            error: 'Access denied'
        });
    }
    next();
};

exports.isAdmin = (req, res, next) => {
    try{
    if (req.profile.role === 0) {
        return res.status(403).json({
            error: 'Admin resourse! Access denied'
        });
    }
    next();
}catch(e){
    return res.status(500).json({
        error: 'error accoured'
    });
}
};

/**
 * google login full
 * https://www.udemy.com/instructor/communication/qa/7520556/detail/
 */

// @desc    email send
// @route   POST /api/users/send-email
// @access  Public
exports.sendEmail = asyncHandler(async (req, res) => {
    let data = await User.findOne({ email: req.body.email });
  
    const response = {};
  
    if (data) {
      let otpCode = Math.floor(1000 + Math.random() * 9000);
      let otpData = new Otp({
        email: req.body.email,
        code: otpCode,
        expireIn: new Date().getTime() + 300 * 1000,
      });
      let otpResponse = await otpData.save();
      mailer(req.body.email, otpCode);
      res.json({ message: "Please check Your Email Id" });
    } else {
      res.status(404);
      throw new Error("Email Id not Exist");
    }
  });
  
  // @desc    change pwd
  // @route   POST /api/users/change-password
  // @access  Public
  exports.changePwd = asyncHandler(async (req, res) => {
    let data = await Otp.findOne({
      email: req.body.email,
      code: req.body.otpCode,
    });
  
    const response = {};
  
    if (data) {
      let currentTime = new Date().getTime();
      let diff = data.expireIn - currentTime;
      if (diff < 0) {
        res.status(404);
        throw new Error("Token Expire");
      } else {
        let user = await User.findOne({ email: req.body.email });
        user.password = req.body.password;
        user.save();
        res.json({ message: "Password change Successfully!!" });
      }
    } else {
      res.status(404);
      throw new Error("Invalid OTP");
    }
  });
  
  
  
  const mailer = (email, otp) => {
    const contactEmail = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "reactjsdeveloper45@gmail.com",
        pass: `${process.env.TOPSECRET}`,
      },
    });
  
    contactEmail.verify((error) => {
      if (error) {
        console.log("error", error);
      } else {
        console.log("Ready to Send");
      }
    });
  
    var mail = {
      from: "reactjsdeveloper45@gmail.com",
      to: email,
      subject: "One Time Password | TEAM LUKJURY",
      html: `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
      
      <head>
          <meta charset="UTF-8">
          <meta content="width=device-width, initial-scale=1" name="viewport">
          <meta name="x-apple-disable-message-reformatting">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta content="telephone=no" name="format-detection">
          <title></title>
          <!--[if (mso 16)]>
          <style type="text/css">
          a {text-decoration: none;}
          </style>
          <![endif]-->
          <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]-->
          <!--[if gte mso 9]>
      <xml>
          <o:OfficeDocumentSettings>
          <o:AllowPNG></o:AllowPNG>
          <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
      </xml>
      <![endif]-->
      </head>
      
      <body>
          <div class="es-wrapper-color">
              <!--[if gte mso 9]>
                  <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                      <v:fill type="tile" color="#fafafa"></v:fill>
                  </v:background>
              <![endif]-->
              <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0">
                  <tbody>
                      <tr>
                          <td class="esd-email-paddings" valign="top">
                              <table cellpadding="0" cellspacing="0" class="es-content esd-header-popover" align="center">
                                  <tbody>
                                      <tr>
                                          <td class="esd-stripe" align="center">
                                              <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" width="600">
                                                  <tbody>
                                                      <tr>
                                                          <td class="esd-structure" align="left" bgcolor="#1976D2" style="background-color: #1976d2;">
                                                              <table cellpadding="0" cellspacing="0" width="100%">
                                                                  <tbody>
                                                                      <tr>
                                                                          <td width="600" class="esd-container-frame" align="center" valign="top">
                                                                              <table cellpadding="0" cellspacing="0" width="100%">
                                                                                  <tbody>
                                                                                      <tr>
                                                                                          <td align="center" class="esd-block-image" style="font-size: 0px;">
                                                                                              <a target="_blank"><img class="adapt-img" src="https://res.cloudinary.com/dzggpp2xh/image/upload/v1668061955/char_pahiya_600_300_px_600_200_px_chah9o.png" alt style="display: block;" width="265"></a>
                                                                                          </td>
                                                                                      </tr>
                                                                                  </tbody>
                                                                              </table>
                                                                          </td>
                                                                      </tr>
                                                                  </tbody>
                                                              </table>
                                                          </td>
                                                      </tr>
                                                  </tbody>
                                              </table>
                                          </td>
                                      </tr>
                                  </tbody>
                              </table>
                              <table class="es-content esd-footer-popover" cellspacing="0" cellpadding="0" align="center">
                                  <tbody>
                                      <tr>
                                          <td class="esd-stripe" style="background-color: #fafafa;" bgcolor="#fafafa" align="center">
                                              <table class="es-content-body" style="background-color: #ffffff;" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
                                                  <tbody>
                                                      <tr>
                                                          <td class="esd-structure es-p40t es-p20r es-p20l" style="background-color: transparent; background-position: left top;" bgcolor="transparent" align="left">
                                                              <table width="100%" cellspacing="0" cellpadding="0">
                                                                  <tbody>
                                                                      <tr>
                                                                          <td class="esd-container-frame" width="560" valign="top" align="center">
                                                                              <table width="100%" cellspacing="0" cellpadding="0">
                                                                                  <tbody>
                                                                                      <tr>
                                                                                          <td class="esd-block-image es-p40t es-p40b" align="center" style="font-size:0">
                                                                                              <a target="_blank"><img src="https://tlr.stripocdn.email/content/guids/CABINET_dd354a98a803b60e2f0411e893c82f56/images/23891556799905703.png" alt style="display: block;" width="139"></a>
                                                                                          </td>
                                                                                      </tr>
                                                                                      <tr>
                                                                                          <td class="esd-block-text es-p15t es-p25b" align="center">
                                                                                              <h1 style="color: #333333; font-size: 20px;"><strong>FORGOT YOUR </strong></h1>
                                                                                              <h1 style="color: #333333; font-size: 20px;"><strong>&nbsp;PASSWORD?</strong></h1>
                                                                                          </td>
                                                                                      </tr>
                                                                                      <tr>
                                                                                          <td class="esd-block-text es-p10b es-p40r es-p40l" align="center">
                                                                                              <p style="font-size: 18px;">HI,&nbsp;${email}</p>
                                                                                          </td>
                                                                                      </tr>
                                                                                      <tr>
                                                                                          <td class="esd-block-text es-p10t es-p5b es-p35r es-p40l" align="center">
                                                                                              <p style="font-size: 16px;">We understand you have many things to remember and forgetting a password is obvious&nbsp;😁.</p>
                                                                                          </td>
                                                                                      </tr>
                                                                                      <tr>
                                                                                          <td class="esd-block-text es-p25t es-p40r es-p40l" align="center">
                                                                                              <p><span style="font-size:16px;">You need not worry. Eager to see you on  Lukjury Travel😎&nbsp;.</span><br><br><br><em><strong><span style="font-size:17px;">Enter the OTP provided below.</span></strong></em></p>
                                                                                          </td>
                                                                                      </tr>
                                                                                      <tr>
                                                                                          <td class="esd-block-button es-p40t es-p40b es-p10r es-p10l" align="center"><span class="es-button-border-1649509971724 es-button-border" style="border-radius: 9px; border-width: 6px; display: block; background: #ffffff; border-color: #0b5394;"><a  class="es-button es-button-1649509971716" target="_blank" style="border-radius: 9px; font-size: 18px; font-weight: bold; font-style: italic; border-left-width: 5px; border-right-width: 5px; display: block; color: #333333;">${otp}</a></span></td>
                                                                                      </tr>
                                                                                  </tbody>
                                                                              </table>
                                                                          </td>
                                                                      </tr>
                                                                  </tbody>
                                                              </table>
                                                          </td>
                                                      </tr>
                                                      <tr>
                                                          <td class="esd-structure es-p5t es-p20b es-p20r es-p20l" align="left">
                                                              <table width="100%" cellspacing="0" cellpadding="0">
                                                                  <tbody>
                                                                      <tr>
                                                                          <td class="esd-container-frame" width="560" valign="top" align="center">
                                                                              <table width="100%" cellspacing="0" cellpadding="0">
                                                                                  <tbody>
                                                                                      <tr>
                                                                                          <td class="esd-block-text" esd-links-color="#666666" align="center">
                                                                                              <p style="font-size: 14px;">Contact us: <a target="_blank" style="font-size: 14px; color: #666666;" href="tel:123456789">123456789</a> | <a target="_blank" href="mailto:reactjsdeveloper45@mail.com" style="font-size: 14px; color: #666666;">reactjsdeveloper45@gmail.com</a></p>
                                                                                          </td>
                                                                                      </tr>
                                                                                  </tbody>
                                                                              </table>
                                                                          </td>
                                                                      </tr>
                                                                  </tbody>
                                                              </table>
                                                          </td>
                                                      </tr>
                                                  </tbody>
                                              </table>
                                          </td>
                                      </tr>
                                  </tbody>
                              </table>
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </body>
      
      </html>
              `,
    };
  
    contactEmail.sendMail(mail, (error) => {
      if (error) {
        res.json({ status: "ERROR" });
      } else {
        res.json({ status: "Message Sent" });
      }
    });
    //
    // mailOptions = {
    //   to: email,
    //   subject: "We Have Received Your Message",
    //   html: `
    //   Hello
    //   Thanks for sending us a message! We’ll get back to you as soon as possible.`
    // };
    // contactEmail.sendMail(mailOptions);
    // //
  };