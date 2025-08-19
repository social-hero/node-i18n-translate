// # Copyright (C) [2025] [zhanggj]
// #
// # This program is free software: you can redistribute it and/or modify
// # it under the terms of the GNU General Public License as published by
// # the Free Software Foundation, either version 3 of the License, or
// # (at your option) any later version.
// #
// # This program is distributed in the hope that it will be useful,
// # but WITHOUT ANY WARRANTY; without even the implied warranty of
// # MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// # GNU General Public License for more details.
// #
// # You should have received a copy of the GNU General Public License
// # along with this program.  If not, see <https://www.gnu.org/licenses/>.
// 本脚本是为了将zh的json内容翻译到en的json中
// 之所以不用翻译文本是因为，会导致顺序错误，

// 引入必要的模块
const { Translate } = require('@google-cloud/translate').v2 // Google翻译API客户端
const fs = require('fs').promises// 文件系统模块，使用Promise版本
const path = require('path') // 路径处理模块
let fileType=""

/**
 * 将JavaScript对象转换为格式化的字符串表示
 * @param {Object} obj - 要转换的对象
 * @param {number} indent - 缩进空格数
 * @returns {string} - 格式化后的字符串
 */
function objectToString(obj, indent = 2) {
  const spaces = ' '.repeat(indent)
  let result = '{\n'
  for (const [key, value] of Object.entries(obj)) {
    result += spaces
    // 处理键
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
      result += key
    } else {
      result += `'${key}'`
    }
    result += ': '
    // 处理值
    if (value === null) {
      result += 'null'
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      result += objectToString(value, indent + 2)
    } else if (Array.isArray(value)) {
      result += JSON.stringify(value, null, indent)
    } else if (typeof value === 'string') {
      result += `'${value.replace(/'/g, "\\'")}'`
    } else {
      result += value
    }
    result += ',\n'
  }
  result = result.slice(0, -2) + '\n' // 移除最后的逗号和换行符
  result += ' '.repeat(Math.max(0, indent - 2)) + '}'
  return result
}
// 初始化Google翻译客户端
// mark修改配置文件
const translate = new Translate({
  projectId: 'cogent-cocoa-458303-g0', // Google Cloud项目ID
  keyFilename: path.resolve(__dirname, 'service-account-key.json') // 指定密钥文件路径
})

/**
 * 递归翻译对象中的所有字符串值
 * @param {Object} sourceObj - 源语言对象
 * @param {Object} targetObj - 目标语言对象 (用于检查现有翻译)
 * @param {string} sourceLang - 源语言代码
 * @param {string} targetLang - 目标语言代码
 * @returns {Promise<Object>} - 翻译后的对象
 */
