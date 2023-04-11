let api = require('../config/api')
let isRefreshing = false  // 是否正在刷新token
let callbacks = [] // 失效后同时发送请求的容器 -- 缓存接口
// 刷新 token 后, 将缓存的接口重新请求一次
function onAccessTokenFetched() {
  callbacks.forEach(callback => {
    callback()
  })
  // 清空缓存接口
  callbacks = []
}
// 添加缓存接口
function addCallbacks(callback) {
  callbacks.push(callback)
}
/**
  * 发送请求
  * @param {String} url 接口api
  * @param {Object} data 参数
  * @param {String} method 请求类型
  * @param {String} tag 启用平台区分 默认开启
  * @param {String} loading 启用loading 默认开启
  */
function request(url, data = {}, method = 'get', tag = true, loading = true) {
  if (tag) {
    data.platformId = '2'
  }
  if (loading) {
    wx.showLoading({
      title: '加载中',
      mask: true,
    })

  return new Promise((resolve, reject) => {
    let header = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${wx.getStorageSync('token')}`,
    // 请求主体
    wx.request({
      url,
      data,
      method,
      header,
      complete(res) {
        wx.hideLoading()
      },
      success(res) {
        if (res.data.code == 200 || res.data.code == 0) {
          resolve(res.data)
          return
        }
        const msg = ['令牌不能为空', '登录状态已过期', '令牌验证失败']
        if (res.data.code != 200 && res.data.code != 401) {
          if (res.data.msg || res.data.message) {
           setTimeout(() => {
                wx.showToast({
                  title: res.data.msg || res.data.message,
                  icon: 'none',
                  duration: 1500
                })
              }, 100);
          } else if (res.data.msg == null) {
            setTimeout(() => {
              wx.showToast({
                title: '请求失败，请稍后重试',
                icon: 'none',
                duration: 1500
              })
            }, 100);
          }
          res.url = '报错接口地址------' + url
          reject(res);
        } else if (msg.includes(res.data.msg) || res.data.code * 1 === 401) {
          /**
           * 只有当token刷新成功后，onAccessTokenFetched 函数执行了回调函数，返回了 resolve 状态
           */
          addCallbacks(() => {
            resolve(request(url, data, method, tag, loading)) // 调用resolve请求队列里面接口
          })

          // 无感刷新Token
          if (!isRefreshing) {
            isRefreshing = true
            updateToken().then(res => {
              console.log('刷新token成功'); // 获取新的token
              wx.setStorageSync('token', res)
              setTimeout(() => {
                onAccessTokenFetched()
              }, 1000);
           
            })
          }
        } else {
          wx.reLaunch({
              url: '/pages/login/index',
            })

        }
      },
      fail(res) {
        wx.showToast({
          title: '请求发送失败',
          icon: "none"
        })

        res.url = '报错接口地址------' + url
        reject(res);
      }
    })
  })
}
// 刷新token
function updateToken() {
  return new Promise((resolve, reject) => {
    wx.request({
      url: api.upToken,
      method: 'post',
      data: {
        userId: wx.getStorageSync('userInfo').userId
      },
      success(res) {
        if (res.data.code == 200) {
          resolve(res.data.data.access_token)
        } else {
          console.log(res.data);
          wx.reLaunch({
            url: '/pages/login/index',
          })
        }
      }, fail(err) {
        console.log('刷新token失败' + err);
        wx.reLaunch({
          url: '/pages/login/index',
        })
        reject(err);
      },
      complete() {
        isRefreshing = false
      }
    })
  })
}
