// TODO: don't load this from node_modules. It's not guaranteed to work.
// Either need to download omnistreams manually or bundle everything with
// webpack or similar.
import { encodeObject, decodeObject, initiateWebSocketMux } from 'omnistreams';
import { FileReadProducer } from 'omnistreams-filereader';

class RPC {

  constructor(mux) {

    this._nextRequestId = 1;
    this._mux = mux;
    
    mux.onControlMessage((rawMessage) => {
      const message = decodeObject(rawMessage)
      console.log(message);

      if (message.id !== undefined) {
      }
    });
  }

  uploadFile(path, file) {

    const fileStream = new FileReadProducer(file);

    const consumer = this._mux.createConduit(encodeObject({
      id: this._nextRequestId++,
      jsonrpc: '2.0',
      method: 'uploadFile',
      params: {
        path,
      },
    }));

    fileStream.pipe(consumer);
    fileStream.onTermination(() => {
      console.error("terminated");
    })
  }
}

class RPCBuilder {

  constructor() {
    this._address = '127.0.0.1';
    this._port = 9001;
    this._secure = true;
  }

  address(value) {
    this._address = value;
    return this;
  }

  port(value) {
    this._port = value;
    return this;
  }

  secure(value) {
    this._secure = value;
    return this;
  }

  async build() {

    const mux = await initiateWebSocketMux({
      address: this._address,
      port: this._port,
      secure: this._secure,
    });

    return new RPC(mux);
  }
}

export {
  RPCBuilder,
};
