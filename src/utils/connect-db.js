import dotenv from 'dotenv'
import mongoose from 'mongoose';
dotenv.config();


export async function connectToDb(){
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log(`Successfuly connected to db!`);
    } catch (error) {
        console.error(error.message)
    }
}

