import crypto from "crypto";


export const generarToken = () =>{
    return crypto.randomBytes(8).toString("hex");
}