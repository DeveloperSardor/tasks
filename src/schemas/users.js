import { Schema, model } from "mongoose";
import bcrypt from 'bcrypt'



var validateEmail = function(email) {
    var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email)
};


const UserSchema = new Schema({
fullname : {
    type : String,
    required : [true, "Ism sha'rif talab qilinadi!"]
},
email : {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    required: 'Email talab qilinadi',
    validate: [validateEmail, 'Email yaroqsiz!'],
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Iltimos yaroqli email kiriting']
},
img : {
    type : String,
    default : "uploads/user-default.png"
},
password : {
type : String,
maxLength : [8, 'Parol 8 ta belgidan oshib ketmasligi kerak!']
},
position : {
    type : String,
    enum : ['manager', 'worker', 'customer']
}
}, {
    timestamps : true
})

UserSchema.methods.matchPassword = async function (enteredPass) {
    return await bcrypt.compare(enteredPass, this.password);
  };
  
  UserSchema.pre("save", async function (next) {
    if (!this.isModified) {
      next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  });

export default model('Users', UserSchema)