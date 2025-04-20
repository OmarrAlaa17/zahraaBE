const cloudinary = require("../middleware/cloudinary");


module.exports = async (files) => {
    
    const urls = [];
    //   const files = req.files;
    console.log("🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀");
    console.log(files);
    for (const file of files) {
    const path = file.path;
    const newPath = await cloudinary.uploader.upload(path);
    const newUrl = newPath.secure_url;
    console.log("🚀 ~ file: user.js ~ line 185 ~ uploadImg ~ newUrl", newUrl);

    urls.push(newUrl);
    //fs.unlinkSync(path);
    }
    return urls;
};