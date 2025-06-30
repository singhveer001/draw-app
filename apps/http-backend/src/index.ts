import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { middleware } from './middleware';
import {SECRET_TOKEN} from "@repo/backend-common/config"
import {CreateUserSchema, SignInSchema, CreateRoomSchema } from "@repo/common/types"
import { prismaClient } from "@repo/db/client"
const app = express();

app.post('/signup', async (req,res) => {
    const parsedData = CreateUserSchema.safeParse(req.body)
    if(!parsedData.success){
        res.json({
            message : "Incorrect Input"
        })
        return ;
    }
    try {
        const hashedPassword  =await bcrypt.hash(parsedData.data?.password,16);
        await prismaClient.user.create({
            data : {
                email : parsedData.data?.username,
                password : hashedPassword,
                name : parsedData.data.name
            }
        }) 
        const token = jwt.sign({email : parsedData.data?.username},SECRET_TOKEN)
        res.send({
            message : "Signup Successfully",
            token : token
        })
    } catch (error) {
        console.log("User Already exist")
        res.status(404).send({
            mesaage : "User Already exist With this username"
        })
    }
})

app.post('/signin',async (req,res) => {
    const parsedData = SignInSchema.safeParse(req.body);
    if(!parsedData){
        res.json({
            message : "Incorrect Inputs"
        })
        return ;
    }
    try {
        const user = await prismaClient.user.findFirst({
            where:{
                email : parsedData.data?.username
            }
        });;
        const hashedPassword = bcrypt.compare(parsedData.data.password,user.password);
        if(!hashedPassword){
            res.status(401).json({
                message : "Invalid credentials"
            })
        }
        const token = jwt.sign({parsedData.data?.username},SECRET_TOKEN,{expireIn : '1hr'})
        res.status(200).send({
            username : parsedData.data?.username,
            token : token
        })
    } catch (error) {
        console.log("User not found");
        res.status(411).json({
            msg: "User Not found"
        })
    }
})

app.post("/room", middleware, (req,res) => {
    const data = CreateRoomSchema.safeParse(req.body);
    if(!data){
        res.json({
            message : "Incorrect Inputs"
        })
        return ;
    }
    //db call
    res.json({
        roomId :123
    })
})

app.listen(3001, ()=> {
    console.log("Server started at port 3000")
})