async function translateNestedObject (sourceObj, targetObj, sourceLang, targetLang) {
  // 初始化翻译的总字符数，用于估算成本或使用量
  let totalCharacters = 0
  // 深拷贝目标对象，避免直接修改传入的 targetObj
  // JSON.parse(JSON.stringify(obj)) 是一种常见的深拷贝方法，但有局限性（例如无法处理函数、Date对象等）
  const result = JSON.parse(JSON.stringify(targetObj))

  /**
   * 内部递归函数，用于遍历和翻译对象
   * @param {Object} src - 当前层级的源对象
   * @param {Object} target - 当前层级的目标对象（用于写入翻译结果）
   * @param {string} currentPath - 当前遍历到的路径（用于日志记录）
   */
  async function translateRecursive (src, target, currentPath = '') {
    // 遍历源对象的每个键
    for (const key in fileType===".js"?src[sourceLang]:src) {
      // 获取源对象中当前键的值
      const sourceValue = src[key]
      // 获取目标对象中对应键的值，如果目标对象或键不存在，则为 undefined
      const targetValue = target ? target[key] : undefined
      // 构建当前值的完整路径，例如 "a.b.c"
      const newPath = currentPath ? `${currentPath}.${key}` : key
      // 检查源值是否是数组
      if (Array.isArray(sourceValue)) {
        // 确保目标中对应的是数组
        if (!Array.isArray(targetValue)) {
          target[key] = []
        }
        // 遍历源数组
        for (let i = 0; i < sourceValue.length; i++) {
          const item = sourceValue[i]
          const targetItem = target[key][i]
          const itemPath = `${newPath}[${i}]`

          if (typeof item === 'object' && item !== null) {
            // 如果数组元素是对象，递归处理
            if (typeof targetItem !== 'object' || targetItem === null) {
              target[key][i] = {}
            }
            await translateRecursive(item, target[key][i], itemPath)
          } else if (typeof item === 'string') {
            // 如果数组元素是字符串，进行翻译
            if (targetItem === undefined || targetItem === '') {
              try {
                const [translation] = await translate.translate(item, {
                  from: sourceLang,
                  to: targetLang
                })
                console.log('翻译结果 (数组项) :>> ', item, translation)
                target[key][i] = translation
                totalCharacters += item.length + (translation ? translation.length : 0)
                console.log(`Translated: ${itemPath} -> ${translation}`)
              } catch (error) {
                console.error(`Failed to translate array item "${itemPath}":`, error)
                target[key][i] = item // 翻译失败保留原值
              }
            } else {
              // 保留已有的翻译
              target[key][i] = targetItem
            }
          } else {
            // 其他类型直接复制
            target[key][i] = item
          }
        }
      } else if (typeof sourceValue === 'object' && sourceValue !== null) {
        // 如果源值是对象（但不是数组），则需要递归处理
        // 检查目标对象中对应的值是否不是对象，或者为 null
        if (typeof targetValue !== 'object' || targetValue === null) {
          target[key] = {} // 在目标对象中创建对应的空对象
        }
        // 递归调用，处理下一层级的对象
        await translateRecursive(sourceValue, target[key], newPath)
      } else if (typeof sourceValue === 'string') {
        // 如果源值是字符串
        // 检查目标值是否不存在 (undefined) 或为空字符串 ('')
        // 只有在这种情况下，才需要进行翻译，以避免覆盖已有的翻译
        
        if (targetValue === undefined || targetValue === '') {
          try {
            // 调用 Google Translate API 进行翻译
            const [translation] = await translate.translate(sourceValue, {
              from: sourceLang, // 指定源语言
              to: targetLang // 指定目标语言
            })
            console.log('翻译结果 :>> ', sourceValue, translation)
            // 将翻译结果写入目标对象
            target[key] = translation
            // 累加翻译的字符数（源字符串长度 + 翻译后字符串长度）
            // 注意：这只是一个估算值
            totalCharacters += sourceValue.length + (translation ? translation.length : 0)
            // 打印翻译日志
            console.log(`Translated: ${newPath} -> ${translation}`)
          } catch (error) {
            // 如果翻译过程中发生错误
            console.error(`Failed to translate "${newPath}":`, error)
            // 翻译失败时，将源字符串的值赋给目标对象，以保留原文
            target[key] = sourceValue
          }
        } else {
          // 如果目标值已存在且不为空字符串，则保留目标值，不进行翻译
          target[key] = targetValue
        }
      } else {
        // 对于非对象、非字符串、非数组类型（例如数字、布尔值、null）
        // 直接将源值复制到目标对象
        target[key] = sourceValue
      }
    }
  }

  await translateRecursive(sourceObj, result)
  console.log(`Total characters translated (estimated): ${totalCharacters}`)
  return result
}

/* * 翻译文件函数
 * @param {string} sourceLang - 源语言代码(如'en')
 * @param {string} targetLang - 目标语言代码(如'zh')
 * @param {string} sourcefilePath - 翻译来源的JSON文件路径（例如：zh.json）
 * @param {string} targetLangPath - 翻译后需要输出的json文件路径（例如 en.json）
 */
