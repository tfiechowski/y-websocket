#!/usr/bin/env node

/**
 * @type {any}
 */
const WebSocket = require('ws')
const http = require('http')
const wss = new WebSocket.Server({ noServer: true })
const Y = require('yjs')

const utils = require('./utils.js')
const { MemoryStorage } = require('./MemoryStorage')

const host = process.env.HOST || 'localhost'
const port = process.env.PORT || 1234
const DEBUG = process.env.DEBUG
exports.DEBUG = DEBUG

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('okay')
})

const memoryStorage = new MemoryStorage()

utils.setPersistence({
  bindState: async (docName, ydoc) => {
    const persistedYdoc = await memoryStorage.getYDoc(docName)
    const newUpdates = Y.encodeStateAsUpdate(ydoc)
    memoryStorage.storeUpdate(docName, newUpdates)
    Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc))
    ydoc.on('update', update => {
      memoryStorage.storeUpdate(docName, update)
    })

    // Here you listen to granular document updates and store them in the database
    // You don't have to do this, but it ensures that you don't lose content when the server crashes
    // See https://github.com/yjs/yjs#Document-Updates for documentation on how to encode
    // document updates
  },
  writeState: (string, doc) => {
    // This is called when all connections to the document are closed.
    // In the future, this method might also be called in intervals or after a certain number of updates.
    return new Promise(resolve => {
      // When the returned Promise resolves, the document will be destroyed.
      // So make sure that the document really has been written to the database.
      resolve()
    })
  }
})

wss.on('connection', utils.setupWSConnection)

server.on('upgrade', (request, socket, head) => {
  // You may check auth of request here..
  /**
   * @param {any} ws
   */
  const handleAuth = ws => {
    wss.emit('connection', ws, request)
  }
  wss.handleUpgrade(request, socket, head, handleAuth)
})

server.listen(port, () => {
  console.log(`running at '${host}' on port ${port}`)
})
