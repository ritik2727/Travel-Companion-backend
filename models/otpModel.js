const mongoose = require("mongoose");


const otpSchema = mongoose.Schema(
  {
    email: {
      type: String,
      require: true,
    //   unique: true,
    },
    code: {
      type: String,
      require: true,
    },
    expireIn: {
      type: Number,
      require: true,
    },
  },
  {
    timeStamps: true,
  }
);


module.exports= mongoose.model("otp", otpSchema);

