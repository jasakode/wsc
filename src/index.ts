
/**
 * Websocket Connetion Events
 */
type ConfigConnecting = "open" | "close" | "error" | "open";
/**
 * WSC Config
 * @param {string} host url websocket server yang dituju contoh: wss://example.com/ws
 * @param {ConfigConnecting} connection event websocket
 */
export interface Config {
    host: string;
    connection: ConfigConnecting;
    autoConnect?: boolean;
    reconnecting?: boolean;
    reconnectingTime?: number;
};
/**
 * SessionsEvent
 */
interface SessionsEvent<T extends unknown = any> {
    id: string;
    event: keyof EventMaps;
    handler: EventHandler<T>;
};
/**
 * SessionsAction
 */
interface SessionsAction {
    id: string;
    action: string;
    handler: (msg: Message) => void;
};
interface SessionsCallbackMessage {
    id: string;
    callback_id: string;
    handler: (msg: Message) => void;
};
/**
 * Websocket Sessions
 * ini memua semua session dan events
 */
interface Sessions {
    events_list: string[];
    actions_list: string[];
    callback_message: SessionsCallbackMessage[];
    events: SessionsEvent<any>[];
    actions: SessionsAction[];
    callback_message_id: string[];
};

/**
 * EventConnection
 */
interface EventConnection {
    connection: ConfigConnecting;
};

interface EventMessage {
    message: Message;
};
/**
 * Events Maps
 */
interface EventMaps {
    "connection": EventConnection;
    "message": EventMessage;
};
/**
 * EventHandler
 */
type EventHandler<T> = (event: T) => void;

/**
 * Message status
 */
type MessageStatus = "OK" | "ERROR";

/**
 * Message
 * @param {string} id indetifikasi unik
 * @param {string} status
 * @param {string} message
 * @param {Record<string, string>} headers
 * @param {boolean} callback
 * @param {number} date
 * @param {any} data
 */
export interface Message<D extends unknown = any> {
    id: string;
    status: MessageStatus;
    message: string;
    action: string;
    headers: Record<string, string>;
    callback: boolean;
    date: number;
    data: D;
};

export type MessageForm<D extends unknown = any> = Omit<Message<D>, "id" | "callback" | "date">;


export interface ActionsMethod {
    /**
     * 
     */
    generateMessageID: typeof generateID;
    /**
     * 
     * @param msg 
     */
    send(msg: Message) : void;
    /**
     * 
     * @param msg 
     * @param fn 
     */
    sendCallback(msg: MessageForm, fn: (msg: Message) => void): void;
    /**
     * 
     * @param messageID 
     * @param msg 
     */
    respon<D extends unknown = any>(messageID: string, msg: MessageForm<D>): void;
    /**
     * 
     * @param fn 
     */
    onMessage(fn: (msg: Message) => void): void;
};
export type ActionsFunc<T extends Record<string, string>> = {
    [K in keyof T as `Action${Capitalize<string & K>}`]: ActionsMethod;
};
export type Actions = (action: string) => ActionsMethod;








// Initial Value, Config and Constant
const initialConfig: Config = {
    host: `wss://${window.location.host}`,
    autoConnect: false,
    connection: "close",
    reconnecting: false,
    reconnectingTime: 10000,
};
const initialSessions: Sessions = {
    events_list: [],
    actions_list: [],
    callback_message: [],
    events: [],
    actions: [],
    callback_message_id: [],
};

// Helper 
/**
 * 
 * @param type 
 * @param length 
 * @returns 
 */
function generateID<Type extends "number" | "characters" | "characters-uppercase">(
    type: Type,
    length: number = 32,
): Type extends "number" ? number : string {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const charactersUppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const numbers = '123456789';
    let charset: string;
    
    switch (type) {
        case "number":
            charset = numbers;
            break;
        case "characters-uppercase":
            charset = charactersUppercase;
            break;
        default:
            charset = characters;
            break;
    };

    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        result += charset.charAt(randomIndex);
    };
    if (type === "number") {
        return Number(result) as Type extends "number" ? number : never;
    };
    return result as Type extends "number" ? never : string;
};
/**
 * 
 * @param arr 
 * @param validate 
 * @returns 
 */
function strMapInclude(arr: string[], validate: string) {
    for (let i = 0; i < arr.length; i++) {
        if(arr[i] === validate) return true;
    }
    return false;
};
/**
 * 
 * @param arr 
 * @param validate 
 * @returns 
 */
function numMapInclude(arr: number[], validate: number) {
    for (let i = 0; i < arr.length; i++) {
        if(arr[i] === validate) return true;
    }
    return false;
};
/**
 * 
 * @param data 
 * @returns 
 */
async function messageJSON<D extends unknown = any>(data: Blob): Promise<Message<D> | null> {
    try {
        const jsonString: string = await data.text(); // Baca data dari Blob
        const res: Message<D> = JSON.parse(jsonString); // Parse JSON
        return res;
    } catch (error) {
        console.error("Error parsing JSON:", error); // Tangani kesalahan dengan mencetaknya ke konsol
        return null; // Kembalikan null untuk menunjukkan kesalahan
    }
};


