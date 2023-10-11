/*

function fetchDataAndUpdate() {
    fetch('/data')
        .then(response => response.json())
        .then(data => {
            console.log(data)
            document.getElementById('modeP').textContent = `Current mode: ${data.mode}`;
            document.getElementById('pressureP').textContent = `Current pressure: ${data.pressure}`;
            document.getElementById('fanSpeedP').textContent = `Current fan speed: ${data.fanSpeed}`;
            document.getElementById('co2P').textContent = `Current co2: ${data.co2}`;
            document.getElementById('tempP').textContent = `Current temperature: ${data.temp}`;
            document.getElementById('humidityP').textContent = `Current humidity: ${data.humidity}`;
        })
        .catch(error => console.error('Error fetching data:', error));
}

setInterval(fetchDataAndUpdate, 1000);

*/

document.getElementById('switch').addEventListener('click', function(){
    if(document.getElementById('switch').checked) {
        document.getElementById('slider').max = '100';
        document.getElementById('slider').value = '50'
        sliderValue.textContent = '50'
        document.getElementById('sliderText').textContent = 'Fan Speed';
    }
    else {
        document.getElementById('slider').max = '120';
        document.getElementById('slider').value = '60'
        sliderValue.textContent = '60'
        document.getElementById('sliderText').textContent = 'Pressure';
    }
});

const url = "ws://localhost:3001"
const mywsServer = new WebSocket(url)

document.getElementById('manualButton').addEventListener('click', function() {
    let url = "";
    let value = document.getElementById('slider').value;
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
    if(d.auto){
        document.getElementById('modeP').textContent = `Current mode: Automatic`
        document.getElementById('pressureP').textContent = `Current pressure: ${d.pressure}`;
    }
    else {
        document.getElementById('modeP').textContent = `Current mode: Manual`;
        document.getElementById('fanSpeedP').textContent = `Current fan speed: ${d.speed} %`;
    }
    if(d.pressure != undefined){
        document.getElementById('pressureP').textContent = `Current pressure: ${d.pressure} Pa`;
        document.getElementById('fanSpeedP').textContent = `Current fan speed: ${d.speed}`;
        document.getElementById('co2P').textContent = `Current co2: ${d.co2}`;
        document.getElementById('tempP').textContent = `Current temperature: ${d.temp} C`;
        document.getElementById('humidityP').textContent = `Current humidity: ${d.rh} %`;
    }
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
