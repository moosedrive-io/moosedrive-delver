// TODO: don't load this from node_modules. It's not guaranteed to work.
// Either need to download omnistreams manually or bundle everything with
// webpack or similar.
import { encodeObject, decodeObject, initiateWebSocketMux } from 'omnistreams';

class RPC {

  constructor({ address, port, secure }) {
    initiateWebSocketMux({ address, port, secure }).then((mux) => {
      this._mux = mux;

      mux.onControlMessage((rawMessage) => {
        const message = decodeObject(rawMessage)
        console.log(message);
      });
    });
  }

  uploadFile() {
    this._mux.sendControlMessage(encodeObject({
      jsonrpc: '2.0',
      method: 'uploadFile',
      params: {},
    }));
  }
}

export {
  RPC,
};
