import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PaymentCreationOfQarzaWithoutAccount from '../components/PaymentCreationOfQarzaWithoutAccount'
import { Clock, DollarSign, Edit2, Home, NotebookTabs, PlusCircle, Trash2, UserCheck } from 'lucide-react'
import PaymentUpdateOfQarzaWithoutAccount from '../components/PaymentUpdateOfQarzaWithoutAccount'
import { useSelector } from 'react-redux'
import { useSettings } from "../../settings/hooks/useSettings.js"
import { getQarzaLabels } from "../labels/qarzaLabels.js"
import ScreenTabButton from '../../../shared/components/ScreenTabButton.jsx'
import api from "../../../shared/services/api.js"
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js"

const QarzaWithoutAccount = () => {

    let navigate = useNavigate()
    let qarzawithoutAccountContainerRef = useRef()
    const { settings } = useSettings()
    const language = settings?.language || "en"
    const labels = getQarzaLabels(language)
    let loggedInUserData = useSelector(state => state.user.loggedInUserData)
    let userPermissions = new Set(loggedInUserData?.permissions || [])
    let [mode, setMode] = useState(false)
    let [data, setData] = useState([])
    let [paymentCreationVisibility, setPaymentCreationVisibility] = useState(false)
    let [paymentUpdateVisibility, setPaymentUpdateVisibility] = useState(false)
    let [currentToUpdatePaymentData, setCurrentToUpdatePaymentData] = useState(null)
    let [qarzaWithoutAccSearch, setQarzaWithoutAccSearch] = useState("")









    useEffect(() => {
        if (!userPermissions?.has("qarza-without-account-view") && !loggedInUserData?.role == "admin") {
            navigate("/qarzaAccount")
        }
    }, [loggedInUserData])




    useEffect(() => {
        (async function () {
            try {
                let res = await api.get(`/qarzaRoutes/getQarzaPaymentsWithoutAccount`)
                if (res.data.success) {
                    setData(res.data.allPayments)
                }
            } catch (error) {
                showError(error?.response?.data?.message || error?.message || "Failed to fetch payments")
            }
        })()
    }, [])














    async function deleteQarzaAccountBtnClick(paymentId) {
        if (!window.confirm(labels.deletePaymentConfirm)) return;
        try {
            let res = await api.delete(`/qarzaRoutes/deletePaymentWihtoutAccount`, { data: { paymentId } })
            setData(res.data.allPayments)
            showSuccess(labels.paymentDeleted)
        } catch (error) {
            showError(error?.response?.data?.message || error?.message || labels.failedToDeletePayment)
        }
    }









    return (
        <div className='h-full  overflow-hidden relative flex   '>

            {/* NAVBAR */}
            {/* <Navbar /> */}



            {
                paymentCreationVisibility
                &&
                <PaymentCreationOfQarzaWithoutAccount setVisible={setPaymentCreationVisibility} setData={setData} />
            }
            {
                paymentUpdateVisibility
                &&
                <PaymentUpdateOfQarzaWithoutAccount currentToUpdateData={currentToUpdatePaymentData} setVisible={setPaymentUpdateVisibility} setData={setData} />
            }



            {/* MAIN CONTAINER */}
            <div
                ref={qarzawithoutAccountContainerRef}
                onWheel={(e) => {
                    qarzawithoutAccountContainerRef.current.scrollTop += e.deltaY;
                }}
                className="h-screen overflow-y-scroll flex-1 p-10 font-sans"
            >

                {/* Header Section */}
                <div className="mb-10">
                    <h1 className="w-max bg-gradient-to-r from-cyan-600 to-blue-800 bg-clip-text text-4xl font-bold text-transparent">
                        {labels.directQarza}
                    </h1>
                    <p className="text-slate-500 text-lg font-medium">
                        {labels.allDirectQarzaPresent}
                    </p>
                </div>





                {/* <div className="flex items-center">
                        {
                            (userPermissions?.has("qarza-without-account-create") || loggedInUserData?.role === "admin") &&
                            (
                                <div
                                    onClick={() => { setPaymentCreationVisibility(true) }}
                                    className="w-max h-max flex gap-2 bg-[#1c6f48] text-zinc-100 p-2 px-5 rounded-lg font-bold justify-center items-center cursor-pointer"
                                >
                                    <i className="ri-add-line text-sm"></i>
                                    <p>Add</p>
                                </div>
                            )
                        }

                    </div> */}






                <div className="flex items-center gap-5 px-2">


                    {
                        (userPermissions?.has("qarza-without-account-create") || loggedInUserData?.role === "admin") &&
                        (
                            <div
                                onClick={() => { setPaymentCreationVisibility(true) }}
                            >
                                <ScreenTabButton text={labels.add} lucideIcon={PlusCircle} />
                            </div>
                        )
                    }

                    <div className="w-max  px-5 h-11  hover:bg-[#0e8dc7] transition-colors duration-100 flex items-center gap-3 bg-white border-2 border-slate-200 shadow-sm cursor-pointer text-zinc-700  rounded-xl font-semibold text-sm focus:outline-none focus:ring-0 hover:text-white "
                    >
                        <select
                            className='h-full w-30 outline-none'
                            onChange={(e) => {
                                if (e.target.value == "directQarza") {
                                    navigate("/qarzaWithoutAccount")
                                } else if (e.target.value == "accountQarza") {
                                    navigate("/qarzaAccount")
                                }
                            }}
                        >

                            <option className='bg-white text-black ' value="directQarza">{labels.directQarzaNav}</option>
                            <option className='bg-white text-black' value="accountQarza">{labels.accountQarza}</option>
                        </select>
                    </div>



                    {/* {
                        (userPermissions?.has("qarza-without-account-view") || loggedInUserData?.role === "admin") &&
                        (
                            <button onClick={() => { navigate("/qarzaWithoutAccount") }}
                            >
                                <ScreenTabButton text={"Direct Qarza"} lucideIcon={DollarSign} />
                            </button>
                        )
                    }
                    {
                        (userPermissions?.has("qarza-with-account-view") || loggedInUserData?.role === "admin") &&
                        (
                            <button 
                            onClick={() => { navigate("/qarzaAccount") }} 
>
                                    <ScreenTabButton text={"Account Qarza"} lucideIcon={UserCheck} />
                                </button>
                        )
                    } */}
                    <input
                        type="text"
                        name="qarzaWithoutAccSearch"
                        className=" group flex-1 hover:shadow-lg transition-shadow duration-150   transition-colors duration-100 flex items-center gap-3 bg-white border-2 border-slate-200 shadow-sm cursor-pointer text-zinc-700 p-2.5 px-6 rounded-xl font-semibold"
                        placeholder={labels.searchQarzaPayments}
                        value={qarzaWithoutAccSearch}
                        onChange={(e) => { setQarzaWithoutAccSearch(e.target.value) }}
                    />

                </div>










                {
                    (userPermissions?.has("qarza-without-account-view") || loggedInUserData?.role === "admin") &&
                    (
                        <div className="h-max w-full overflow-x-hidden flex flex-wrap gap-10 p-10 pt-10  justify-center">
                            {
                                data?.length < 1
                                    ?

                                    <div className='text-gray-600 h-[50vh] w-full flex justify-center items-center'>{labels.noQarzaPaymentsFound}</div>

                                    :
                                    data?.map((item, index) => {
                                        if (qarzaWithoutAccSearch == "" || item?.name?.toLowerCase()?.includes(qarzaWithoutAccSearch?.toLowerCase())) {



                                            return (
                                                <div
                                                    key={index}
                                                    className="group p-7 border-2 border-slate-200 relative w-[310px] bg-white rounded-[1.8rem]   transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(14,141,199,0.2)] hover:border-blue-200 overflow-hidden"
                                                >
                                                    {/* SUBTLE BACKGROUND ANIMATION */}
                                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full blur-3xl group-hover:bg-[#0e8dc7]/10 transition-colors duration-500" />

                                                    {/* HEADER: NAME & BADGE */}
                                                    <div className="flex justify-between items-center mb-4 relative z-10">
                                                        <h2 className="text-base font-extrabold text-slate-800 tracking-tight truncate w-[60%] group-hover:text-[#0e8dc7] transition-colors">
                                                            {item.name}
                                                        </h2>
                                                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border transition-all ${item.type === "cashin"
                                                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white"
                                                            : "bg-blue-50 text-[#0e8dc7] border-blue-100 group-hover:bg-[#0e8dc7] group-hover:text-white"
                                                            }`}>
                                                            {item.type}
                                                        </span>
                                                    </div>

                                                    {/* MAIN AMOUNT: BOLD & CLEAN */}
                                                    <div className="mb-4  bg-slate-50 rounded-[1.2rem] p-3 border border-slate-200 group-hover:border-blue-50 transition-all">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">{labels.balance}</p>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-xs font-bold text-[#0e8dc7]">Rs</span>
                                                            <span className="text-2xl font-black text-slate-800 tracking-tighter">
                                                                {item.amount.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* COMPACT INFO GRID */}
                                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                                        <div className="flex items-center gap-2 px-2 py-1.5 bg-white rounded-xl border border-slate-100 group-hover:border-blue-100 transition-all">
                                                            <Clock className="w-3 h-3 text-[#0e8dc7]" />
                                                            <span className="text-[10px] font-bold text-slate-600">
                                                                {new Date(item.date).toLocaleDateString('en-GB')}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 px-2 py-1.5 bg-white rounded-xl border border-slate-100 group-hover:border-blue-100 transition-all">
                                                            <Home className="w-3 h-3 text-[#0e8dc7]" />
                                                            <span className="text-[10px] font-bold text-slate-600 truncate">{item.address}</span>
                                                        </div>
                                                    </div>

                                                    {/* NOTES: TRUNCATED & CLEAN */}
                                                    {item.notes && (
                                                        <div className="px-2 mb-5">
                                                            <p className="text-[10px] text-slate-400 italic leading-relaxed line-clamp-1 border-l-2 border-slate-200 pl-2 group-hover:border-[#0e8dc7] transition-all">
                                                                "{item.notes}"
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* ACTIONS: FULL WIDTH COMPACT */}
                                                    <div className="flex gap-2">
                                                        {(userPermissions?.has("qarza-without-account-edit") || loggedInUserData?.role === "admin") && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setCurrentToUpdatePaymentData(item); setPaymentUpdateVisibility(true); }}
                                                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-linear-to-r from-[#0e8dc7] to-[#109fe1] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:shadow-blue-200 hover:scale-[1.03] active:scale-95 transition-all"
                                                            >
                                                                <Edit2 className="w-3 h-3" />
                                                                {labels.edit}
                                                            </button>
                                                        )}

                                                        {(userPermissions?.has("qarza-without-account-delete") || loggedInUserData?.role === "admin") && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); deleteQarzaAccountBtnClick(item._id); }}
                                                                className="w-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )



                                        }
                                    })
                            }

                        </div>

                    )
                }




            </div>



        </div>
    )
}

export default QarzaWithoutAccount
