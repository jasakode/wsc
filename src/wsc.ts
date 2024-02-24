import {
    Config,
    OmitConfigNewWSC,
    Session,
    Events,
    EventsSession,
    Action,
    // Type For Inject Actions
    ActionFunction,
    ActionBuilder,
    ActionsObject,
    ActionConfing,
    KeyNameAction,
    Message,
    ActionsObjectRespon,
} from "./typings/commons";





export default class WSC {
    private _config: Config = this.initConfig();
    private _ws: WebSocket | undefined;
    private _sessions: Session = this.initSession();
    constructor(host: `${"ws"|"wss"}://${string}`, config?: Omit<Config, OmitConfigNewWSC>) {
        if(config) {
            this._config = { ...this._config, ...config, host: host };
        } else {
            this._config = { ...this._config, host: host };
        };
        this.loadWs();
    };

    get config(): Config {
        return this._config;
    };
    
    get connection(): Config["connection"] {
        return this._config.connection;
    };

    public addEventsListener(event: Events, fn: () => void) {
        this._sessions.events.push({
            id: "1",
            event: event,
            fn: fn,
        })
    };

    public injectAction<T extends Record<string, ActionFunction>>(actions: T): ActionsObject<T> {
        const result: any = {};
        if(actions) {
            Object.keys(actions).forEach((key) => {
                const conf = actions[key]({});
                const keyName = `Action${key.charAt(0).toUpperCase() + key.slice(1)}` as KeyNameAction<T>;
                const acf: ActionConfing = {
                    action: conf.action,
                    callback: conf.callback,
                    transmitHandler: conf.transmitHandler,
                    reciverHandler: conf.transmitHandler,
                };
                const action = actions[key];
                const builder: ActionBuilder = {
                    id: Math.random().toString(),
                    actionName: key,
                    sendAction: (act) => this.sendMessage({
                        id: Math.random().toString(),
                        status: "OK",
                        message: "MESSAGE",
                        action: conf.action,
                        date: Date.now(),
                        content_type: "apllication/json",
                        callback: conf.callback || false,
                        sign: "sign-abc",
                        session: "sesion-abc123",
                        data: act,
                    }),
                };
                result[keyName] = (...params: Parameters<typeof action>) => {
                    const respon: ActionsObjectRespon = {
                        send: () => {
                            acf.transmitHandler(builder);
                            return respon;
                        },
                    };
                    if(conf.callback === true) {
                        respon.onCallback = (fn) => {

                            return respon;
                        }
                    }
                    return respon;
                };
            });
        }
        return result as ActionsObject<T>;
    };
    // Private Function
    private onMessage(msg: Message) {
        console.log(msg)
    };
    private sendMessage(msg: Message) {
        if(this._ws) {
            this._ws.send(this.stringToBinary(msg))
        }
    };
    private stringToBinary(str: string | object): ArrayBuffer {
        let data = typeof str === "string" ? str : JSON.stringify(str);
        const encoder = new TextEncoder();
        return encoder.encode(data).buffer;
    }
    private initConfig(): Config {
        return {
            host: window.location.host + "/ws",
            autoConnect: true,
            connection: "close",
            reconnecting: 10000,
        };
    };
    private initSession(): Session {
        return {
            action: [],
            events: [],
        }
    };
    private updateConfig<K extends keyof Config>(key: K, value: Config[K]) {
        if(this._config) {
            this._config[key] = value;
        }
    };
    private updatedWS(wscon: WebSocket) {
        this._ws = wscon;
    };
    private connectionUpdate() {
        for (let i = 0; i < this._sessions.events.length; i++) {
            if(this._sessions.events[i].event === "connection") {
                this._sessions.events[i].fn();
            }
        }
    };
    private reconnecting() {
        setTimeout(() => this.loadWs(), this.config.reconnecting);
    };

    private loadWs() {
        const ws = new WebSocket(this._config.host || "");
        const method = {
          "updatedWS": this.updatedWS,
          "updateConfig": this.updateConfig,
          "connectionUpdate": this.connectionUpdate,
          "reconnecting": this.reconnecting,
          "onMessage": this.onMessage,
        };
        const callMethod = <K extends keyof typeof method, A extends Parameters<typeof method[K]>>(
            name: K,
            ...args: A
        ) => {
            switch (name) {
                case "updateConfig":
                    this.updateConfig(args[0] as any, args[1]);
                    break;
                case "updatedWS":
                    this.updatedWS(args[0] as any);
                    break;
                case "connectionUpdate":
                    this.connectionUpdate();
                    break;
                case "onMessage":
                    this.onMessage(args[0] as Message);
                    break;
                case "reconnecting":
                    this.reconnecting();
                    break;
            }
        };

        ws.onclose = function(args) {
            callMethod("updateConfig", "connection", args.type);
            callMethod("connectionUpdate");
            callMethod("reconnecting");
        };
        ws.onerror = function(args) {
            callMethod("updateConfig", "connection", args.type);
            callMethod("connectionUpdate");
        };
        ws.onopen = function(args) {
            callMethod("updatedWS", ws);
            callMethod("updateConfig", "connection", args.type);
            callMethod("connectionUpdate");
        };
        ws.onmessage = function(args) {
            const fr = new FileReader();
            fr.onload = function() {
                if(fr.result) {
                    const rs : Message = JSON.parse(fr.result as string);
                    callMethod("onMessage", rs);
                }
            };
            fr.onerror = function (ev) {
                console.log("error parse blob to Object Message")
            }
            fr.readAsText(args.data);
        };
    };

};
