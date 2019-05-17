const path = require('path');
const fs   = require('fs-extra');

module.exports = {
    getChildDirectory(dirPath){
        if(!fs.existsSync(dirPath)) return [];
        return fs.readdirSync(dirPath)
        .map((v)=>{
            return path.join(dirPath, v);
        })
        .filter((v)=>{
            return fs.lstatSync(v).isDirectory();
        });
    },
    getFiles(dirPath, ext){
        if(!fs.existsSync(dirPath)) return [];
        return fs.readdirSync(dirPath)
        .map((v)=>{
            return path.join(dirPath, v);
        })
        .filter((v)=>{
            return path.extname(v) === ext;
        });
    }
}