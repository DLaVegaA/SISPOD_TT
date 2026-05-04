import crypto from "crypto";

export const generarContra = () => {
    return crypto.randomBytes(6).toString("hex");
}

/* export const generarContra = (): string => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    let password = "";
    // Garantizar al menos un carácter de cada tipo (RN16)
    password += uppercase[crypto.randomInt(uppercase.length)];
    password += lowercase[crypto.randomInt(lowercase.length)];
    password += numbers[crypto.randomInt(numbers.length)];
    password += symbols[crypto.randomInt(symbols.length)];

    // Completar hasta llegar a los 12 caracteres
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 0; i < 8; i++) {
        password += allChars[crypto.randomInt(allChars.length)];
    }

    // Mezclar la contraseña para que el formato no sea predecible
    return password.split('').sort(() => 0.5 - Math.random()).join('');
}; */