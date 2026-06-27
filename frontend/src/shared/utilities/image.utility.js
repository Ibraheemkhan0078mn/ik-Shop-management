 

export const toImageUrl = (img) => !img ? null : img.startsWith("http") ? img : `http://localhost:5001/uploads/${img}`;