/**
 * 
 */
export default class WSC {
    private _config: Config = initialConfig;
    private _ws: WebSocket | undefined;
    private _sessions: Sessions = initialSessions;

    constructor(config?: Omit<Config, "connection">) {
        if(config) {
            this._config = { ...this._config, ...config };
        };
        if(this._config.autoConnect) {
            this.connect();
        };
    };

    get config(): Config {
        return this._config;
    };

    /**
     * Add Event Listener
     * @param {keyof EventMaps} event event yang ingin di track
     * @param handler fungsi untuk menangani event
     */
    public addEventsListener<K extends keyof EventMaps>(event: K, handler: EventHandler<EventMaps[K]>) {
        if(!strMapInclude(this._sessions.events_list, event)) {
            this._sessions.events_list = [ ...this._sessions.events_list, event];
        };
        const newevent : SessionsEvent<EventMaps[K]> = {
            id: generateID("characters"),
            event: event,
            handler: handler,
        }
        this._sessions.events = [...this._sessions.events, newevent];
    };

    /**
     * 
     * @param fn 
     * @param action 
     */
    private actionMethodOnMessage(fn: (msg: Message) => void, action: string) {
        if(!strMapInclude(this._sessions.actions_list, "")) {
            this._sessions.actions_list = [...this._sessions.actions_list, action];
        };
        this._sessions.actions = [ ...this._sessions.actions, {
            id: generateID("characters"),
            action: action,
            handler: fn
        }];
    };
    /**
     * 
     * @param msg 
     */
    private actionMethodSend(msg: Message) {
        this._send(msg);
    };
    private actionMethodRespon(messageID: string, msg: MessageForm) {
        const message : Message<any> = {
            ...msg,
            id: messageID,
            callback: false,
            date: Date.now(),
        };
        this._send(message);
    };
    private actionMethodSendCallback(msg: MessageForm, fn: (msg: Message) => void) {
        const message: Message<any> = {
            ...msg,
            id: generateID("characters"),
            callback: true,
            date: Date.now(),
        };
        if(!strMapInclude(this._sessions.callback_message_id, message.id)) {
            this._sessions.callback_message_id.push(message.id);
            const cb : SessionsCallbackMessage = {
                id: generateID("characters"),
                callback_id: message.id,
                handler: fn,
            }
            this._sessions.callback_message.push(cb);
            this._send(message);
        };
    };
    private actionMethod(action: string): ActionsMethod {
        const rs: any = {};
        Object.assign(rs, {
            generateMessageID: generateID,
            onMessage: (fn: (msg: Message) => void) => { this.actionMethodOnMessage(fn, action) },
            send: (msg: Message) => { msg.callback = false; this.actionMethodSend(msg) },
            sendCallback: (msg: Message, fn: (msg: any) => void) => { msg.callback = true; this.actionMethodSendCallback(msg, fn); },
            respon: (...args: Parameters<ActionsMethod["respon"]>) => this.actionMethodRespon(...args),
        });
        return rs as ActionsMethod;
    };

    /**
     * 
     * @param actions 
     * @returns 
     */
    public injectAction<T extends Record<string, string>>(actions: T): ActionsFunc<T> {
        const result: any = {};
        Object.keys(actions).forEach(key => {
            const keyAction = `Action${key.charAt(0).toUpperCase() + key.slice(1)}` as `Action${Capitalize<string & keyof T>}`;
            Object.assign(result, { [keyAction]: this.actionMethod(actions[key]) });
        });
        return result as ActionsFunc<T>;
    };
    /**
     * mutiple inject actions
     */
    public injectActions<T extends Record<string, string>>(actions: T[]): ActionsFunc<T> {
        const result: any = {};
        for (let i = 0; i < actions.length; i++) {
            const act = actions[i];
            Object.keys(act).forEach(key => {
                const keyAction = `Action${key.charAt(0).toUpperCase() + key.slice(1)}` as `Action${Capitalize<string & keyof T>}`;
                Object.assign(result, { [keyAction]: this.actionMethod(act[key]) });
            });
        }
        return result as ActionsFunc<T>;
    };

    /**
     * Websocket coneted function
     */
    public connect(host?: `${"ws"|"wss"}://${string}`) {
        const ws = new WebSocket(host || this._config.host);
        if(host) { this._config.host = host; };
        this._ws = ws;
        this.init();
    };
    /**
     * Menutup koneksi websocket
     */
    public close() {
        if(this._ws) {
            this._ws.close();
            this._ws = undefined;
        };
    };

