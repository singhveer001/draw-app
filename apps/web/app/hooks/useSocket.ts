import { useEffect, useState } from "react";
import { WS_URL } from "../config";

export function  useSocket (){
    const [ loading , setLoading] = useState(true);
    const [socket, setSocket] = useState<WebSocket>();

    useEffect(()=>{
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJhbmRvbUBnbWFpbC5jb20iLCJ1c2VySWQiOiJiNGJmNTMwNi1iMzRjLTRmM2EtYTFkYS1lNTdiYTg2NDg3NDUiLCJpYXQiOjE3NTIwMzQ5MjMsImV4cCI6MTc1MjAzODUyM30.y2z2dC2XjhR9lrkU0U7c7F3DeiPqcEKoo53dL3Vxa4s`);
        ws.onopen = () => {
            setLoading(false);
            setSocket(ws);
        }
    },[])

    return {
        socket,
        loading
    }
}