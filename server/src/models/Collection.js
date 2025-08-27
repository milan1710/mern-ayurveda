const { Schema, model } = require('mongoose');

const colSchema = new Schema({
  name: { type:String, required:true, unique:true },
}, { timestamps:true });

module.exports = model('Collection', colSchema);
