const fs = require("fs")

// 1. 读取 input.json 文件
const data = fs.readFileSync("test.json", "utf8")
const json = JSON.parse(data)

const { sourceLanguage, strings } = json

// 获取所有的目标语言
const languages = new Set(
  Object.keys(strings).flatMap((stringKey) =>
    Object.keys(strings[stringKey].localizations)
  )
)

// 为了生成 zh-Hans.txt 文件
let zhHansContent = ""

// 2. 生成以 localizations 的键为文件名的文件
for (const lang of languages) {
  let fileContent = ""

  for (const stringKey in strings) {
    const value = strings[stringKey].localizations[lang]?.stringUnit.value
    const enValue = strings[stringKey].localizations.en?.stringUnit.value
    if (value && enValue) {
      const escapedEnValue = enValue.replace(/"/g, '\\"')
      const escapedValue = value.replace(/"/g, '\\"')
      const escapedStringKey = stringKey.replace(/"/g, '\\"')

      if (lang === "en") {
        fileContent += `"${escapedEnValue}" = "${escapedEnValue}";\n`
      } else {
        fileContent += `"${escapedEnValue}" = "${escapedValue}";\n`
      }
    }
  }
  fs.writeFileSync(`output/${lang}.txt`, fileContent)
}

for (const stringKey in strings) {
  const enValue = strings[stringKey].localizations.en?.stringUnit.value
  const escapedEnValue = enValue.replace(/"/g, '\\"')
  const escapedStringKey = stringKey.replace(/"/g, '\\"')
  zhHansContent += `"${escapedEnValue}" = "${escapedStringKey}";\n`
}

// 4. 生成 zh-Hans.txt 文件
fs.writeFileSync(`output/${sourceLanguage}.txt`, zhHansContent)
