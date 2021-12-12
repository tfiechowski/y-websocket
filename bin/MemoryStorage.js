const { DEBUG } = require('./server')

class MemoryStorage {
  constructor () {
    this.docs = {}
  }

  getYDoc (docName) {
    if (DEBUG) {
      console.log('Loading ', docName, ' from docs:', this.docs)
    }

    return Promise.resolve(this.docs[docName])
  }

  storeUpdate (docName, newUpdates) {
    if (DEBUG) {
      console.log('Storing update to doc:', docName, ': ', newUpdates)
    }

    this.docs[docName] = newUpdates
  }
}

exports.MemoryStorage = MemoryStorage
