# WSC

wesocket client easy to use, 


###
```js
import WSC, { Action } from "wsc";

const ws = new WSC("ws://127.0.0.1:3000/ws")
ws.connect((connection, message) => {
    console.log(connection, message)
});

// Send Action

```