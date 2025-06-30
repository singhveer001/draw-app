import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { SECRET_TOKEN } from "@repo/backend-common/config";

export function middleware(req: Request, res: Response, next: NextFunction) {
    const header = req.headers["authorization"];

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ 
            message: "Missing or invalid token" 
        });
    }

    const token = header.split(" ")[1] ;

    try {
        //@ts-ignore
        const decoded = jwt.verify(token,SECRET_TOKEN) ;
        // @ts-ignore
        req.userId = decoded.userId;
        next(); 
    } catch (err) {
        return res.status(403).json({ 
            message: "Unauthorized access" 
        });
    }
}
