import React from 'react'

const EmptyState = ({ message = 'Nothing here yet' }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
            {/* DB / folder icon made with pure CSS shapes */}
            <div className="flex flex-col items-center gap-1 opacity-40">
                <div className="w-12 h-3 rounded-full" style={{ background: '#0891b2' }} />
                <div className="w-12 h-8 rounded-b-xl border-x-2 border-b-2 flex items-center justify-center"
                    style={{ borderColor: '#0891b2' }}>
                    <div className="w-6 h-0.5 rounded" style={{ background: '#0891b2' }} />
                </div>
                <div className="w-12 h-3 rounded-full mt-0.5" style={{ background: '#0891b2' }} />
                <div className="w-12 h-8 rounded-b-xl border-x-2 border-b-2 flex items-center justify-center"
                    style={{ borderColor: '#0891b2' }}>
                    <div className="w-6 h-0.5 rounded" style={{ background: '#0891b2' }} />
                </div>
            </div>
            <p className="text-sm font-medium" style={{ color: '#0e7490', opacity: 0.6 }}>
                {message}
            </p>
        </div>
    )
}

export default EmptyState