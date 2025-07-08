import { WebSocketServer, WebSocket } from 'ws';
import jwt, { decode, JwtPayload } from 'jsonwebtoken'
import {SECRET_TOKEN} from "@repo/backend-common/config"
import { prismaClient } from '@repo/db/client';
const wss = new WebSocketServer({port : 8080})

interface User {
    ws :WebSocket,
    rooms: string[],
    userId: string
}

const users: User[] = []

function checkUser (token : string): string | null{
   try {
        const decoded = jwt.verify(token,SECRET_TOKEN)

        if(typeof decoded == "string"){
            return null;
        }

        const payload = decoded as JwtPayload;
        if (!payload.userId || typeof payload.userId !== 'string') {
            return null;
        }
        return decoded.userId;
   } catch (error) {
        return null;
   }
}

wss.on("connection", function connection(ws,request){
    ws.on("error",console.error)
    const url = request.url;
    if(!url){
        return ;
    }
    const queryParams = new URLSearchParams(url.split('?')[1]);
    const token = queryParams.get('token') || ""
    const userId = checkUser(token);
    
    if(userId == null){
        ws.close();
        return ;
    }

    users.push({
        userId,
        rooms: [],
        ws
    })

    ws.on("message", async function message(data){
        const parsedData = JSON.parse(data as unknown as string);
        if(parsedData.type === "join_room"){
            const user = users.find(x => x.ws === ws);
            user?.rooms.push(parsedData.roomId);
        }

        if(parsedData.type === "leave_room"){
            const user = users.find( x => x.ws === ws);
            if(!user){
                return;
            }
            user.rooms = user?.rooms.filter(x => x === parsedData.room)
        }

        if(parsedData.type === "chat"){
            const roomId = parsedData.roomId ;
            const message = parsedData.message;

            await prismaClient.chat.create({
                data : {
                    roomId,
                    message,
                    userid: userId
                }
            })

            users.forEach(user => {
                if(user.rooms.includes(roomId)){
                    user.ws.send(JSON.stringify({
                        type: "chat",
                        message: message,
                        roomId
                    }))
                }
            })
        }
    })

})