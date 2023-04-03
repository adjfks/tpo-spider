const axios = require('axios')
const cheerio = require("cheerio")
const fs = require('fs')
const path = require('path')
const os = require('os')
const FILE_NAME = path.resolve(__dirname, './tpo.txt')
const config = require('./config.js')

const { number } = config.text
work(number - 1, number)

function work(x, y) {
  let pages = []
  let content = ''
  console.log(`Extracting text of TPO Official ${number}...`);

  axios.get('https://sh.xhd.cn/toefl/tpo/').then(async res => {
    const $ = cheerio.load(res.data)
    // const links = $('.fud_rcon [title^="TPO听力"]')
    const links = $('.fud_rcon [href^="/toefl/tpotingli/"]')
    for (let i = 0; i < links.length; i++) {
      const attr = links[i].attribs
      pages.push({
        href: attr.href,
        title: attr.title
      })
    }
    pages = pages.slice(x, y)

    for (let page of pages) {
      const str = await getEachPageStr(page)
      content += str
    }

    fs.writeFile(FILE_NAME, content, (err) => {
      if (err) {
        console.log(err.message);
      }
    })

    console.log('Get text successfully!')
  })

  async function getEachPageStr(page) {
    let str = ''
    const reg = /(?<=TPO听力)[0-9]{1,2}(?=文本)/
    const index = reg.exec(page.title)?.[0]
    str += `Official ${index || 2}\r\n`

    await axios.get(`https://sh.xhd.cn${page.href}`).then(res => {
      const $ = cheerio.load(res.data)
      let line = $('.lh-cont p:eq(0)')
      while (line.length > 0) {
        str += `${line.text().trim()}${os.EOL}`
        line = line.next()
      }
      str += '\r\n\r\n\r\n'
    })
    return str
  }
}





