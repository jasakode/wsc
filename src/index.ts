import WSC from "./wsc";


interface People {
    name: string;
    age: number;
}


document.addEventListener("DOMContentLoaded", () => {
    const ws = new WSC("ws://127.0.0.1:8000/ws");

    const act =  ws.injectAction({
        test: ({ name="", age=0, address="" }: { name: string; age: number; address: string; }) => ({
            action: "reset-id",
            transmitHandler: (builder) => {
                builder.sendAction({
                    name: "Anton",
                })
            },
            reciverHandler: () => {

            },
        }),
        tempe: () => ({
            action: "reset-session",
            transmitHandler: (builder) => {
                builder.sendAction({
                    name: "Anton",
                })
            },
            reciverHandler: () => {

            },
        }),
    });

    ws.addEventsListener("connection", () => {
        if(ws.connection === "open") {
            // act.ActionTest({ name: "anton", age: 12, address: "jakarta" }).send();
        }
    });

    

   
});