const Generator = require('yeoman-generator');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const fse = require('fs-extra');
const glob = require("glob-promise");

const copyFiles = async(src, dest) => {
    console.log("src: ", src);
    console.log("dest: ", dest);
    // package.json 和 模板文件不拷贝，后续单独处理
    const files = await glob(`${src}/**/!(package.json|index.html)`, { nodir: true });
    console.log('将要拷贝：', files);

    files.forEach(async (file) => {
        const dir = path.relative(src, file);
        await fse.copy(file, path.join(dest, dir), { overwrite: true });
    });

    // .gitignore 点开头的文件单独拷贝
    await fse.copySync(`${src}/.gitignore`, `${dest}/.gitignore`, { overwrite: true });
};

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);

        // 这里写自己的业务代码
        // 执行 yo test my-first-yo-project
        // options支持：type，require，default，desc
        this.argument("appname", { type: String, required: true });
        this.log('appname: ', this.options.appname);   // my-first-yo-project

        // 执行 yo test my-first-yo-project --ts
        // options支持：type，alias，default，desc，hide
        this.option("ts");
        this.log("options: ", this.options.ts);        // true

        this.log(chalk.bold.green('执行 app 模板'));
        if (fs.existsSync('src')) {     // 检查脚手架是否已经存在
            this.log(chalk.bold.green('src 目录已存在，资源已经初始化，退出...'));
            process.exit(1);
        }
        this.myInfo = null;
        this.config.save();             // 生成 .yo-rc.json 文件。Yeoman通过这个文件知道该目录是根目录
    }

    prompting() {
        const questions = [
            {
                name: 'projectAssets',
                type: 'list',
                message: '请选择模板:',
                choices: [
                    {
                        name: 'PC',
                        value: 'pc',
                        checked: true
                    },{
                        name: 'App',
                        value: 'app'
                    }
                ]
            },
            {
                type: 'input',
                name: 'projectAuthor',
                message: '项目开发者',
                store: true,           // 记住用户的选择
                default: 'zhangxinlin'
            },
            {
                type: 'input',
                name: 'pageTitle',
                message: '页面标题',
                default: 'Your project title'
            }
        ];
        return this.prompt(questions).then((answers) => {
            this.log("answers: ", JSON.stringify(answers));     // 推荐用 this.log，而不是 console.log
            this.myInfo = answers;                              // 公共变量可以保存到 this 上，共后续方法使用
        });
    }

    async writing() {
        this.log(`开始将 ${this.sourceRoot()} 里的模板拷贝至 ${this.destinationRoot()} 目录中...`);

        // templates目录里，除模板文件外都无脑拷贝
        await copyFiles(path.join(__dirname, 'templates'), this.destinationRoot());

        // 开始处理模板文件
        this.fs.copyTpl (
            this.templatePath('package.json'),      // 默认路径就是 templates 目录
            this.destinationPath('package.json'),   // 目标文件夹的根目录下新建文件
            {
                projectName: this.options.appname,
                projectAuthor: this.myInfo.projectAuthor
            }
        );
        this.fs.copyTpl(
            this.templatePath('./src/index.html'),
            this.destinationPath('./src/index.html'),
            { title: this.myInfo.pageTitle }
        );

        const pkgJson = {
            devDependencies: {
                eslint: '^3.15.0'
            },
            dependencies: {
                react: '^16.2.0'
            }
        };
        this.fs.extendJSON(this.destinationPath('package.json'), pkgJson);
    }

    install() {
        this.installDependencies({
            yarn: true,
            npm: true,
            bower: false
        });
    }

    end() {
        this.log('脚手架安装完毕！');
    }
};
