import React from 'react'

const Alert = ({ msg, setStatus }) => {
    return (
        <div className='h-screen w-screen backdrop-blur-2xl fixed top-0 right-0 flex justify-center items-center'>


            <div className="h-20 w-20 rounded-lg bg-white shadow-lg border-2 border-slate-300">

                <h1>{msg}</h1>
                <div className="flex gap-5 ">
                    <button>CANCEL</button>
                    <button>OK</button>
                </div>
            </div>

        </div>
    )
}

export default Alert