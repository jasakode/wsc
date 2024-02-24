



export interface Config {
    host?: string;
    autoConnect?: boolean;
    connection: "open" | "close" | "error" | "open";
    reconnecting?: number;
};

export type OmitConfigNewWSC = "connection";

/**
 * this is default action don't add handler use this action
 * Create custom action start with "action-{name action}" #action-get-user
 */
type Actions = "reset-id" | "reset-session" | "ping" | `action-${string}`;


export interface Message {
    id: string;
    status: string;
    message: string;
    action: Actions;
    date: number;
    content_type: string;
    callback: boolean;
    sign: string;
    session: string;
    data: any;
};

export interface Action {
    action: Actions;
};

export type Events = "connection";
export interface EventsSession {
    id: string;
    event: Events;
    fn(): void; 
}

export interface Session {
    action: Action[];
    events: EventsSession[],
};

// Create Action
export type KeyNameAction<T extends Record<string, any>> = `Action${Capitalize<string & keyof T>}`;

/**
 * @param action
 * @param callback
 * @param transmitHandler
 * @param reciverHandler
 */
export interface ActionConfing {
    action: Actions,
    callback?: boolean;
    transmitHandler: (builder: ActionBuilder) => void;
    reciverHandler?: (builder: ActionBuilder) => void;
};
export type ActionFunction = (args: any) => ActionConfing;
export interface ActionBuilder {
    id: string;
    actionName: string;
    sendAction: (act: any) => void;
};
export interface ActionsObjectRespon {
    send: () => ActionsObjectRespon;
    onCallback?: (fn: (msg: Message) => void) => ActionsObjectRespon
};
export type ActionsObject<T extends Record<string, ActionFunction>> = {
    [K in keyof T as `Action${Capitalize<string & K>}`]: <OmitKey extends string>(...args: Parameters<T[K]>) => ActionsObjectRespon;
};



