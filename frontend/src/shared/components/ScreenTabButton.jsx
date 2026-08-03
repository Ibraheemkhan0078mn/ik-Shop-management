import React from 'react'

const ScreenTabButton = ({ lucideIcon: Icon, iconSize = 18, text }) => {
    return (
        <div className="group w-max flex items-center gap-3 cursor-pointer select-none px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] shadow-sm hover:text-white hover:bg-[var(--accent-2)] hover:border-[var(--accent-2)] hover:shadow-md hover:-translate-y-px">
            <Icon size={iconSize} className="text-[var(--accent-2)] group-hover:text-white transition-colors duration-200" />
            <p className='group-hover:text-white'>{text}</p>
        </div>
    )
}

export default ScreenTabButton