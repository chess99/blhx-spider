const superagent = require("superagent")
var path = require('path')
const cheerio = require("cheerio")
const async = require('async');


const { downloadFilePromise, mkdirsSync } = require('./util')

function parseCharacterPage(data) {
  var $ = cheerio.load(data)
  let imgLinks = []
  let imgTypes = ['立绘', '换装', '换装2', '改造', '誓约']
  imgTypes.forEach(type => {
    let selector = `img[alt*="${type}"]`
    let element = $(selector)
    let src = element.attr('src')
    let imgName = element.attr('alt')
    // console.log(imgName, src)
    if (imgName && src) {
      imgLinks.push([imgName, src])
    }
  })
  return imgLinks
}


async function getCharacterImgLinks(characterPageUrl) {
  return new Promise((resolve, reject) => {
    superagent
      .get(characterPageUrl)
      .end(function (err, res) {
        if (err) {
          reject(err)
        }
        else {
          let data = res.text
          let imgLinks = parseCharacterPage(data)
          resolve(imgLinks)
        }
      });
  })
}

async function getImages(imgLinks, saveDir) {
  let promiseArr = []
  imgLinks.forEach(imgLink => {
    let fileFullPath = path.join(saveDir, imgLink[0])
    promiseArr.push(downloadFilePromise(imgLink[1], fileFullPath))
  })
  Promise.all(promiseArr)
    .then(() => {
      console.log('complete ' + imgLinks.length)
    })
    .catch(err => {
      console.log('err: ' + err)
    })
}


function parseJianniangHome(data) {
  var $ = cheerio.load(data)
  let characterList = []
  $('#FlourPackage').find('.Flour').each(function () {
    let title = $(this).find('a').attr('title')
    let href = $(this).find('a').attr('href')
    // console.log(title, href)
    characterList.push([title, href])
  })
  return characterList
}

async function getCharacterList() {
  const jianniangHomeUrl = 'http://wiki.joyme.com/blhx/%E8%88%B0%E5%A8%98'
  return new Promise((resolve, reject) => {
    superagent
      .get(jianniangHomeUrl)
      .end(function (err, res) {
        if (err) {
          reject(err)
        }
        else {
          let data = res.text
          let characterList = parseJianniangHome(data)
          resolve(characterList)
        }
      });
  })
}



async function runSpider() {
  console.log('爬虫程序开始运行......');
  let saveDir = 'img'
  mkdirsSync(saveDir)

  let characterList = await getCharacterList()
  // console.log(characterList)

  async.mapSeries(characterList, async function (characterInfo) {
    let imgLinks = await getCharacterImgLinks(encodeURI(characterInfo[1]))
    await getImages(imgLinks, saveDir)
  }, (err, results) => {
    if (err) console.log('err: ' + err)
    else console.log('抓取的角色数：' + characterList.length);
  })
}

runSpider()