import crypto from "crypto";

export const generarContra = () => {
    return crypto.randomBytes(6).toString("hex");
}
