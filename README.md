# homebridge-ezsalt

Homebridge plugin for EZsalt Sensor v3.  
- Reads distance data from Tasmota via MQTT  
- Reports salt level % as Battery Level  
- Reports raw distance as Light Sensor (visible in Eve app)  
- Exposes low salt condition as OccupancyDetected (HomeKit-compatible)

## Installation

```bash
npm install -g homebridge-ezsalt
```

Or for local development:

```bash
git clone https://github.com/YOUR_USERNAME/homebridge-ezsalt.git
cd homebridge-ezsalt
npm install -g .
```

## Example `config.json`

```json
{
  "accessories": [
    {
      "accessory": "EZsaltTasmotaSensor",
      "name": "Water Softener",
      "mqttUrl": "mqtt://192.168.1.50",
      "mqttUsername": "user",
      "mqttPassword": "pass",
      "topic": "tele/ezsalt/SENSOR",
      "distanceKey": "VL53L0X.Distance",
      "tankDepthMm": 1200,
      "thresholdPct": 25
    }
  ]
}
```

## Notes

- Works with any VL53L0X Tasmota MQTT sensor.
- Salt % is visible in the Eve app via BatteryLevel.