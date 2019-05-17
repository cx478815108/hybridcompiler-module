编译过程
文件配置描述

tokenhybrid.config.json 描述了App的相关信息
1. bundleID
2. App的名字
3. ...

config.json 代表每个页面的配置文件
1. 状态栏的颜色
2. 文本标题
3. ...

编译过程 
过程A：使用前段工具进行处理
1. 将 html 文件合并
2. 将 css 文件合并
3. 将js 进行打包

过程B：使用hybridcompiler 编译
1. 读取每个工程的mainPage文件夹 读取main.css文件， main.html文件生成渲染树， 生成production.json
2. 读取config.json合并进production.json 文件
3. 对modalPages 里面的所有.html文件进行编译使用main.css 生成渲染树 并写入production.json
4. 写入dist文件夹的/mainPage/production.json
5. 开始编译otherPages文件夹，该文件夹下的目录名即是以后跳转的路径名 重复以上1-4
6. 将assets文件夹拷贝过去
7. 打包成production.zip
