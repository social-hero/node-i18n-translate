# node-i18n-translate
node-i18n-translate是一款多语言国际化工具,可轻松将本地化文件翻译成其他语言，主要适配vue和react框架的i18n结构，利用google翻译来对i18n的中文文档进行翻译，同时支持对js和json两种类型，配合react-i18next和i18next-scanner使用更佳。


## 安装步骤：（如果配合react-i18next使用更佳，单独使用也可）



- 安装node （本人使用的是v22.13.0）

- react-i18next

  ```bash
  npm install i18next react-i18next i18next-browser-languagedetector 
  ```



  ```jsx
  import { useTranslation } from 'react-i18next';
  //组件内
    const { t } = useTranslation();
  //模版内 预约演示为默认值
   <span>{t('hero.demo_button', '预约演示')}</span>
  ```

  

- i18next-scanner

  ```bash
  npm install i18next-scanner
  ```

  配置文件：

  ```js
  // 本脚本是为了扫描项目中使用的国际化的key，生成对应的zh.json文件，方便翻译人员翻译。
  module.exports = {
    input: [
      'src/**/*.{js,jsx,ts,tsx}',
      '!src/**/*.test.{js,jsx,ts,tsx}',
    ],
    output: './public',
    options: {
      debug: true,
      func: {
        list: ['t', 'i18n.t'],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
      lngs: ['zh'],
      defaultLng: 'en',
      resource: {
        loadPath: './locales/{{lng}}/translation.json',//翻译文件路径
        savePath: './locales/{{lng}}/translation.json',//翻译文件路径
        jsonIndent: 2,
      },
      defaultValue: '',
    },
  };
  ```

- 配置Google Cloud Translation API

  ```
  创建 Google Cloud 项目+启用 Translation API+创建服务账号+生成密钥：直接将，密钥文件放在和translate.cjs一个目录下（仓库中service-account-key文件为密钥示例，直接替换即可），然后在脚本里面配置即可，
  ```

- 安装本脚本

  ```javascript
  1、本脚本直接放在根目录即可。
  2、寻找cjs脚本内 //mark 注释来修改配置如下：
  // mark修改配置文件
  const translate = new Translate({
    projectId: 'cogent-cocoa-458303-g0', // Google Cloud项目ID
    // 第一个参数指的是当前路径，第二个参数是密钥文件名称，已经在仓库中放了示例
    keyFilename: path.resolve(__dirname, 'service-account-key.json') 
  })
  //mark 获取父路径
  const parentDir = path.dirname(path.dirname(sourcefilePath));
  // mark 本处相对定制化生成指定路径下的翻译文件
  targetLangPath = path.join(parentDir, targetLang, 'translation.json');
  ```

## 使用方法：

```markdown
1.例如当前组件为中文<span>预约演示</span>，使用trae或者cursor来帮助你改为指定的格式 <span>{t('hero.demo_button', '预约演示')}</span>
2.使用脚本 i18next-scanner --config i18next-scanner.config.cjs，他会直接生成指定的中文整合好的文档，例如本仓库的locales/zh/translation.json
//如果不配合react相关插件使用，也可以直接使用下方脚本
3.使用脚本 node translate.cjs zh public/locales/zh/translation.json en（用法: node translate.cjs <源语言> <源文件路径> [目标语言] [目标文件路径（为空就会自动创建）]）
```

#### 注：

#### 1、如果目标文档不存在，会自动创建

#### 2、如果目标文档value值已经存在，便会跳过翻译（针对定制化翻译很有效，同时尽量减少翻译损耗）

#### 3、同时支持json和js两种文档格式，具体样例可以看项目lang下和locales下的文件

#### 4、google翻译基础版本，每个账号每个月50w字符的翻译额度，如果翻译一半，额度满了，会将所翻译到的内容写入到指定文档，只要替换项目ID和密钥，重新启动即可

#### 5、各国语言采用通用单词即可，例如：zh，en，ru，ja等





## **翻译示例**：

##### js例子和json例子均已经放在项目中，分别是vue项目中的js格式，react项目中的json格式。具体请自用



## 许可证信息：

#### 本项目基于 GNU 通用公共许可证 v3.0 发布。详情请参阅 [LICENSE](LICENSE) 文件。

## 
