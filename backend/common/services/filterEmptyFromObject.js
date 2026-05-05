export const filterEmptyValues = (data) => {
    return Object.fromEntries(
        Object.entries(data).filter(([_, value]) => {
            if (value === null)                           return false;
            if (value === undefined)                      return false;
            if (value === "")                             return false;
            if (Array.isArray(value) && value.length === 0) return false;
            return true;
        })
    );
};