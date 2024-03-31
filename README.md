# WSC

wesocket client easy to use, 


### Connecting
```js
import WSC, { Message, MessageForm, Config } from "wsc";

const config : Config = {
    host: `wss://${window.location.host}`,
    autoConnect: false,
    connection: "close",
    reconnecting: false,
    reconnectingTime: 10000,
};

const ws = new WSC(); // config optional
ws.connect("ws://127.0.0.1:8080/ws");

```

### create Authenctication 
```js

const { ActionAuth } = ws.injectAction({
    Auth: "authentication"
});

ActionAuth.onMessage((msg) => {
    const message: MessageForm<any> = {
        action: "authentication",
        status: "OK",
        message: "",
        headers: {},
        data: {
            username: "admin",
            password: "admin"
        },
    };
    ActionAuth.respon(msg.id, message);
});

```
