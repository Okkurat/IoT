"use strict"

const ctx = document.getElementById('myChart')
const start_time = document.getElementById("start-time")
const end_time = document.getElementById("end-time")
const live_data = document.getElementById("live-data")


console.log(location.host)

const url = "ws://localhost:3001"
const mywsServer = new WebSocket(url)

let temperature = [0]
let setpoint = [0]
let humidity = [0]
let speed = [0]
let co2 = [0]
let pressure = [0]
let time_stamps = [new Date()]

function reset_data(){
    temperature = []
    setpoint = []
    humidity = []
    speed = []
    co2 = []
    pressure = []
    time_stamps = []
}

live_data.addEventListener("click", () => {
  reset_data()
    if(live_data.checked){
        graph.data.datasets[0].data = setpoint
        graph.data.datasets[1].data = pressure
        graph.data.datasets[2].data = speed
        graph.data.datasets[3].data = temperature
        graph.data.datasets[4].data = co2
        graph.data.datasets[5].data = humidity
        graph.data.labels = time_stamps
    }
})

let options1 = {
  elements: {
    point: {
      radius: 0
    }
  },
  scales: {
    LEFT: {
      type: 'linear',
      position: 'left',
      beginAtZero: true,
      max: 130,
      min: -20,
      ticks: {
        stepSize: 15,
      }
    },
    RIGHT: {
      type: 'linear',
      position: 'right',
      beginAtZero: true,
      max: 5000,
      ticks: {
        stepSize: 500,
      }
    },
    x: {
      type: 'time',
      time: {
        displayFormats: {
          'millisecond': 'MMM dd hh mm',
          'second': 'MMM dd HH mm',
          'minute': 'HH mm',
          //'hour': 'MMM dd hh mm',
          'hour': 'HH:mm',
          'day': 'MMM dd HH mm',
          'week': 'MMM dd HH mm',
          'month': 'MMM dd HH mm',
          'quarter': 'MMM dd HH mm',
          'year': 'MMM dd HH mm',
        }
      },
      ticks: {
        major:{
          enabled: true
        },
        autoSkip: true,
        maxTicksLimit: 20

      }
    }
  },
  animation: {
    duration: 0
  }
}

let graph = new Chart(ctx, {
  type: 'line',
  data: {
    labels: time_stamps,
    datasets: [
      {
        label: 'Set point',
        data: setpoint,
        borderWidth: 2,
        yAxisID: "LEFT",
      },
      {
        label: "Pressure",
        data: pressure,
        borderWidth: 2,
        yAxisID: "LEFT",
      },
      {
        label: "Speed",
        data: speed,
        borderWidth: 2,
        yAxisID: "LEFT",
      },
      {
        label: "Temperature",
        data: temperature,
        borderWidth: 2,
        yAxisID: "LEFT",
      },
      {
        label: "CO2",
        data: co2,
        borderWidth: 2,
        yAxisID: "RIGHT",
      },
      {
        label: "Humidity",
        data: humidity,
        borderWidth: 2,
        yAxisID: "LEFT",
      }
    ]

  },
  options: options1

})

function fetch_data(){
  reset_data()
  live_data.checked = false

  let path = "/statistcs/data?"
  if(cb_humidity.checked) {
    path += "rh=1&"
  }
  if(cb_set_point.checked) {
    path += "setpoint=1&"
  }
  if(cb_pressure.checked) {
    path += "pressure=1&"
  }
  if(cb_speed.checked) {
    path += "speed=1&"
  }
  if(cb_temperature.checked) {
    path += "temperature=1&"
  }
  if(cb_co2.checked) {
    path += "co2=1&"
  }

  if(start_time.value !== undefined && end_time.value !== undefined){
    path += "start=" + new Date(start_time.value).getTime()
    path += "&end=" + new Date(end_time.value).getTime()
  }
  console.log(path)
  fetch(path)
  .then((res) => res.json())
  .then((res) => {
  console.log(res)

  if(cb_set_point.checked && res.setpoint) {
    graph.data.datasets[0].data = res.setpoint.slice()
  }
  if(cb_pressure.checked && res.pressure){
    graph.data.datasets[1].data = res.pressure.slice()
  }
  if(cb_speed.checked && res.speed){
    graph.data.datasets[2].data = res.speed.slice()
  }
  if(cb_temperature.checked && res.temperature){
    graph.data.datasets[3].data = res.temperature.slice()
  }
  if(cb_co2.checked && res.co2){
    graph.data.datasets[4].data = res.co2.slice()
  }
  if(cb_humidity.checked && res.rh){
    graph.data.datasets[5].data = res.rh.slice()
  }
  
  time_stamps = []
  for(let date of res.time_stamp){
    time_stamps.push(new Date(date))
  }
  graph.data.labels = time_stamps.slice()
  graph.update()
  })
  .catch((e) => {
    console.log(e)
  })
}

let cb_humidity = document.getElementById("show-humidity")
let cb_set_point = document.getElementById("show-set-point")
let cb_pressure = document.getElementById("show-pressure")
let cb_speed = document.getElementById("show-speed")
let cb_temperature = document.getElementById("show-temperature")
let cb_co2 = document.getElementById("show-co2")

let checkboxes = [cb_set_point, cb_pressure, cb_speed, cb_temperature, cb_co2, cb_humidity]

for(let i = 0; i < checkboxes.length; i++){
  checkboxes[i].addEventListener("click", (event) =>{
    if(checkboxes[i].checked)
      graph.data.datasets[i].hidden = false
    else
      graph.data.datasets[i].hidden = true

    graph.update()
  })
}

      //handling message event
mywsServer.onmessage = function(event){
  if(!live_data.checked){
    return
  }
  const { data } = event
  let d = JSON.parse(data)
  console.log(d)
  if(d.pressure !== undefined){
    pressure.push(d.pressure)
    if(pressure.length > 100) pressure.shift()
  }

  if(d.temp !== undefined){
    temperature.push(d.temp)
    if(temperature.length > 100) temperature.shift()
  }

  if(d.setpoint !== undefined){
    setpoint.push(d.setpoint)
    if(setpoint.length > 100) setpoint.shift()
  }

  if(d.rh !== undefined){
    humidity.push(d.rh)
    if(humidity.length > 100) humidity.shift()
  }

  if(d.speed !== undefined){
    speed.push(d.speed)
    if(speed.length > 100) speed.shift()
  }

  if(d.co2 !== undefined){
    co2.push(d.co2)
    if(co2.length > 100) co2.shift()
  }

  if(d.time_stamp !== undefined){
    time_stamps.push(new Date(d.time_stamp))
    if(time_stamps.length > 100) time_stamps.shift()
  }
  graph.update()
}