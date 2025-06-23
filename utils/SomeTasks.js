import { get } from "node:http";

const getRendomValue = (array) => {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];  
}

export const someHeavyTask = () => {
    const ms = getRendomValue([100, 200, 500, 600, 900, 1000, 1200, 1500, 2000, 2500, 3000]);
    const shouldThrowError = getRendomValue([true, false]);
    
    if(shouldThrowError){
        throw new Error("An error occurred while processing the request");
    }

    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(`Task completed after ${ms} milliseconds`);
        }, ms);
    });
}

// const result = someHeavyTask()
//     .then((message) => {
//         console.log(message);
//     })
//     .catch((error) => {
//         console.error(error.message);
//     });