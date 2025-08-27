const { Schema, model } = require('mongoose');

const catSchema = new Schema({
  name: { type:String, required:true, unique:true },
}, { timestamps:true });

module.exports = model('Category', catSchema);
