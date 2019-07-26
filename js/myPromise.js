(function (window) {
  function MyPromise(handle) {
    var _status = 'pending' // 内部状态，共有3种状态: pending, fulfilled, rejected
    var _data // 获取到的数据
    var _err // 错误信息
    var _events = [] // 事件队列
    var _errEvents = [] // 错误事件队列

    var resolve = function (data) {
      var run = function () {
        _status = 'fulfilled'
        _data = data
        for (i in _events) _events[i](_data)
      }

      // 保证该方法在then方法之后调用
      setTimeout(run, 1);
    }

    var reject = function (err) {
      var run = function () {
        _status = 'rejected'
        _err = err
        for (i in _errEvents) _errEvents[i](_err)
      }

      // 保证该方法在then方法之后调用
      setTimeout(run, 0);
    }

    this.then = function (event, errEvent) {
      if (typeof event != 'function') {
        throw new Error(event + ' is not a function')
      }

      // then方法里返回一个新的MyPromise对象以便链式操作
      return new MyPromise(function (resolve, reject) {
        // 封装一下传进then的方法，成功执行后调用下一个promise
        function resolver(data) {
          var promise = event(data)
          if (promise && promise instanceof MyPromise) {
            promise.then(function (data) {
              resolve(data)
            }, function (err) {
              reject(err)
            })
          }
        }

        // 不成功则直接调用reject方法
        function rejecter(err) {
          errEvent && typeof errEvent == 'function' && errEvent(err)
          reject(err)
        }

        // 如果状态不为pending，直接回调，不再重复调用
        if (_status == 'pending') {
          _events.push(resolver)
          _errEvents.push(rejecter)
        } else if (_status == 'fulfilled') {
          resolver(_data)
        } else {
          reject(_err)
        }
      })
    }

    this.catch = function (e) {
      return this.then(function () { }, e)
    }

    handle(resolve, reject)
  }

  //声明静态方法
  var staticFn = {
    all(promises) {
      var isArray = Object.prototype.toString.call(promises) == '[object Array]'
      if (!isArray) throw new Error('parameter should be an array')

      return new MyPromise(function (resolve, reject) {
        var datas = []
        for (i in promises) {
          promises[i].then(function (data) {
            datas.push(data)
            if (datas.length == promises.length) resolve(datas)
          }, function (err) {
            reject(err)
          })
        }
      })
    },
    race(promises) {
      var isArray = Object.prototype.toString.call(promises) == '[object Array]'
      if (!isArray) throw new Error('parameter should be an array')

      return new MyPromise(function (resolve, reject) {
        var raced = false
        for (i in promises) {
          promises[i].then(function (data) {
            if (!raced) {
              resolve(data)
              raced = true
            }
          }, function (err) {
            if (!raced) {
              reject(err)
              raced = true
            }
          })
        }
      })
    }
  }

  // 添加静态方法
  for (fn in staticFn) {
    if (staticFn.hasOwnProperty(fn)) {
      MyPromise[fn] = staticFn[fn]
    }
  }

  window.MyPromise = MyPromise
})(window)

// 测试方法
var promise = new MyPromise(function (resolve, reject) {
  resolve('it works!')
  //reject('error1')
  // setTimeout(() => {
  //   resolve('it works!')
  // }, 2000);
})
var promise2 = new MyPromise(function (resolve, reject) {
  setTimeout(() => {
    resolve('it also works!')
    // reject('error2')
  }, 2000);
})

MyPromise.all([promise, promise2]).then(function (datas) {
  console.log(datas)
}, function (err) {
  console.log(err)
})
MyPromise.race([promise, promise2]).then(function (data) {
  console.log(data)
}, function (err) {
  console.log(err)
})