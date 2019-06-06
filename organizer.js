const fs        = require("fs-extra")
const path      = require('path');
const mapStream = require('./utils/mapStream');

const vfs         = require('vinyl-fs');
const fileinclude = require('gulp-file-include');
const rename      = require("gulp-rename");

const postcss  = require("postcss")
const atImport = require("postcss-import")

const rollup      = require('rollup');
const commonjs    = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const rollupJSON  = require('rollup-plugin-json');

class Organizer{

    build(loader, progress){
        return new Promise((resolve, reject)=>{
            this.processConfigJSONs(loader.getPageConfigJSONs())
            .then(()=>{
                progress({
                    percent: 0.3,
                    info: '页面配置文件处理完毕'
                });
                // 处理html文件
                return this.processHTMLFiles(loader.getHTMLItems());
            })
            .then(()=>{
                progress({
                    percent: 0.5,
                    info: 'html文件合并完成'
                });
                // 处理 css 文件
                return this.processCSSFiles(loader.getCSSItems());
            })
            .then(()=>{
                progress({
                    percent: 0.7,
                    info: 'css文件合并完成'
                });
                return this.processJSFiles(loader.getJsItems());
            })
            .then(()=>{
                progress({
                    percent: 1,
                    info: 'js文件打包完成'
                });
                resolve();
            })
            .catch(reject);
        });
    }

    processConfigJSONs(configJSONs){
        return new Promise((resolve, reject)=>{
            for(let item of configJSONs){
                fs.ensureDirSync(item.outputPath);
                const targetPath = path.join(item.outputPath, 'config.json');
                fs.copySync(item.path, targetPath);
            }
            resolve();
        })
    }

    processHTMLFiles(htmlItems){
        return new Promise((resolve, reject)=>{
            for(let item of htmlItems){
                if(!fs.existsSync(item.path)){
                    return reject(`${item.path} 不存在`);
                }

                const zipFinish = (file, cb)=> {
                    resolve();
                    cb(null, file);
                };

                vfs.src(item.path)
                .pipe(fileinclude({
                    prefix: '@@',
                    basepath: '@file'
                }))
                .pipe(rename(function (path) {
                    if(item.name.endsWith('.html')){
                        item.name = item.name.replace('.html','');
                    }
                    path.basename = item.name;
                }))
                .pipe(vfs.dest(item.outputPath))
                .pipe(mapStream(zipFinish));
            }
        });
    }

    processCSSFiles(cssItems){
        return new Promise((resolve, reject)=>{
            const processCSS = postcss().use(atImport());
            let tasks = [];
            for(let item of cssItems){
                const css = fs.readFileSync(item.path, "utf8");
                const task = processCSS.process(css, {from: item.path});
                tasks.push(task);
            }

            Promise.all(tasks)
            .then((results)=>{
                for(let i = 0; i < results.length; i++){
                    const item = cssItems[i];
                    const css  = results[i];
                    fs.ensureDirSync(item.outputPath);
                    const outputPath = path.join(item.outputPath, 'main.css');
                    fs.writeFileSync(outputPath, css);
                }
                resolve();
            }).catch(reject);
        });
        
    }

    processJSFiles(jsItems){
        return new Promise((resolve, reject)=>{
            const tasks   = [];
            const options = [];
            for(let item of jsItems){
                const option = {
                    input: item.path,
                    output: {
                        file: path.join(item.outputPath, 'main.js'),
                        format: 'cjs'
                    },
                    plugins: [ 
                        rollupJSON(),
                        nodeResolve({
                            mainFields: ['module', 'main'],
                        }),
                        commonjs()
                     ]
                }

                options.push(option);
                tasks.push(rollup.rollup(option));
            }

            Promise.all(tasks)
            .then((bundles)=>{
                const finalTasks = [];
                for(let i = 0; i < bundles.length; i++){
                    const bundle = bundles[i];
                    const option = options[i];
                    finalTasks.push(bundle.write(option.output));
                }

                return Promise.all(finalTasks);
            })
            .then(resolve)
            .catch(reject);
        });
    }
}

module.exports = Organizer;