async function translateFile (sourceLang, targetLang, sourcefilePath, targetLangPath) {
  try {
    // 读取并解析翻译文件（支持JSON和JS文件）
    const sourceData = await fs.readFile(sourcefilePath, 'utf8')
    let sourceTranslations
    if (path.extname(sourcefilePath) === '.json') {
      sourceTranslations = JSON.parse(sourceData)
    } else if (path.extname(sourcefilePath) === '.js') {
      // 提取JS文件中的对象
      const match = sourceData.match(/const\s+\w+\s*=\s*({[\s\S]*?})\s*export\s+default/)
      if (match) {
        sourceTranslations = eval('(' + match[1] + ')')
      } else {
        throw new Error('无法解析JS文件中的翻译对象')
      }
    } else {
      throw new Error('不支持的文件格式：' + path.extname(sourcefilePath))
    }

    let targetTranslations = {}
    try {
      const targetData = await fs.readFile(targetLangPath, 'utf8')
      // 尝试读取目标文件，如果不存在或无效则创建一个空对象
      if (path.extname(targetLangPath) === '.json') {
        targetTranslations = JSON.parse(targetData)
      } else if (path.extname(targetLangPath) === '.js') {
        // 提取JS文件中的对象
        const match = targetData.match(/const\s+\w+\s*=\s*({[\s\S]*?})\s*export\s+default/)
        if (match) {
          targetTranslations = eval('(' + match[1] + ')')
        } else {
          throw new Error('无法解析JS文件中的翻译对象')
        }
      } else {
        throw new Error('不支持的文件格式：' + path.extname(sourcefilePath))
      }
    } catch (readError) {
      if (readError.code !== 'ENOENT') {
        console.warn(`Warning: Could not read or parse target file ${targetLangPath}. Starting with an empty object. Error: ${readError.message}`)
      } else {
        console.log(`Target file ${targetLangPath} not found. Creating a new one.`)
      }
      targetTranslations = {} // 初始化为空对象
    }

    // 使用递归函数进行翻译
    const updatedTranslations = await translateNestedObject(sourceTranslations, targetTranslations, sourceLang, targetLang)

    // 将更新后的翻译写回文件（支持JSON和JS文件格式）
    let outputContent
    fileType=path.extname(targetLangPath).slice(1)
    if (path.extname(targetLangPath) === '.json') {
      outputContent = JSON.stringify(updatedTranslations, null, 2)
    } else if (path.extname(targetLangPath) === '.js') {
      outputContent = `const ${targetLang} = ${objectToString(updatedTranslations)}\n\nexport default ${targetLang}\n`
    } else {
      throw new Error('不支持的输出文件格式：' + path.extname(targetLangPath))
    }
    await fs.writeFile(targetLangPath, outputContent)
    // 打印更新日志
    console.log(`Updated ${targetLangPath}.`)
  } catch (error) {
    // 处理文件操作或解析错误
    console.error(`Error processing file translation from ${sourcefilePath} to ${targetLangPath}:`, error)
  }
}

/**
 * 主函数 - 执行翻译任务
 */
async function main () {
  const args = process.argv.slice(2) //获取对应node命令参数
  
  // 设置翻译参数
  let sourceLang = 'zh' // 源语言:英语
  let targetLang = 'en' // 目标语言:中文
  // 解析目标文件路径
  let sourcefilePath = path.resolve('')
  let targetLangPath = path.resolve('')
  console.log('args :>> ', args)
  // 源语言 +源文件+目标语言+目标文件
  if (args.length >= 2) {
    sourceLang = args[0]
    sourcefilePath = path.resolve(args[1])
    if (args.length >= 3) {
      targetLang = args[2]
    }
    if (args.length >= 4) {
      targetLangPath = path.resolve(args[3])
    } else {
      //mark 获取父路径
      const parentDir = path.dirname(path.dirname(sourcefilePath));
      // mark 本处相对定制化生成指定路径下的翻译文件
     targetLangPath = path.join(parentDir, targetLang, 'translation.json');
    }
  } else {
    console.log('用法: node translate.cjs <源语言> <源文件路径> [目标语言] [目标文件路径（为空就会自动创建）]')
    console.log('例如: node translate.cjs zh /public/locales/zh/translation.json en ')
    // 这行代码的作用是终止Node.js进程并返回状态码1。
  
    // 通常，状态码1表示程序遇到了无法恢复的错误或异常。
    process.exit(1)
  }

  // 执行翻译
  await translateFile(sourceLang, targetLang, sourcefilePath, targetLangPath)
}
// 启动程序并捕获错误
main().catch(console.error)
