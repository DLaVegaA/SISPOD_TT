import {Token} from '../models/index';

export const verificarTokenReset = async(token:string) =>{
    const registro = await Token.findOne({
        where:{
            token
        }
    });
    if(!registro){
        throw new Error('Token_No_existe');
    }
    //ver que hacer con si estan expirados

    return registro;
}