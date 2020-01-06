const crypto = require('crypto');

const HELLO_PACKET = Buffer.from([
  0x21, 0x31, 0x00, 0x20, 
  0xFF, 0xFF, 0xFF, 0xFF,
  0xFF, 0xFF, 0xFF, 0xFF,
  0xFF, 0xFF, 0xFF, 0xFF,
  0xFF, 0xFF, 0xFF, 0xFF,
  0xFF, 0xFF, 0xFF, 0xFF,
  0xFF, 0xFF, 0xFF, 0xFF,
  0xFF, 0xFF, 0xFF, 0xFF,
]);

function Key(token) {
  return crypto
      .createHash('md5')
      .update(Buffer.from(token, 'hex'))
      .digest();
}

function Iv(token) {
  const key = crypto
      .createHash('md5')
      .update(Buffer.from(token, 'hex'))
      .digest();
  return crypto
      .createHash('md5')
      .update(key)
      .update(Buffer.from(token, 'hex'))
      .digest();
}

function parsePacket(msg) {
  return {
    magic: msg.slice(0, 2).toString('hex'),
    length: msg.readInt16BE(2),
    unknown: msg.slice(4, 8).toString('hex'),
    deviceId: msg.readInt32BE(8),
    deviceType: msg.readInt16BE(8),
    date: new Date(msg.readInt32BE(12) * 1000),
    timestamp: msg.readInt32BE(12),
    checksum: msg.slice(16, 32).toString('hex'),
    payload: msg.length > 32 ? msg.slice(32, msg.length) : null,
    raw: msg,
  };
}

function checkPayload(data) {
  if (data[data.length - 1] === 0) {
    return data.slice(0, data.length - 1);
  }
  return data;
}


module.exports = {
  HELLO_PACKET,
  Key,
  Iv,
  parsePacket,
  checkPayload,
}

