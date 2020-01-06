const EventEmitter = require('events');
const dgram = require('dgram');
const crypto = require('crypto');

const { HELLO_PACKET, Key, Iv, parsePacket, checkPayload } = require('./tools');

const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;


class MiIO extends EventEmitter {
  constructor(options) {
    super();

    this.options = options;

    this.session = {
      token: Buffer.from(options.token, 'hex'),
      key: Key(options.token),
      iv: Iv(options.token),
      header: null,
    }

    this.client = dgram.createSocket('udp4');
    this.client.on('message', this.message.bind(this));

    this.readyState = CLOSED;
  }

  message(data, info) {
    const msg = parsePacket(data);
    
    if (this.readyState === OPEN && msg.payload !== null) {
      const cipher = crypto.createDecipheriv('aes-128-cbc', this.session.key, this.session.iv);
      try {
        const payload = checkPayload(Buffer.concat([cipher.update(msg.payload), cipher.final()]));
        this.emit('message', JSON.parse(payload.toString()));
      } catch (e) {
        console.log('ERROR:', e.message);
      }
    }

    if (this.readyState === CONNECTING) {
      this.session.header = Buffer.alloc(32);
      data.copy(this.session.header, 0, 0, 32);
      this.readyState = OPEN;
      this.emit('open');
    }
  }

  send(data) {
    if (this.readyState === OPEN) {
      const cipher = crypto.createCipheriv('aes-128-cbc', this.session.key, this.session.iv);
      
      if (data.id === undefined) {
        data.id = Date.now();
      }
      
      const payload = Buffer.concat([
        cipher.update(Buffer.from(JSON.stringify(data))),
        cipher.final(),
      ]);

      this.session.header.writeInt16BE(this.session.header.length + payload.length, 2);
      
      const sig = crypto.createHash('md5')
        .update(this.session.header.slice(0, 16))
        .update(this.session.token)
        .update(payload)
        .digest();
      sig.copy(this.session.header, 16);
  
      this.client.send(Buffer.concat([this.session.header, payload]), 54321, this.options.ip, () => {});
    }
  }

  connect() {
    if (this.readyState === CLOSED) {
      this.readyState = CONNECTING;
      this.client.send(HELLO_PACKET, 54321, this.options.ip, (err) => {});
    }
  }

}


module.exports = MiIO;