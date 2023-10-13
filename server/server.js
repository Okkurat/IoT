"use strict"

const express = require('express')
const path = require('path')
const app = express()
const PORT = 3000
const sqlite3 = require('sqlite3').verbose()
const WebSocket = require("ws")
const mqtt = require("mqtt")
//const mqtt_client = mqtt.connect("mqtt://192.168.1.106:1883")
const mqtt_client = mqtt.connect("mqtt://localhost:1883")
app.use(express.static(path.join(__dirname, '../client')))
app.set('views', path.join(__dirname, '../client/views'))
app.use(express.json())


// Using SQLITE3 database
const db = new sqlite3.Database('../data/myDatabase.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message)
    }
    console.log('Connected to the SQLite database.')
})
// Using MQTT
mqtt_client.on("connect", () => {
    mqtt_client.subscribe("controller/status", (err) => {
      if (!err) {
        console.log("Subscribed to controller/status")
      }
  
    })
})

app.get('/', (req, res) => {
    res.sendFile(path.resolve("../client/index.html"))
})
// Publishing MQTT gotten from query, the options are autmatic mode with pressure or manual mode with fan speed
app.get('/data', (req, res) => {
    console.log(req.query.mode)
    if(req.query.mode == "automatic"){
      console.log(req.query.pressure)
      mqtt_client.publish("controller/settings", JSON.stringify({"auto": true, "pressure": +req.query.pressure}), {}, (err) => {
        if(err){
          console.error("MQTT Publish Error", err)
          res.status(500).send("Failed to publish MQTT Message")
        } else {
          console.log("Message published")
          res.send("Message published")
        }
      })
    }
    else {
      console.log(req.query.speed)
      mqtt_client.publish("controller/settings", JSON.stringify({"auto": false, "speed": +req.query.speed}), {}, (err) => {
        if(err){
          console.error("MQTT Publssh Error", err)
          res.status(500).send("Failed to publis MQTT Message")
        } else {
          console.log("Message published")
          res.send("Message published")
        }
      })
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            return console.error(err.message)
        }
        console.log('Closed the database connection.')
        process.exit(0)
    })
})

function execute(query, parameters = []){
    return new Promise((resolve, reject) => {
      db.run(query, parameters, (error) => {
        if(error){
          reject(error)
        }
        resolve()
      })
    })
}
  
function find_all(query, parameters){
  return new Promise((resolve, reject) => {
    db.all(query, parameters, (error, rows) => {
      if(error){
        reject(error)
      }
      resolve(rows)
    })
  })
}

const myServer = app.listen(3001)

const wsServer = new WebSocket.Server({
  noServer: true
})

wsServer.on("connection", function(ws) {    // what should a websocket do on connection
console.log("New connection")
ws.on("message", function(msg) {          // what to do on message event
    wsServer.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {     // check if client is ready
        client.send(msg.toString())
    }
    })
})
})

function init_db(){
db.run(`CREATE TABLE IF NOT EXISTS measurement(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nr INTEGER,
            time_stamp INTEGER,
            speed INTEGER,
            setpoint INTEGER,
            pressure INTEGER,
            auto INTEGER,
            error INTEGER,
            co2 INTEGER,
            rh INTEGER,
            temperature INTEGER
            );
`, (error) => {
    if(error){
    console.log(error)
    process.exit()
    }
    else {
    console.log("Initialized DB")
    }
})
}

myServer.on('upgrade', async function upgrade(request, socket, head) {      //handling upgrade(http to websocekt) event
    console.log("New upgrade")

    //emit connection when request accepted
    wsServer.handleUpgrade(request, socket, head, function done(ws) {
      wsServer.emit('connection', ws, request)
    })
  })

// Handling message event
mqtt_client.on("message", (topic, message) => {
  const insert_measurement_query = "INSERT INTO measurement(nr,time_stamp,speed,setpoint,pressure,auto,error,co2,rh,temperature) VALUES (?,?,?,?,?,?,?,?,?,?)"
  // message is Buffer
  let date = new Date()
  let time_stamp = date.getTime()
  let data = JSON.parse(message.toString())
  data.time_stamp = time_stamp
  
  wsServer.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {     // check if client is ready
      client.send(JSON.stringify(data))
    }
  })
  
  let args = [
    data.nr,
    time_stamp,
    data.speed,
    data.setpoint,
    data.pressure,
    data.auto,
    data.error,
    data.co2,
    data.rh,
    data.temp
  ]
  execute(insert_measurement_query, args)
  .catch((error) => {
    console.log(error)
  })
})

app.get("/statistics", (req, res) => {
  res.sendFile(path.resolve("../client/data.html"))
})
// Helper function to fetch data from the database
async function get_data(query, parameters, start=0, end=0){
  let data = {}
  
  // Check if timestamps are given

  let q
  if(start === 0 && end === 0){
    q = "SELECT * FROM measurement"
  }
  else {
    q = "SELECT * FROM measurement WHERE time_stamp >= ? and time_stamp <= ?"
  }
  
  let new_data = await find_all(q, [start, end])
  
  for(let param of parameters){
    data[param] = []
    for(let k of new_data){
      data[param].push(k[param])
    }
  }
  return data
}
// Fetching data from database and pushing data from the given time stamp periods
app.get("/statistcs/data", async (req, res) => {

  const find_measurements_with_time = "SELECT ? FROM measurement WHERE time_stamp >= ? and time_stamp <= ?"
  const find_all_measurements = "SELECT ? FROM measurement"
  console.log(req.query)
  let args = []
  let parameters = []
  
  parameters.push("time_stamp")
  
  
  if(req.query.temperature){
    parameters.push("temperature")
  }
  if(req.query.pressure){
    parameters.push("pressure")
  }
  if(req.query.rh){
    parameters.push("rh")
  }
  if(req.query.co2){
    parameters.push("co2")
  }
  if(req.query.speed){
    parameters.push("speed")
  }
  if(req.query.setpoint){
    parameters.push("setpoint")
  }

  let query
  if(req.query.start === undefined || req.query.end === undefined){
    query = find_all_measurements
  }
  else {
    query = find_measurements_with_time
    args.push(req.query.start)
    args.push(req.query.end)
  }
  
  try{
    let data = await get_data(query, parameters, parseInt(req.query.start), parseInt(req.query.end))
    res.send(data)
  }
  catch(exception){
    console.log(exception)
    res.sendStatus(500)
  }  
})
  
init_db()