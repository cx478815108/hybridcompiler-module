const VarExtract        = require('../utils/VarExtract');
const Util              = require("../utils/Util");
const HTMLAttributesMap = require('./HTMLAttributesMap');
const CSSAttributesMap  = require('./CSSAttributesMap');
const md5               = require("blueimp-md5");

let uid = 0;
const UniqueIdAlloc = ()=>{
    return uid++;
}

const copyJSON = (json)=>{
    return JSON.parse(JSON.stringify(attrs));
}

const TokenInstructions = {
    bind      : "@bind",
    tableData : "t:data",
    for       : "t:for"
}

module.exports = class HTMLNode{
    
    constructor(){
        // 明确指明每个属性
        this.uid              = UniqueIdAlloc();
        this.id               = "";
        this.tagName          = "";
        this.text             = "";
        this.forPath          = "";
        this.component        = "";
        this.bind             = "";
        this.children         = [];
        this.parent           = null;

        this.forKeyPath       = null;
        this.dynamicAttrs     = {};
        this.dynamicAttrsData = {};
        this.textData         = [];
        this.attributes       = {};
        this.clickInfo        = {};
        this.fontStyle        = {};
        this.forLoop          = {};
        this.layout           = {};
        this.style            = {};

        this.isDynamicText = false;
        this.isForNode     = false;
        this.autoHeight    = false;
        this.autoWidth     = false;
        this.stickyX       = false;
        this.stickyY       = false;
        this.static        = true;
    }

    addChildNode(node){
        if(!node) return ;
        node.parent = this;
        this.children.push(node);
    }

    addCSSStyle(cssStyle){
        this.style = Object.assign(cssStyle, this.style);
    }

    // 此接口由外界调用
    processAttributes(){
        this.id   = this.attributes["id"] || '';
        this.bind = this.attributes[TokenInstructions.bind] || '';
        
        // 解析@click 指令
        this.processClickString();
        // 解析t:for指令
        this.processForExpression();
        // 将style解析成CSS
        this.processStyleString();

        // 将style里面和font有关的信息提取出来
        this.processFontInfoAttributes();
        // 将flex 布局有关的属性抽取出来
        this.processLayoutAttributes();
        
        // 将 color:red 转化为rgb(255, 0, 0);
        this.processStyleColors();
        // 将'true','false' 转化为 '1,'0'
        this.processBoolValue();
        // 对数据做映射 将字符串枚举转换为数字
        this.processValueReflect();
        // 为native做调整
        this.processAttributesForNative();
        
        // 抽取'{{}}'包围的动态指令
        this.processDynamicAttributes();
        // 判断是否是静态node
        this.processStatic();
        // 对this.attributes属性做修整，去除多余的
        this.processTrimAttributes();
    }

    processStyleString() {
        const styleString = this.attributes['style'];
        if(!styleString) return ;
        const style = Util.parseStyleString(styleString);
        this.style  = Object.assign(style, this.style);
    }

    processClickString(){
        const text = this.attributes['@click'];
        if(!text) return ;
        this.clickInfo = Util.parseClickString(text);
    }

    processForExpression(){
        let forExp = this.attributes[TokenInstructions.for];
        if (forExp && forExp.length) {
            this.isForNode = true;
            this.static    = false;
            this.forLoop   = Util.parseForString(forExp);
        }

        forExp = this.attributes[TokenInstructions.tableData];
        const list = ['table','flowlist'];
        if (forExp && forExp.length && list.includes(this.tagName)) {
            this.isForNode = false;
            this.static    = false;
            this.forLoop   = Util.parseForString(forExp);
        }
    }

    processFontInfoAttributes() {
        const fontStyle    = {};
        const textAlignKey = 'text-align';
        const map          = {'left':0, "center":1, "right":2};
        
        for(let key in this.style){
            if (CSSAttributesMap.fontAttributes[key]) {
                if(key === textAlignKey) {
                    fontStyle[key] = map[this.style[key].trim()];
                }
                else {
                    fontStyle[key] = this.style[key].replace('px','').trim();
                }
                delete(this.style[key]);
            }
        }

        if (Object.keys(fontStyle).length){
            fontStyle.md5 = md5(JSON.stringify(fontStyle));
            this.fontStyle = fontStyle;
        }
    }

    processLayoutAttributes(){
        const layout = {};
        for (const key in this.style) {
            const ele = this.style[key];
            if(CSSAttributesMap.flexAttributes[key]){
                layout[key.trim()] = ele.trim().replace("px","");
                delete(this.style[key]);
            }
        }
        this.layout = layout;
    }

    processAttributesForNative(){
        const layout = this.layout;
        const width  = layout['width'];
        const height = layout['height'];
        
        if(width === 'auto'){
            this.autoWidth = true;
        }

        if(height === 'auto'){
            this.autoHeight = true;
        }

        if(width && width.includes("calc")){
            layout['@width'] = Util.parseCalcString(width,"sw");
            delete(this.layout['width']);
        }

        if(height && height.startsWith("calc")){
            layout['@height'] = Util.parseCalcString(height,"sh");
            delete(this.layout['height']);
        }

        const sticky = this.attributes['stickyLayout'];
        if(sticky === "true" || sticky === "1") {
            if(layout['left'] || layout['right']){
                this.stickyX = true;
            }
            if(layout['top'] || layout['bottom']){
                this.stickyY = true;
            }
        }
    }

    processStyleColors(){
        const props = ['background-color','color','border-color','highlight-color'];
        for(let prop of props){
            const val = this.style[prop];
            if(val && !val.startsWith('rgb')){
                let rgbVal = Util.parseSpecificColor(val);
                if(rgbVal){
                    this.style[prop] = rgbVal;
                }
            }
        }
    }

    processValueReflect(){
        // 对数据进行映射 example: roundedRect -> 3
        for (const key in HTMLAttributesMap) {
            const map = HTMLAttributesMap[key];
            const val = this.attributes[key];
            if (val) {
                this.attributes[key] = '' + map[val];
            }
        }
    }

    processBoolValue(){
        for (const key in this.attributes) {
            const val = "" + this.attributes[key];
            if (val === "true") {
                this.attributes[key] = "1";
            }
            else if (val === "false"){
                this.attributes[key] = "0";
            }
        }
    }

    processDynamicAttributes(){
        for (const key in this.attributes) {
            const element = this.attributes[key];
            if (element.startsWith('{{') && element.endsWith('}}')) {
                this.static = false;
                this.dynamicAttrs[key] = element;
            }
        }
    }

    processTrimAttributes(){
        delete(this.attributes["style"]);
        delete(this.attributes['@click']);
        delete(this.attributes['stickyLayout']);
        delete(this.attributes['class']);
        
        for (const key in TokenInstructions) {
            const val = TokenInstructions[key];
            delete(this.attributes[val]);
        }

        for (const key in this.dynamicAttrs) {
            delete(this.attributes[key]);
        }
    }

    processStatic(){
        const list = VarExtract.parse(this.text);
        for(let item of list){
            if(item.type === 1) {
                this.isDynamicText = true;
                this.static = false;
                break;
            }
        }

        if(Object.keys(this.dynamicAttrs).length){
            this.static = false;
        }

        if(Object.keys(this.dynamicAttrs).length){
            this.static = false;
        }
    }

    // 此接口由外界调用
    processFinish(){
        
    }
}