const ProjectLoader = require('./utils/ProjectLoader');
const Compiler      = require('./compiler');
const Organizer     = require('./organizer');

class Hybrid{
    build(configJSON, progcess){
        progcess = progcess || (()=>{}) ;
        return new Promise((resolve, reject)=>{
            const json = configJSON;

            // 加载工程信息
            const loader = new ProjectLoader(json);
            
            // 工具预编译
            const organizer = new Organizer();
            organizer.build(loader, (info)=>{
                info.percent = info.percent * 0.5;
                progcess(info);
            })
            .then(()=>{
                const compiler = new Compiler();
                return compiler.build(json, (info)=>{
                    progcess({
                        percent:0.6,
                        info:'开始主编译...'
                    });
                });
            })
            .then(()=>{
                progcess({
                    percent:1,
                    info:'编译结束!'
                });
                resolve();
            })
            .catch((error)=>{
                progcess({
                    percent:1,
                    info:'编译出错!'
                });
                reject(error);
            });
        })
    }
}

const hybrid = new Hybrid();
module.exports = hybrid;

// const json = {
//     "bundle.identifier": "test",
//     "displayName": "计算器",
//     "workDirectory": "/Users/feelings/FrontEnd/Token小程序/helloworld",
//     "entryJS": "index.js",
//     "entryHTML": "index.html",
//     "entryCSS": "index.css"
//   }

//   hybrid.build(json);