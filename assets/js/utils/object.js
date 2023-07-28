export function mergeObjectsWithPrototypes(obj1, obj2) {
    
    const mergedObj = Object.create(Object.getPrototypeOf(obj1));

    for (let prop in obj2) {
        if (obj2.hasOwnProperty(prop)) {
            mergedObj[prop] = obj2[prop];
        }
    }

    return mergedObj;
};