import React from 'react'

const ScreenTabButton = ({ lucideIcon: Icon, iconSize = 18, text }) => {
    return (
        <div
            className=" group w-max  hover:bg-[#0e8dc7] transition-colors duration-100 flex items-center gap-3 bg-white border-2 border-slate-200 shadow-sm cursor-pointer text-zinc-700 p-2.5 px-6 rounded-xl font-semibold"
        >
            <Icon
                size={iconSize}
                className="text-cyan-600 group-hover:text-white" />
            <p className='text-sm group-hover:text-white'>{text}</p>
        </div>
    )
}

export default ScreenTabButton