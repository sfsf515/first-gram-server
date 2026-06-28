const http = require('http')
const WebSocket = require('ws')

const PORT = process.env.PORT || 8000
const server = http.createServer()
const wss = new WebSocket.Server({ server })

let rooms = {}
let waitingPlayer = null

wss.on('connection', (ws) => {
  console.log('新玩家连接')

  ws.on('message', (data) => {
    const msg = JSON.parse(data)
    switch (msg.type) {
      case 'join':
        handleJoin(ws, msg)
        break
      case 'move':
        handleMove(ws, msg)
        break
      case 'attack':
        handleAttack(ws, msg)
        break
      case 'skill':
        handleSkill(ws, msg)
        break
    }
  })

  ws.on('close', () => {
    handleDisconnect(ws)
  })
})

function handleJoin(ws, msg) {
  ws.playerName = msg.name || '玩家'

  if (waitingPlayer && waitingPlayer.readyState === WebSocket.OPEN) {
    const roomId = Date.now().toString()
    rooms[roomId] = {
      id: roomId,
      player1: waitingPlayer,
      player2: ws
    }

    waitingPlayer.roomId = roomId
    waitingPlayer.playerIndex = 1
    ws.roomId = roomId
    ws.playerIndex = 2

    waitingPlayer.send(JSON.stringify({
      type: 'matched',
      roomId,
      playerIndex: 1,
      opponentName: ws.playerName
    }))

    ws.send(JSON.stringify({
      type: 'matched',
      roomId,
      playerIndex: 2,
      opponentName: waitingPlayer.playerName
    }))

    console.log(`房间 ${roomId} 创建成功`)
    waitingPlayer = null
  } else {
    waitingPlayer = ws
    ws.send(JSON.stringify({ type: 'waiting' }))
    console.log('等待匹配中...')
  }
}

function handleMove(ws, msg) {
  const room = rooms[ws.roomId]
  if (!room) return
  const opponent = ws.playerIndex === 1 ? room.player2 : room.player1
  if (opponent.readyState === WebSocket.OPEN) {
    opponent.send(JSON.stringify({
      type: 'opponentMove',
      x: msg.x,
      y: msg.y,
      direction: msg.direction
    }))
  }
}

function handleAttack(ws, msg) {
  const room = rooms[ws.roomId]
  if (!room) return
  const opponent = ws.playerIndex === 1 ? room.player2 : room.player1
  if (opponent.readyState === WebSocket.OPEN) {
    opponent.send(JSON.stringify({
      type: 'opponentAttack',
      x: msg.x,
      y: msg.y,
      direction: msg.direction
    }))
  }
}

function handleSkill(ws, msg) {
  const room = rooms[ws.roomId]
  if (!room) return
  const opponent = ws.playerIndex === 1 ? room.player2 : room.player1
  if (opponent.readyState === WebSocket.OPEN) {
    opponent.send(JSON.stringify({
      type: 'opponentSkill',
      x: msg.x,
      y: msg.y,
      direction: msg.direction
    }))
  }
}

function handleDisconnect(ws) {
  console.log('玩家断开连接')

  if (waitingPlayer === ws) {
    waitingPlayer = null
    return
  }

  if (ws.roomId) {
    const room = rooms[ws.roomId]
    if (room) {
      const opponent = ws.playerIndex === 1 ? room.player2 : room.player1
      if (opponent && opponent.readyState === WebSocket.OPEN) {
        opponent.send(JSON.stringify({ type: 'opponentDisconnected' }))
      }
      delete rooms[ws.roomId]
    }
  }
}

server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`)
})
