import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";

type Shape = {
     type: "rect";
     x: number;
     y: number;
     width: number;
     height: number;
} | {
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
} | {
    type: "pencil",
    points?: { x: number; y: number }[];
    startX : number,
    startY: number,
    endX: number,
    endY: number
}


export class Game {

    private canvas: HTMLCanvasElement;
    private  ctx: CanvasRenderingContext2D;
    private existingShape : Shape[];
    private roomId : string;
    private clicked : boolean;
    private startX = 0;
    private startY = 0;
    private selectedTool: Tool = "circle";
    private currentPencilPoints: { x: number; y: number }[] = [];

    private getMousePos(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    socket : WebSocket

    constructor( canvas: HTMLCanvasElement, roomId : string, socket: WebSocket){
        this.canvas = canvas
        this.ctx = canvas.getContext("2d")!;
        this.existingShape = [];
        this.roomId = roomId;
        this.socket = socket;
        this.clicked = false;
        this.init();
        this.initHandlers();
        this.initMouseHandler();
    }

    destroy (){
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler);

        this.canvas.removeEventListener("mouseup", this.mouseUpHandler);

        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
    }

    setTool (tool: "circle" | "pencil" | "rect") {
        this.selectedTool = tool;
    }

    async init(){
        this.existingShape =  await getExistingShapes(this.roomId);
        this.clearCanvas();
    };

    initHandlers(){
        this.socket.onmessage =  (event) => {
            const message = JSON.parse(event.data);
            console.log("message",message)
            if(message.type === "chat"){
                const parsedShape= JSON.parse(message.message);
                this.existingShape.push(parsedShape.shape)
                this.clearCanvas();
            }
        }
    }

    clearCanvas(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "rgba(0, 0, 0)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.existingShape.forEach((shape) => {
            if (shape.type === "rect") {
                this.ctx.strokeStyle = "rgba(255, 255, 255)";
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            }else if(shape.type === "circle"){
                    this.ctx.beginPath();
                    this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.closePath();
            }else if (shape.type === "pencil" && shape.points) {
                    this.ctx.strokeStyle = "white";
                    this.ctx.beginPath();
                    shape.points.forEach((point, index) => {
                        if (index === 0) {
                            this.ctx.moveTo(point.x, point.y);
                        } else {
                            this.ctx.lineTo(point.x, point.y);
                        }
                    });
                    this.ctx.stroke();
                    this.ctx.closePath();
            }
        });
    }

    mouseDownHandler = (e) => {
        this.clicked = true;
        const pos = this.getMousePos(e);
        this.startX = pos.x;
        this.startY = pos.y;

        if (this.selectedTool === "pencil") {
            this.currentPencilPoints = [pos]; // start with first point
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
        }
    }

    mouseUpHandler = (e) => {
        this.clicked = false;
        const pos = this.getMousePos(e);
        const width = pos.x - this.startX;
        const height = pos.y - this.startY;
        const selectedTool = this.selectedTool;
        let shape : Shape | null = null;
        if(selectedTool === "rect"){
            shape = {
                type: "rect",
                x: this.startX,
                y: this.startY,
                width,
                height
            }
        }else if(selectedTool === "circle"){
            const radius = Math.max(width, height)/2;
            shape= {
                type: "circle",
                radius: radius,
                centerX: this.startX + radius,
                centerY: this.startY + radius,
            }
        }else if (selectedTool === "pencil") {
            shape = {
                type: "pencil",
                points: this.currentPencilPoints,
                startX: this.startX,
                startY: this.startY,
                endX: pos.x,
                endY: pos.y
            };
            this.ctx.closePath();
        }

        if(!shape){
            return;     
        }
        this.existingShape.push(shape);


        this.socket.send(JSON.stringify({
            type : "chat",
            message : JSON.stringify({
                shape
            }),
            roomId: this.roomId
        }))
        this.clearCanvas(); // Redraw everything

    }

    mouseMoveHandler = (e) => {
        if (this.clicked) {
            const pos = this.getMousePos(e);
            const width = pos.x - this.startX;
            const height = pos.y - this.startY;
            const selectedTool = this.selectedTool;

            if(selectedTool != "pencil"){
                this.clearCanvas(); // Clear and redraw
                this.ctx.strokeStyle = "rgba(255, 255, 255)";
            }

            if(selectedTool === "rect"){
                this.ctx.strokeRect(this.startX, this.startY, width, height);
            }else if(selectedTool === "circle"){
                const radius = Math.max(width,height)/2;
                const centerX = this.startX + radius;
                const centerY = this.startY + radius;    
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();
            }if (this.selectedTool === "pencil" ) {
                this.currentPencilPoints.push(pos);
                this.ctx.lineTo(pos.x, pos.y);
                this.ctx.strokeStyle = "rgba(255, 255, 255)";
                this.ctx.stroke();
            }
        }

    }

    initMouseHandler(){
        this.canvas.addEventListener("mousedown", this.mouseDownHandler);

        this.canvas.addEventListener("mouseup", this.mouseUpHandler);

        this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    }
}