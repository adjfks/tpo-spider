// 此脚本用于统计词频
const axios = require('axios')
const cheerio = require("cheerio")
const ExcelJS = require('exceljs')
const config = require('./config.js')
const { witch } = config.count

console.log(`Counting TPO Official ${witch}...`);

axios.get('https://sh.xhd.cn/toefl/tpo/').then(res => {
  const $ = cheerio.load(res.data)
  const links = $('.fud_rcon [title^="TPO听力"]')
  let pages = []

  // 获取所有分页信息
  for (let i = 0; i < links.length; i++) {
    const attr = links[i].attribs
    pages.push({
      href: attr.href,
      title: attr.title
    })
  }

  // 截取要统计的page
  if (typeof witch === 'number') {
    pages = pages.slice(witch, witch + 1)
  }

  // 获取全部文本
  (async function () {
    const map = {}
    const str = await pages.reduce(async (str, p) => {
      const content = await getEachPageStr(p)
      return (await str) + content
    }, '')
    // 去除空格和中文字符
    const newStr = str.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, ' ')
    // 统计词频
    newStr.split(' ').forEach(word => {
      if (map[word]) {
        map[word] += 1
      } else {
        map[word] = 1
      }
    })
    // 排序 从大到小
    const sortedArr = Object.entries(map).sort((a, b) => b[1] - a[1])

    // 创建工作簿
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Joke';
    workbook.lastModifiedBy = 'Joke';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();
    // 添加工作表
    const sheet = workbook.addWorksheet('TPO听力词频');
    sheet.addRows(sortedArr)
    // 写入文件
    workbook.xlsx.writeFile('./tpo.xlsx')
      .then(function () {
        // done
        console.log('Counting Done!')
      });
  })()
})

// 获取每一个分页的听力文本
async function getEachPageStr(page, wrap = false) {
  let str = ''
  await axios.get(`https://sh.xhd.cn${page.href}`).then(res => {
    const $ = cheerio.load(res.data)
    let content = $('.lh-cont')
    str += content.text()
  })
  return str
}
