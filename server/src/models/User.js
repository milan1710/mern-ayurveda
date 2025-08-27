const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  name: { type:String, required:true },
  email: { type:String, required:true, unique:true, lowercase:true },
  password: { type:String, required:true },
  role: { type:String, enum:['admin','staff'], default:'staff' },
}, { timestamps:true });

module.exports = model('User', userSchema);
