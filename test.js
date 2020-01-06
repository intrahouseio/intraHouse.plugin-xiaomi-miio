const Device = require('./lib/miio');


const device1 = new Device({
  ip: '192.168.1.21',
  token: '3257514b76726e6c5571477330714467',
});

const device2 = new Device({
  ip: '192.168.1.20',
  token: '81fabc7919102fd06edeb8881087b7eb',
});

device2.on('message', (msg) => {
  console.log(msg)
});

device2.on('open', () => {
  device2.send({ method: 'miIO.info', params: [ ] });
});


device1.on('message', (msg) => {
  console.log(msg)
});

device1.on('open', () => {
  device1.send({ method: 'miIO.info', params: [ ] });
});


device1.connect();
// device2.connect();