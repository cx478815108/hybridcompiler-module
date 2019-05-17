const fs           = require('fs-extra');
const path         = require('path');
const HTMLDocument = require('./dom/HTMLDocument');
const Util         = require("./utils/Util");
const DOMAnalyse   = require('./utils/DOMAnalyse');
const Zip          = require('./utils/Zip');
const CommonStore  = require('./utils/CommonStore')
const fsTool       = require('./utils/FSTool');
const vfs          = require('vinyl-fs');
const zip          = require('gulp-zip');
const rename       = require("gulp-rename");
const mapStream    = require('./utils/mapStream');

class Compiler{

    build(configJSON, process){
        return new Promise((resolve, reject)=>{
            this.startCompile(configJSON, process, resolve);
        });
    }

    startCompile(configJSON, process, callBack){
        const productionPath = path.join(configJSON.workDirectory, 'production');
        // 1. 确保production 文件夹为空 ，不存在则会创建
        fs.emptyDirSync(productionPath);
        
        // 2.  首先对每个页面进行编译生成production.json 保存到对应的目录下
        const cwd  = path.join(configJSON.workDirectory, 'dist');
        
        process({
            percent: 0.1,
            info: '编译主页面...'
        });

        // 2.1 编译主页面并保存
        const mainPagePath   = path.join(cwd, 'mainPage');
        const productionJSON = this.compileSinglePage(mainPagePath);
        const saveText       = JSON.stringify(productionJSON);
        fs.writeFileSync(path.join(productionPath, 'production.json'), saveText);

        const jsPath = path.join(mainPagePath, 'main.js');
        fs.copySync(jsPath, path.join(productionPath, 'main.js'));

        const configJSONPath = path.join(mainPagePath, 'config.json');
        fs.copySync(configJSONPath, path.join(productionPath, 'config.json'));

        // 2.2 编译其他页面并保存
        const dirs = fsTool.getChildDirectory(path.join(cwd, 'otherPages'));
        if(dirs.length){
            process({
                percent: 0.6,
                info: '编译其他页面...'
            });
        }
        for(let dir of dirs){
            const pageFolderName = path.basename(dir);
            const savePath = path.join(productionPath, pageFolderName);
            fs.ensureDirSync(savePath);

            const productionJSON = this.compileSinglePage(dir);
            const saveText = JSON.stringify(productionJSON);
            fs.writeFileSync(path.join(savePath, 'production.json'), saveText);

            const jsPath = path.join(dir, 'main.js');
            fs.copySync(jsPath, path.join(savePath, 'main.js'));

            const configJSONPath = path.join(dir, 'config.json');
            fs.copySync(configJSONPath, path.join(savePath, 'config.json'));
        }

        // 3. 对assets文件夹进行复制
        const assetsPath = path.join(cwd, 'assets');
        if(fs.existsSync(assetsPath) && fs.lstatSync(assetsPath).isDirectory()){
            fs.copySync(assetsPath, path.join(productionPath, 'assets'));
        }

        // 4. 将tokenhybrid.config.json 复制进去
        const projConfigName = 'tokenhybrid.config.json';
        const projConfigPath = path.join(configJSON.workDirectory, projConfigName);
        if(fs.existsSync(projConfigPath)){
            fs.copySync(projConfigPath, path.join(productionPath, projConfigName));
        }

        process({
            percent: 0.9,
            info: '正在打包...'
        });
        
        const zipFinish = (file, cb)=> {
            callBack();
            cb(null, file);
        };
        
        // 压缩打包必要的文件
        vfs.src(`${productionPath}/**/*`)
        .pipe(zip('production.zip'))
        .pipe(vfs.dest(productionPath))
        .pipe(mapStream(zipFinish))
    }

    compileSinglePage(pageFolder){
        const pageConfigJSONPath = path.join(pageFolder, 'config.json');
        const pageConfigJSON = JSON.parse(fs.readFileSync(pageConfigJSONPath).toString());

        const cssPath  = path.join(pageFolder, 'main.css');
        const cssText  = fs.readFileSync(cssPath).toString();
        const cssRules = Util.parseCSSString(cssText);

        const htmlPath = path.join(pageFolder, 'main.html');
        const htmlText = fs.readFileSync(htmlPath).toString();

        const styleStore   = new CommonStore();
        const layoutStore  = new CommonStore();

        const mainPageJSON = this.createPageJSON(htmlText, cssRules, styleStore, layoutStore);
        
        const folders    = path.join(pageFolder, 'modalPages');
        const modalHTMLs = fsTool.getFiles(folders, '.html');
        
        const widgetNodes = {};
        for(let htmlPath of modalHTMLs){
            const modalName = path.basename(htmlPath).split('.')[0];
            const htmlText  = fs.readFileSync(htmlPath).toString();
            const modalJSON = this.createPageJSON(htmlText, cssRules, styleStore, layoutStore);
            widgetNodes[modalName] = modalJSON;
        }

        return {
            rootNode:mainPageJSON,
            widgetNodes,
            styleStore: styleStore.getJSONObj(),
            layoutStore: layoutStore.getJSONObj(),
            config: pageConfigJSON
        }
    }

    createPageJSON(htmlText, cssRules, styleStore, layoutStore){
        // 创建dom
        let document = this.createDOM(htmlText);
        document = this.createRenderTree(document, cssRules)
        // 必须先 processDOMAttributes
        document = this.processDOMAttributes(document, styleStore, layoutStore);
        // 要应用到上一次的 forloop 动态attributes等
        document = this.analyseDOM(document)

        // 对json进行压缩处理
        let zipedTreeJSON = Zip(document.rootNode);
        return zipedTreeJSON;
    }

    createDOM(htmlText){
        const document = new HTMLDocument();
        document.createDOM(htmlText);
        return document;
    }

    createRenderTree(document, cssRules){
        for (const selectors in cssRules) {
            const selectorList = selectors.split(" ");
            const style = cssRules[selectors];
            
            selectorList.forEach((selector) => {
                // 根据 selector 寻找匹配的nodes 
                const nodes = document.findAll(selector);
                // nodes 将css rules合并进去
                nodes.forEach((node) => {
                    node.addCSSStyle(style);
                });
            });
        }

        return document;
    }

    analyseDOM(document){
        const domAnalyse = new DOMAnalyse();
        domAnalyse.startAnalyse(document);
        return document;
    }

    processDOMAttributes(document, styleStore, layoutStore){
        const rootNode = document.rootNode;
    
        const nodeWalker = (xmlNode, func) => {        
            // 给外界处理
            func(xmlNode);

            // 递归处理
            xmlNode.children.forEach((childNode) => {
                nodeWalker(childNode, func);
            });
        }

        nodeWalker(rootNode, (xmlNode)=>{
            // 开始调整node的属性
            xmlNode.processAttributes();

            if (Object.keys(xmlNode.layout).length) {
                xmlNode.layoutKey = layoutStore.store(xmlNode.layout);
                delete(xmlNode.layout);
            }
            
            if (Object.keys(xmlNode.style).length) {
                xmlNode.styleKey = styleStore.store(xmlNode.style);
                delete(xmlNode.style);
            }

            // 处理完毕
            // xmlNode.processFinish();
        });

        return document;
    }
}

module.exports = Compiler;