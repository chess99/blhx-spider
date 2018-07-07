
var fs = require('fs');
var path = require('path');
var request = require("request");

function mkdirs(dirpath, callback) {
  fs.exists(dirpath, function (exists) {
    if (exists) {
      callback(dirpath);
    }
    else {
      mkdirs(path.dirname(dirpath), function () {
        fs.mkdir(dirpath, callback);
      });
    }
  });
}

function mkdirsSync(dirpath) {
  if (fs.existsSync(dirpath)) return
  mkdirsSync(path.dirname(dirpath))
  fs.mkdirSync(dirpath)
}

function downloadFile(url, savePath, callback) {
  request.head(url, function (err, res, body) {
    if (err) {
      console.log('err: ' + err);
      callback(null, err);
    }
    else {
      request(url)
        .on('error', function (err) {
          console.log('err: ' + err);
          callback(null, err)
        })
        .pipe(fs.createWriteStream(savePath))
        .on('close', function () {
          console.log('Done : ', url);
          callback(null, url);
        });
    }
  });
}

function downloadFilePromise(url, filePath) {
  return new Promise((resolve, reject) => {
    downloadFileIfNotExist(url, filePath, function (err, result) {
      if (err) {
        reject(err)
      }
      else {
        resolve(result)
      }
    })
  })
}

function downloadFileIfNotExist(url, filePath, callback) {
  // 判断文件是否存在
  fs.exists(filePath, function (exists) {
    if (exists) {
      // 文件已经存在不下载
      console.log(filePath + ' is exists');
      callback(null, 'exists');
    } else {
      // 文件不存在，开始下载文件
      console.log('正在抓取 ', url);
      mkdirsSync(path.dirname(filePath))
      downloadFile(url, filePath, callback)
    }
  });
}

module.exports = {
  mkdirs,
  mkdirsSync,
  downloadFile,
  downloadFilePromise,
  downloadFileIfNotExist
}
