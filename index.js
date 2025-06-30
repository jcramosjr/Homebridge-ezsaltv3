const mqtt = require('mqtt');

let Service, Characteristic;

module.exports = (api) => {
  Service = api.hap.Service;
  Characteristic = api.hap.Characteristic;
  api.registerAccessory('EZsaltTasmotaSensor', EZsaltTasmotaSensor);
};

class EZsaltTasmotaSensor {
  constructor(log, config) {
    this.log = log;
    this.name = config.name || 'Salt Sensor';
    this.tankDepthMm = config.tankDepthMm || 1200;
    this.thresholdPct = config.thresholdPct || 25;
    this.topic = config.topic || 'tele/ezsalt/SENSOR';
    this.distanceKey = config.distanceKey || 'VL53L0X.Distance';

    this.service = new Service.OccupancySensor(this.name);
    this.batteryService = new Service.Battery(this.name + ' Salt Level');
    this.distanceService = new Service.LightSensor(this.name + ' Distance');
    this.lastSaltLevelPct = 0;
    this.lastDistanceMm = 0;

    this.client = mqtt.connect(config.mqttUrl || 'mqtt://localhost', {
      username: config.mqttUsername,
      password: config.mqttPassword,
    });

    this.client.on('connect', () => {
      this.log(`MQTT connected, subscribing to ${this.topic}`);
      this.client.subscribe(this.topic);
    });

    this.client.on('message', (topic, msg) => {
      try {
        const payload = JSON.parse(msg.toString());
        const distance = this.extractNestedValue(payload, this.distanceKey);
        if (typeof distance !== 'number') return;

        const levelPct = Math.max(0, Math.min(100, (1 - distance / this.tankDepthMm) * 100));
        const isOccupied = levelPct > this.thresholdPct;

        this.lastSaltLevelPct = levelPct;
        this.lastDistanceMm = distance;

        this.service.updateCharacteristic(Characteristic.OccupancyDetected, isOccupied);
        this.batteryService.updateCharacteristic(Characteristic.BatteryLevel, Math.round(levelPct));
        this.batteryService.updateCharacteristic(
          Characteristic.StatusLowBattery,
          levelPct < this.thresholdPct
            ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
            : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL
        );
        this.distanceService.updateCharacteristic(
          Characteristic.CurrentAmbientLightLevel,
          Math.max(distance / 10, 0.0001)
        );

        this.log(`Salt level: ${levelPct.toFixed(1)}% → ${isOccupied ? 'OK' : 'LOW'}`);
      } catch (err) {
        this.log('Error parsing MQTT message:', err.message);
      }
    });
  }

  extractNestedValue(obj, keyPath) {
    return keyPath.split('.').reduce((acc, key) => acc && acc[key], obj);
  }

  getServices() {
    const info = new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Manufacturer, 'EZsalt')
      .setCharacteristic(Characteristic.Model, 'Sensor v3')
      .setCharacteristic(Characteristic.SerialNumber, 'EZSALT0001');

    return [info, this.service, this.batteryService, this.distanceService];
  }
}