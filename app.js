const fs = require("fs")
const OpenAI = require("openai")
const openai = new OpenAI({
  apiKey: "",
})

const generateMessages = function (text, configArray) {
  let filterText = text.replace(/\n/g, "。")
  let langArray = configArray.map((config) => {
    return config.readtext
  })
  let messages = [
    {
      role: "system",
      content: `我正在为一个App 进行国际化，给你一句中文文案，请把文案翻译成 ${langArray.join(
        "、"
      )}。
      请注意：\n1. 文案的翻译应该简洁、清晰、明了，符合人们普遍使用app的习惯。\n2. 文案的输出应保持 xx语：xxx 这样的格式`,
    },
  ]
  messages.push({
    role: "user",
    content: filterText,
  })
  return messages
}

const translatedFunc = async (text, target) => {
  console.log(`----\n正在翻译 【${text}】...\n----`)
  let result = ""
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: generateMessages(text, target),
      temperature: 1,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    })
    result = response.choices[0].message.content || ""
  } catch (error) {
    console.error(error)
  }

  console.log(result)
  return result
}

const targetConfig = [
  {
    lang: "en",
    readtext: "英文",
  },
  {
    lang: "ja",
    readtext: "日语",
  },
  {
    lang: "id",
    readtext: "印尼语",
  },
  {
    lang: "ko",
    readtext: "韩语",
  },
  {
    lang: "ms",
    readtext: "马来语",
  },
  {
    lang: "vi",
    readtext: "越南语",
  },
  {
    lang: "th",
    readtext: "泰语",
  },
  // {
  //   lang: "ar",
  //   readtext: "阿拉伯语",
  // },
]

const processStrings = async (input, targetConfig) => {
  for (const key in input.strings) {
    // 如果 key 是空的，跳过当前 for 循环
    if (!key || key.trim() === "" || key === "%@ %@" || key === "%lld 个范文")
      continue

    // 创建一个数组来存储需要翻译的语种的配置对象
    const languagesToTranslate = []

    //
    for (const config of targetConfig) {
      // 如果 input.strings[key].localizations[config.lang] 不存在，则将整个 config 对象添加到需要翻译的数组中

      if (!input.strings[key].localizations) {
        input.strings[key].localizations = {}
      }
      if (!input.strings[key].localizations[config.lang]) {
        languagesToTranslate.push(config)
      }
    }

    // 如果有需要翻译的语种，你可以继续处理这些语种
    if (languagesToTranslate.length > 0) {
      // 在此处处理 languagesToTranslate 数组
      // 例如，调用翻译服务或执行其他操作
      const translationText = await translatedFunc(key, languagesToTranslate)
      // 将文本按换行符分割，然后过滤掉任何空行
      const lines = translationText
        .trim()
        .split("\n")
        .filter((line) => line)

      const translationArray = lines.map((line) => {
        const [readtext, value] = line.split("：")
        const langConfig = targetConfig.find(
          (config) => config.readtext === readtext.trim()
        )
        return {
          lang: langConfig ? langConfig.lang : "unknown",
          value: value.trim(),
        }
      })

      // 遍历 translationArray 并将每个翻译插入到 input 中
      translationArray.forEach((translation) => {
        input.strings[key].localizations[translation.lang] = {
          stringUnit: {
            state: "translated",
            value: translation.value,
          },
        }
      })
      // 将最终的对象写入JSON文件
      fs.writeFile(
        "output.xcstrings",
        JSON.stringify(input, null, 2),
        (err) => {
          if (err) {
            console.error("Error writing the file:", err)
            return
          }
          console.log("Translations saved to output.xcstrings")
        }
      )
    }
  }
}

fs.readFile("input.json", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading the file:", err)
    return
  }
  const input = JSON.parse(data)

  processStrings(input, targetConfig)
})
