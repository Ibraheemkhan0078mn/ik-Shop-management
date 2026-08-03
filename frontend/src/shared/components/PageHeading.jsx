import React from "react";

const PageHeading = ({ heading, subheading, leftActions, rightActions }) => {
    return (
        <div className="flex flex-col gap-4 mb-6">
            <div>
                {heading && (
                    <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
                        {heading}
                    </h1>
                )}
                {subheading && (
                    <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                        {subheading}
                    </p>
                )}
            </div>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">{leftActions}</div>
                <div className="flex items-center gap-2">{rightActions}</div>
            </div>
        </div>
    );
};

export default PageHeading;
