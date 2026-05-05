import { useState } from "react";

export function ImageWithFallback({ image, name }) {
    const [error, setError] = useState(false);

    if (error || !image) {
        return (
            <div className="w-full h-full flex items-center justify-center text-(--muted)">
                No Image
            </div>
        );
    }

    const finalUrl =
        typeof image === "string" && image.startsWith("http")
            ? image
            : `http://localhost:5001${image}`;

    return (
        <img
            src={finalUrl}
            alt={name}
            className="w-full h-full object-cover rounded rounded-t-3xl"
            onError={() => setError(true)}
        />
    );
}
