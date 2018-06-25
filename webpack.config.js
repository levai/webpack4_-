const webpack = require('webpack') // 引入webpack
const path = require('path') // 引入路径模块
const glob = require('glob')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin') // 引入自动删除指定目录插件
const CopyWebpackPlugin = require('copy-webpack-plugin') // 引入静态资源拷贝插件
const MiniCssExtractPlugin = require('mini-css-extract-plugin') // 处理css

// 定义路径
const distPath = 'dist'
// 判断环境变量
const isDev = process.env.NODE_ENV === 'development'

function resolve (dir) {
  return path.join(__dirname, dir)
}

// 获取入口文件
const entries = glob.sync('./src/**/index.js')
const entrys = {}
const htmlPlugins = []
// 量产html
for (const path of entries) {
  const template = path.replace('index.js', 'index.html')
  // const chunkName = (path.slice('./src/pages/'.length, -'/index.js'.length)).replace(/\//g, '_');
  var chunkName = (/.*\/(pages\/.*?\/index)\.js/.exec(path)[1]).replace(/pages\//g, '')
  // 生成入口文件
  entrys[chunkName] = path
  // 生成页面模板文件
  htmlPlugins.push(new HtmlWebpackPlugin({
    template,
    filename: chunkName + '.html',
    chunksSortMode: 'none',
    chunks: [chunkName, 'assets/public/common'],
    // favicon: './favicon.ico',
    inject: true,
    hash: false, // 开启hash  ?[hash]
    minify: isDev ? false : {
      removeComments: true, // 移除HTML中的注释
      collapseWhitespace: true, // 折叠空白区域 也就是压缩代码
      removeAttributeQuotes: false // 去除属性引用
    }
  }))
}

const common = {
  'assets/public/common': ['jquery', './src/css/a.css'] // 用到什么公共lib（例如jquery.js），就把它加进vendor去，目的是将公用库单独提取打包
}

// base config
const config = {
  target: 'web',
  resolve: {
    extensions: ['.js'],
    alias: {
      'js': resolve('src/js'),
      'images': resolve('src/images'),
      'css': resolve('src/css')
    } // 配置别名可以加快webpack查找模块的速度
  },
  entry: Object.assign({}, entrys, common),
  output: {
    filename: '[name].min.js',
    path: resolve(distPath)
  },
  module: {
    rules: [{
      test: require.resolve('jquery'),
      use: [{
        loader: 'expose-loader',
        // 暴露出去的全局变量的名称 随便你自定义
        options: 'jQuery'
      },
      {
        loader: 'expose-loader',
        options: '$'
      }
      ]
    },
    { // html
      test: /\.(htm|html)$/i,
      loader: 'html-withimg-loader'
    },
    { // js
      test: /\.js$/,
      exclude: /node_modules/,
      include: resolve('src'),
      use: [{
        loader: 'babel-loader',
        options: {
          cacheDirectory: true // 使用缓存
        }
      }]
    },
    { // css
      test: /\.css$/,
      use: [MiniCssExtractPlugin.loader, {
        loader: 'css-loader',
        options: {
          importLoaders: 1,
          minimize: true
        }
      }, 'postcss-loader']
    },
    { // less
      test: /\.less$/,
      use: [MiniCssExtractPlugin.loader, {
        loader: 'css-loader',
        options: {
          importLoaders: 1,
          minimize: true
        }
      }, 'postcss-loader', 'less-loader']
    },
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
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].min.css'
    }),
    ...htmlPlugins,
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: isDev ? '"development"' : '"production"'
      }
    }),
    new webpack.ProvidePlugin({ jQuery: 'jquery', $: 'jquery' })
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        common: { // 抽离第三方库
          test: /node_modules/,
          chunks: 'initial',
          name: 'assets/public/common',
          priority: 10
        }
      }
    }
  }
}

if (isDev) { // 开发环境配置
  config.devtool = '#cheap-module-eval-source-map'
  config.devServer = {
    contentBase: resolve(distPath),
    port: 8080,
    host: '0.0.0.0',
    overlay: {
      errors: true
    },
    hot: true
  }
  // 配合热加载
  config.plugins.push(
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  )
} else { // 生产环境
  config.plugins.push(
    new CleanWebpackPlugin(resolve('dist')), // 自动删除指定目录文件配置
    new CopyWebpackPlugin([ // 支持输入一个数组, 静态资源引入拷贝
      {
        from: resolve('src/assets'), // 将src/assets下的文件
        to: './assets' // 复制到dist目录下的assets文件夹中
      }
    ])
  )
}

module.exports = config
