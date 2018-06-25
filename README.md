##  webpack4 多页面学习
---
### `1.` 初始化项目新建项目目录webpack4-polyv
> 1.1 新建package.json文件，自动化产出 npm init 
> 
> 1.2 为规范开发，可以引入代码风格检测，这里我用的是eslint-standard，安装相关依赖，我这里用的是淘宝的镜像源，npm 访问太慢，原谅我不会翻墙。
```javascript
cnpm i 
eslint
eslint-config-standard
eslint-plugin-standard 
eslint-plugin-promise 
eslint-plugin-import 
eslint-plugin-node 
eslint-plugin-html -D
```
>相关依赖版本信息如下：
![](https://user-gold-cdn.xitu.io/2018/6/25/164362f9dfcb3ed5?w=396&h=264&f=jpeg&s=44720)
> 项目根目录下 新建.eslintrc文件，项目就开启了eslint检测，我用的是vscode，可以安装相关eslint插件
```javascript
{
  "extends": "standard",
  "plugins": [
    "html",
    "standard",
    "promise"
  ],
  "parser": "babel-eslint",
  "parserOptions": {
    "sourceType": "module"
  },
  "rules": { // 自定义规则，行尾增加分号；
    "semi": ["error", "always"]
    }
}
```
> eslint详细配置，可参考官网[ESLint - Pluggable JavaScript linter](https://eslint.org/)
>1.3 项目开发目录
>![](https://user-gold-cdn.xitu.io/2018/6/25/16436331c1748cc2?w=265&h=456&f=jpeg&s=30052)
---
### `2.` 配置项目的webpack.config.js配置
> 2.1 在项目根目录下新建webpack.config.js,引入相关模块
```javascript
const webpack = require('webpack'); // 引入webpack
const path = require('path'); // 引入路径模块
const glob = require('glob');
const HtmlWebpackPlugin = require('html-webpack-plugin');
```
> 2.2 获取多页面入口文件并生成html页面
```javascript
// 获取入口文件
const entries = glob.sync('./src/**/index.js');
const entrys = {};
const htmlPlugins = [];
// 量产html
for (const path of entries) {
  const template = path.replace('index.js', 'index.html');
  var chunkName = (/.*\/(pages\/.*?\/index)\.js/.exec(path)[1]).replace(/pages\//g, '');
  // 生成入口文件
  entrys[chunkName] = path;
  // 生成页面模板文件
  htmlPlugins.push(new HtmlWebpackPlugin({
    template,
    filename: chunkName + '.html',
    chunksSortMode: 'none',
    chunks: [chunkName, 'js/common'],
    // favicon: './favicon.ico',
    inject: true,
    hash: false, // 开启hash  ?[hash]
    minify: isDev ? false : {
      removeComments: true, // 移除HTML中的注释
      collapseWhitespace: true, // 折叠空白区域 也就是压缩代码
      removeAttributeQuotes: true // 去除属性引用
    }
  }));
}
```
> 2.3 全局配置jquery,之前按照网上的教程，jquery代码可以跑起来，但是在浏览控制台里运行报如下错误：
```javascript
new webpack.ProvidePlugin({
	$: 'jquery',
	jQuery: 'jquery'
})
感觉这么配置起来没问题，在控制打印就gg了...报错如下
```
>![](https://user-gold-cdn.xitu.io/2018/6/25/164363477817494f?w=425&h=107&f=jpeg&s=18208)
>为解决这个问题，查了一些资料，看到有大佬说用expose-loader可以完美解决。二话不说，激动的立马cnpm了
>
```javascript
cnpm install -D expose-loader

// 在webpack.config.js里配置后，搞定以上报错
    rules: [
      {
        // 通过require('jquery')来引入
        test: require.resolve('jquery'),
        use: [
          {
            loader: 'expose-loader',
            // 暴露出去的全局变量的名称 随便你自定义
            options: 'jQuery'
          },
          {
            // 同上
            loader: 'expose-loader',
            options: '$'
          }
        ]
      }]
```
---
### `3.` 复制静态文件至dist指定目录，打包前先删除原dist目录
> 3.1 这些功能实现，我们需要依赖两个插件copy-webpack-plugin，clean-webpack-plugin
```javascript
cnpm install -D clean-webpack-plugin clean-webpack-plugin
// 配置插件
new CleanWebpackPlugin(resolve('dist')), // 自动删除指定目录文件配置
new CopyWebpackPlugin([ // 支持输入一个数组, 静态资源引入拷贝
	{
		from: resolve('src/assets'), // 将src/assets下的文件
		to: './assets' // 复制到dist目录下的assets文件夹中
	}
])
```
---
### `4.` 处理less,css 文件，自动添加浏览器前缀
> 4.1 安装相关依赖
```javascript
cnpm install -D 
postcss-loader 
less less-loader 
mini-css-extract-plugin 
css-loader 
autoprefixer
```
> 4.2 在项目根目录新建.postcss.config.js，配置内容如下
 ```javascript
module.exports = {
  plugins: [
    require('autoprefixer')({
      browsers: ['cover 99.5% in CN']
    })
  ]
}
// 也可以在package.json 中配置，官方推荐模式
"browserslist": ["cover 99.5% in CN"]
```
> 4.3 在webpack.config.js 里配置规则和插件模式
 ```javascript
{
	test: /\.css$/,
	use: [
		MiniCssExtractPlugin.loader,
		'css-loader',
		'postcss-loader'
		]	
}
// 在plugins中配置
new MiniCssExtractPlugin({
		filename: '[name].min.css'
}),
```
> 4.4 npm run build 后，成功打包，但是html 图片资源路径加载出问题了。我这里使用了 html-withimg-loader 插件进行处理，css背景图路径问题，在图片处理规则中添加 publicPath: '../' 
 ```javascript
{ // html
	test: /\.(htm|html)$/i,
	loader: 'html-withimg-loader'
}

{ // images
	test: /\.(png|jpeg|jpg|gif|svg)(\?.*)?$/,
	use: [{
		loader: 'url-loader',
		options: { // options选项参数可以定义多大的图片转换为base64
			limit: 10 * 1024,
			name: 'assets/images/[name].[ext]',
			publicPath: '../' // 解决css背景图的路径问题
		}
	}]
}
```
> 4.5 成功打包的dist目录
> ![](https://user-gold-cdn.xitu.io/2018/6/25/16436353aad024b5?w=239&h=312&f=jpeg&s=23644)
> 
---
### `5.`导入公共的html文件
> 5.1 没有用其他模板语法来处理，在npm上找到了个html-withimg-loader，可以处理Html里图片资源路径问题和导入一些共用的html文件
 ```javascript
	// 安装相关依赖
cnpm instal html-withimg-loader -D
// 配置规则
{ // html
	test: /\.(htm|html)$/i,
	loader: 'html-withimg-loader'
}
// 在html文件中引用模板文件
	#include("../../layout/tpl_head.html")
```