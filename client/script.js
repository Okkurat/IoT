"use strict"

document.getElementById('switch').addEventListener('click', function(){
    if(document.getElementById('switch').checked) {
        document.getElementById('slider').max = '100'
        document.getElementById('slider').value = '50'
        sliderValue.textContent = '50'
        document.getElementById('sliderText').textContent = 'Fan Speed'
    }
    else {
        document.getElementById('slider').max = '120'
        document.getElementById('slider').value = '60'
        sliderValue.textContent = '60'
        document.getElementById('sliderText').textContent = 'Pressure'
    }
});

const url = "ws://localhost:3001"
const mywsServer = new WebSocket(url)

document.getElementById('manualButton').addEventListener('click', function() {
    let url = "";
    let value = document.getElementById('slider').value
    if(document.getElementById('switch').checked) {
        url = `/data?mode=manual&speed=${value}`
    }
    else {

        url = `/data?mode=automatic&pressure=${value}`
    }

    fetch(url);
});

mywsServer.onmessage = function(event) {
    const { data } = event
    let d = JSON.parse(data)
    console.log(data)
    if(d.error){
        if(!(document.getElementById('error'))){
            popError(true)
        }
    } 
    else {
        if(document.getElementById('error')){
            popError(false)
        }
    }

    if(d.auto){
        document.getElementById('modeP').textContent = `Current mode: Automatic`
    }
    else {
        document.getElementById('modeP').textContent = `Current mode: Manual`
    }
    document.getElementById('pressureP').textContent = `Current pressure: ${d.pressure} Pa`
    document.getElementById('fanSpeedP').textContent = `Current fan speed: ${d.speed} %`
    document.getElementById('co2P').textContent = `Current co2: ${d.co2}`
    document.getElementById('tempP').textContent = `Current temperature: ${d.temp} C`
    document.getElementById('humidityP').textContent = `Current humidity: ${d.rh} %`
        
    }
document.addEventListener('DOMContentLoaded', function() {
    var slider = document.getElementById('slider')
    var sliderValue = document.getElementById('sliderValue')
    document.getElementById('slider').value = '60'
    sliderValue.textContent = slider.value
    document.getElementById('switch').checked = false

    slider.addEventListener('input', function() {
        sliderValue.textContent = slider.value
    });
});

function popError(state){
    if(state){
        const error = document.createElement('p')
        error.textContent = 'ERROR! PRESSURE NOT REACHED!'
        error.id = 'error'
        const modeText = document.getElementById('mode')
        modeText.parentNode.insertBefore(error, modeText)
    }
    else {
        document.getElementById('error').remove()
    }
}