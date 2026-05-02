import multer from "multer";
import path from 'path';
import fs from 'fs';

const uploadPath = 'uploads/';
if(!fs.existsSync(uploadPath)){
    fs.mkdirSync(uploadPath);
}

const storage = multer.diskStorage({
    destination:(req,file,cb) =>{
        cb(null,uploadPath);
    },
    filename:(req,file,cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos PDF') as any, false);
    }
};


const limits: multer.Options['limits'] ={
    fileSize: 5*1024*1024
};

export const upload = multer({
    storage,
    fileFilter,
    limits
});