import React from "react";

const PageHeading = ({ heading, subheading, children }) => {
    return (
        <div className="mb-6">
            {heading && (
                <h1 className="text-2xl font-bold text-(--ink)">
                    {heading}
                </h1>
            )}
            {subheading && (
                <p className="text-sm text-(--muted) mt-1">
                    {subheading}
                </p>
            )}
            {children}
        </div>
    );
};

export default PageHeading;
