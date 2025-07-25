"use client"

import { WS_URL } from "@/config";
import { useEffect, useState } from "react";
import { Canvas } from "./Canvas";

export function RoomCanvas ({roomId} : {roomId : string}){
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(()=>{
        const ws  = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJhbmRvbTFAZ21haWwuY29tIiwidXNlcklkIjoiMGQwYTgxOWEtNmM1ZC00ZTU5LTg0NGMtNGQ4ZjhkYzU4YTdmIiwiaWF0IjoxNzUzNDQxNTE1LCJleHAiOjE3NTM0NDUxMTV9.S7-_IhwAeDe_AOgZ5zjeSNvzq0DZ9GORQX1TRSslQeE`);

        ws.onopen = () => {
            setSocket(ws);
            ws.send(JSON.stringify({
                type: "join_room",
                roomId
            }))
        }
    }, [])


    if(!socket){
        return <div>
            Connecting to server.....
        </div>
    }

    return <div>
        <Canvas roomId={roomId} socket={socket}/>
    </div>
}