import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { middleware } from './middleware';
import {SECRET_TOKEN} from "@repo/backend-common/config"
import {CreateUserSchema, SignInSchema, CreateRoomSchema } from "@repo/common/types"
import { prismaClient } from "@repo/db/client"
const app = express();
app.use(express.json());
                                           
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
        const user = await prismaClient.user.create({
            data : {
                email : parsedData.data?.username,
                password : hashedPassword,
                name : parsedData.data.name
            }
        }) 
        const token = jwt.sign({email : parsedData.data?.username, userId : user.id},SECRET_TOKEN)
        res.send({
            message : "Signup Successfully",
            userId : user.id,
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
    if(!parsedData.success){
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
        });
        if(!user){
            res.status(404).json({
                message: "User not found"
            })
            return ;
        }
        const matchPassword =await bcrypt.compare( parsedData.data.password, user.password );
        if(!matchPassword){
            res.status(401).json({
                message : "Invalid credentials"
            })
        }
        const token = jwt.sign( { email: parsedData.data.username, userId : user.id },SECRET_TOKEN,{expiresIn : '1hr'})
        res.status(200).send({
            username : parsedData.data?.username,
            token : token
        })
    } catch (error) {
        console.log("Error in signin", error);
        res.status(500).json({
            msg: "Internal server error"
        })
    }
})

app.post("/room", middleware, async (req,res) => {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if(!parsedData.success){
        res.json({
            message : "Incorrect Inputs"
        })
        return ;
    }
    //@ts-ignore
    const userId = req.userId;
    try {
        const room = await prismaClient.room.create({
            data: {
                slug : parsedData.data.roomName,
                adminId : userId
            }
        })
        res.status(200).json({
            roomId :room.id
        })
    } catch (error) {
        console.error();
        res.status(411).json({
            messgae: "Room already exist with this name"
        })
    }
})
  
app.get("/chats/:roomId", async (req,res) => {
    const roomId = Number(req.params.roomId);

    const messages = await prismaClient.chat.findMany({
        where : {
            roomId : roomId
        },
        orderBy : {
            id : "desc"
        },
        take: 50
    });
    res.status(200).json({
        messages
    })
})

app.get("/room/:slug", async (req,res) => {
    const slug = req.params.slug;

    const room = await prismaClient.room.findFirst({
        where : {
            slug 
        }
    });
    res.status(200).json({
        room
    })
})

app.listen(3001, ()=> {
    console.log("Server started at port 3000")
})