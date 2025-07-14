"use client"

import { BACKEND_URL } from "@/config";
import { Button } from "@repo/ui/button";
import { useState } from "react";
import axios from "axios";

export default function AuthPage ({ isSignin }: {
    isSignin : boolean;
}){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAuth = async () => {
        try {
            setLoading(true);
            const response = await axios.post(`${BACKEND_URL}/${isSignin ? "signin" : "signup"}`,{
                username : email,
                password
            })
            localStorage.setItem("token", response.data.token)
        } catch (error) {
            console.error("Auth error:", error);
            alert("Authentication failed. Please try again.");
        }finally{
            setLoading(false);
        }
    }

    return <div className="w-screen h-screen flex justify-center items-center bg-slate-200">
        <div className="p-2 m-2 bg-white rounded flex flex-col gap-4">
            <div className="p-2 border">
                <input type="text" value={email} onChange={(e) => {
                    setEmail(e.target.value)
                }} placeholder="Email"/>
            </div>
            <div className="p-2 border">
                <input type="password" value={password} onChange={(e) => {
                    setPassword(e.target.value);
                }} placeholder="Password"/>
            </div>

            <div className="text-center ">
                <Button className="rounded-lg bg-blue-400 hover:bg-blue-600" variant="secondary" size="lg" onClick={handleAuth} >
                    {loading ? "Loading..." : isSignin ? "Sign in" : "Sign up"}
                </Button>
            </div>

        </div>
    </div>
}