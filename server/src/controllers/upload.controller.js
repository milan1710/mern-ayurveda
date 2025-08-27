const path = require('path');
const fs = require('fs');

exports.uploadImages = async (req,res)=>{
  // Files are saved by multer to /uploads. Return URLs.
  const files = (req.files || []).map(f => `/uploads/${path.basename(f.path)}`);
  res.json({ urls: files });
};
