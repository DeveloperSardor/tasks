export const errorMessage = (message)=>{
    return {
        status : 400,
        message,
        success : false
    }
}