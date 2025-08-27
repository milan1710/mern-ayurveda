const { Schema, model, Types } = require('mongoose');

const productSchema = new Schema({
  name: { type:String, required:true },
  sku: { type:String, required:true, unique:true },
  price: { type:Number, required:true },          // new / current price
  oldPrice: { type:Number, default:null },        // optional
  stock: { type:Number, default:0 },
  description: { type:String, default:'' },
  images: [{ type:String }],
  featured: { type:Boolean, default:false },
  category: { type:Types.ObjectId, ref:'Category', default:null },
  collection: { type:Types.ObjectId, ref:'Collection', default:null },
}, { timestamps:true });

module.exports = model('Product', productSchema);
