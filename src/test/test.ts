
import WSC, { Message, MessageForm, Config } from "..";

declare global {
    interface Window {
      ping: () => void;
      resourceSourceGet: () => void;
    }
};


document.addEventListener("DOMContentLoaded", () => {
    const ws = new WSC();
    ws.connect("ws://127.0.0.1:8080/ws");

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

    window.ping = () => {

        const msg: Message<any> = {
            id: ActionAuth.generateMessageID("characters"),
            action: "ping",
            status: "OK",
            message: "",
            headers: {},
            callback: false,
            date: Date.now(),
            data: {},
        };
        ws.send(msg);
        // console.log("Ping", ws.)
    };

    window.resourceSourceGet = () => {
        const message: MessageForm<{ page: number, page_size: number }> = {
            status: "OK",
            message: "Get Resource Sources",
            action: "resource-source-get",
            headers: {},
            data: {
                page: 1, 
                page_size: 20
            }
        };
        ws.sendCallback(message, msg => {
            console.log(msg)
        });
    }
   
});