    /**
     * 
     * @param message 
     */
    public send<T extends unknown = any>(message: MessageForm<T>) {
        const msg : Message<T> = {
            ...message,
            id: generateID("characters"),
            callback: false,
            date: Date.now(),
        };
        this._send(msg);
    };
    public sendCallback<T extends unknown = any>(message: MessageForm<T>, fn: (msg: Message) => void) {
        const msg : Message<T> = {
            ...message,
            id: generateID("characters"),
            callback: true,
            date: Date.now(),
        };
        if(!strMapInclude(this._sessions.callback_message_id, msg.id)) {
            this._sessions.callback_message_id.push(msg.id);
            const cb : SessionsCallbackMessage = {
                id: generateID("characters"),
                callback_id: msg.id,
                handler: fn,
            }
            this._sessions.callback_message.push(cb);
            this._send(msg);
        };
    };

    /**
     * 
     * @param message 
     */
    private _send(message: Message<any>) {
        if(this._ws) {
            this._ws.send(this.stringToBlob(JSON.stringify(message)))
        }
    };

    /**
     * 
     * @param iid 
     */
    private getAndDestroyCbMessage(callback_id: string): SessionsCallbackMessage | undefined {
        let list: SessionsCallbackMessage[] = [];
        let cb: SessionsCallbackMessage | undefined;
        for (let i = 0; i < this._sessions.callback_message.length; i++) {
            if(this._sessions.callback_message[i].callback_id === callback_id) {
                cb = this._sessions.callback_message[i];
            } else {
                list.push(this._sessions.callback_message[i]);
            }
        };
        if(cb) {
            return cb;
        };
        return undefined
    };

    /**
     * 
     * @param action 
     */
    private getAction(action: string): SessionsAction | undefined {
        for (let i = 0; i < this._sessions.actions.length; i++) {
            if(this._sessions.actions[i].action === action) {
                return this._sessions.actions[i];
            }
        };
        return undefined;
    };

    /**
     * 
     * @param event 
     * @returns 
     */
    private getEvent<K extends keyof EventMaps>(event: K): SessionsEvent<EventMaps[K]> | undefined {
        for (let i = 0; i < this._sessions.events.length; i++) {
            if(this._sessions.events[i].event === event) {
                return this._sessions.events[i];
            }
        };
        return undefined;
    };

    /**
     * 
     * @param str 
     * @param type 
     * @returns 
     */
    private stringToBlob(str: string, type?: "application/json"): Blob {
        const blobParts = [JSON.stringify(str)];
        const blobOptions = { type: type || "" };
        return new Blob(blobParts, blobOptions);
    };

    /**
     * onAction 
     * @param data 
     */
    private async onAction(data: Blob) {
        const msg = await messageJSON<Message<any>>(data);
        if(msg && msg.action != "") {
            if(strMapInclude(this._sessions.callback_message_id, msg.id)) {
                this.getAndDestroyCbMessage(msg.id)?.handler(msg);
            } else if(strMapInclude(this._sessions.actions_list, msg.action)) {
                this.getAction(msg.action)?.handler(msg);
            }
        };
    };
    
    private async onMessage(msg: MessageEvent) {
        const message = await messageJSON<any>(msg.data);
        if(message && strMapInclude(this._sessions.events_list, "message")) {
            const ev: EventMaps["message"] = {
                message: message
            };
            this.getEvent("message")?.handler(ev);
        }
    };

    /**
     * Memulai Ulang Koneksi Websocket
     */
    private reconnecting() {
        if(this._config.reconnecting && this._config.reconnectingTime) {
            setTimeout(() => this.init(), this.config.reconnectingTime);
        };
    };
    /**
     * Menginisialisasi WebSocket/membuat koneksi Websocket
     */
    private init() {
        const wsOpen = (args: Event) => {
            console.log("Connected to", (args.target as WebSocket).url)
            this._config.connection = "open";
            if(strMapInclude(this._sessions.events_list, "connection")) {
                for (let i = 0; i < this._sessions.events.length; i++) {
                    if(this._sessions.events[i].event === "connection") {
                        this._sessions.events[i].handler({
                            connection: this._config.connection,
                        });
                    } 
                };
            };
        };
        const wsClose = (args: Event) => {
            this._config.connection = "close";
            if(strMapInclude(this._sessions.events_list, "connection")) {
                for (let i = 0; i < this._sessions.events.length; i++) {
                    if(this._sessions.events[i].event === "connection") {
                        this._sessions.events[i].handler({
                            connection: this._config.connection,
                        });
                    } 
                };
            };
        };
        const wsError = (args: Event) => {
            this._config.connection = "close";
            if(strMapInclude(this._sessions.events_list, "connection")) {
                for (let i = 0; i < this._sessions.events.length; i++) {
                    if(this._sessions.events[i].event === "connection") {
                        this._sessions.events[i].handler({
                            connection: this._config.connection,
                        });
                    } 
                };
            };
        };
        const wsOnMessage = (args: MessageEvent) => {
            this.onMessage(args);
            if(args.data instanceof Blob) {
                this.onAction(args.data);
            }
        };

        if(this._ws) {
            this._ws.onopen = wsOpen;
            this._ws.onclose = wsClose;
            this._ws.onerror = wsError;
            this._ws.onmessage = wsOnMessage;
        };
    };
};

