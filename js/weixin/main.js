const WXBizDataCrypt = require('./WXBizDataCrypt')
const axios = require('axios')

const token = {
  access_token: null,
  expires_in: null,
  date: null
}

function getSessionKey({ code, appid, secret }) {
  return new Promise(async (resolve, reject) => {
    let url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`
    axios.get(url).then(res => {
      let { openid, session_key } = res.data

      if(!openid || !session_key) {
        reject('no session_key')
      }else {
        resolve({ openid, session_key })
      }
    }).catch(reject)
  })
}

function getPhoneNumber({ iv, encryptedData, appid, session_key }) {
  return new Promise(async (resolve, reject) => {
    if (!session_key) {
      reject('no session_key')
    }else {
      var pc = new WXBizDataCrypt(appid, session_key)
      var data = pc.decryptData(encryptedData, iv)

      resolve(data)
    }
  })
}

// ctx.response.type='image/jpeg' ctx为koa2中的上下文
function getQrcode(scene) {
  return new Promise(async (resolve, reject) => {
    let token = await this.getToken()
    let url = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${token}`
    axios({
      method: 'post',
      url,
      data: {
        scene
      },
      // 非常重要，一定不能忘记要加上
      responseType: 'arraybuffer'
    }).then(res => {
      let buf = new Buffer(res.data)
      resolve(buf)
    }).catch(reject)
  })
}

function getToken({ appid, secret }) {
  function refreshToken() {
    return new Promise(async (resolve, reject) => {
      let url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`
      let res = await axios.get(url)
      let { access_token, expires_in, errmsg } = res.data

      if(errmsg) {
        reject(errmsg)
        return
      }

      token.access_token = access_token
      token.expires_in = expires_in
      token.date = new Date().getTime()
      resolve(access_token)
    })
  }

  if(!token.access_token) {
    return refreshToken()
  }else {
    let needRefresh = (new Date().getTime() - token.date) / 1000 >= token.expires_in
    if(needRefresh) return refreshToken()
    return Promise.resolve(token.access_token)
  }
}

let utils = {
  getSessionKey,
  getPhoneNumber,
  getToken,
  getQrcode
}

module.exports = utils
