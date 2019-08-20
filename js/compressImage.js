function convertBase64UrlToBlob (urlData) {
  let arr = urlData.split(',')
  let mime = arr[0].match(/:(.*?);/)[1]
  let bstr = atob(arr[1])
  let n = bstr.length
  let u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], 'file_' + Date.parse(new Date()) + '.jpg', {
    type: mime
  })
}

function canvasDataURL (path, obj, callback) {
  return new Promise((resolve, reject) => {
    let img = new Image()
    img.src = path
    img.onload = () => {
      // 默认按比例压缩
      let w = img.width
      let h = img.height
      let scale = w / h
      w = obj.width || w
      h = obj.height || (w / scale)
      let quality = 0.7 // 默认图片质量为0.7
      // 生成canvas
      let canvas = document.createElement('canvas')
      let ctx = canvas.getContext('2d')
      // 创建属性节点
      let anw = document.createAttribute('width')
      anw.nodeValue = w
      let anh = document.createAttribute('height')
      anh.nodeValue = h
      canvas.setAttributeNode(anw)
      canvas.setAttributeNode(anh)
      ctx.drawImage(img, 0, 0, w, h)
      // 图像质量
      if (obj.quality && obj.quality <= 1 && obj.quality > 0) {
        quality = obj.quality
      }
      // quality值越小，所绘制出的图像越模糊
      let base64 = canvas.toDataURL('image/jpeg', quality)
      // 回调函数返回base64的值
      resolve(base64)
    }
    img.onerror = err => {
      reject(err)
    }
  })
}

function compressIamge (fileObj, quality) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader()
    fileReader.onload = () => {
      let url = fileReader.result
      canvasDataURL(url, {
        quality
      }).then(base64 => {
        let file = convertBase64UrlToBlob(base64)
        resolve(file)
      }).catch(err => {
        reject(err)
      })
    }
    fileReader.onerror = err => {
      fileReader.abort()
      reject(err)
    }
    fileReader.readAsDataURL(fileObj)
  })
}

module.export = compressIamge
