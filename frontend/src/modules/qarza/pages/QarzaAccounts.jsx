import React, { useEffect, useRef, useState } from 'react'
import QarzaCreation from '../parts/QarzaCreation'
import { useNavigate } from 'react-router-dom'
import { CirclePlus, Edit2, Trash2 } from 'lucide-react'
import QarzaAccountEdit from '../parts/QarzaAccountEdit'
import { useSelector } from 'react-redux'
import ScreenTabButton from '../../../common/components/ScreenTabButton.jsx'
import api from '../../../services/axiosInstance.js'
import { PermissionGuard } from '../../../common/components/PermissionGaurd.jsx'
import emptyImage from "../../../assets/images/boy-user.jpg"
import ConfirmDialog from '../../../common/components/ConfirmationDialog.jsx'
import { backendBaseUrl } from '../../../common/constants/constants.js'

const QarzaAccounts = () => {
  let navigate = useNavigate()
  let qarzaContainerRef = useRef()
  let [qarzaCreationVisibility, setQarzaCreationVisibility] = useState(false)
  let [qarzaAccountEditVisiblity, setQarzaAccountEditVisibility] = useState(false)
  let [allQarzaAccounts, setAllQarzaAccount] = useState([])
  let [currentToUpdateAccount, setCurrentToUpadateAccount] = useState(null)
  let [qarzaAccSearch, setQarzaAccSearch] = useState("")













  async function getqarzaAccounts() {
    let res = await api.get(`/qarzaRoutes/getqarzaAccount`)

    if (res.data.success) {
      setAllQarzaAccount(res.data.accounts)
    }
  }


  useEffect(() => {
    try {
      getqarzaAccounts()
    } catch (error) {
      console.error(error)
    }
  }, [])















  async function deleteQarzaAccountBtnClick(accid) {
    try {


      let res = await api.delete(`/qarzaRoutes/qarzaAccountDelete`, { data: { _id: accid } })
      if (res.data.success) {
        setAllQarzaAccount(res.data.accounts)
      }
    } catch (error) {
      console.error(error?.message)
    }
  }













  return (
    <div className='h-full  overflow-hidden relative flex   '>

      {/* NAVBAR */}
      {/* <Navbar /> */}




      {
        qarzaCreationVisibility
        &&
        <QarzaCreation getqarzaAccounts={getqarzaAccounts} setVisibility={setQarzaCreationVisibility} setQarzaAccounts={setAllQarzaAccount} />
      }


      {
        qarzaAccountEditVisiblity
        &&
        <QarzaAccountEdit getqarzaAccounts={getqarzaAccounts} currentToUpdateAccount={currentToUpdateAccount} setVisibility={setQarzaAccountEditVisibility} setQarzaAccounts={setAllQarzaAccount} />
      }









      {/* <QarzaPaymentCreationForm/> */}


      {/* MAIN CONTAINER */}
      <div
        ref={qarzaContainerRef}
        onWheel={(e) => {
          qarzaContainerRef.current.scrollTop += e.deltaY;
        }}
        className="h-screen overflow-y-scroll flex-1 p-10 pl-5 font-sans">


        {/* Header */}
        <div className="px-5 w-full  flex justify-between">

          {/* Header Section */}
          <div className="mb-10">
            <h1 className="w-max bg-gradient-to-r from-cyan-600 to-blue-800 bg-clip-text text-4xl font-bold text-transparent">
              Qarza Account
            </h1>
            <p className="text-slate-500 text-lg font-medium">
              All Qarza Account is present here.
            </p>
          </div>



          {/* <div className="flex items-center">
            {
              (userPermissions?.has("qarza-with-account-create") || loggedInUserData?.role === "admin") &&
              (
                <div
                  onClick={() => { setQarzaCreationVisibility(true) }}
                  className="w-max h-max flex gap-2 bg-[#1c6f48] text-zinc-100 p-2 px-5 rounded-lg font-bold justify-center items-center cursor-pointer"
                >
                  <i className="ri-add-line text-sm"></i>
                  <p>Add</p>
                </div>
              )
            }

          </div> */}

        </div>







        <div className="flex items-center gap-5 px-7 pr-2  ">

          <PermissionGuard permission={"qarza-with-account-create"}>
            <div
              onClick={() => { setQarzaCreationVisibility(true) }}
            >
              <ScreenTabButton text={"Add Qarza Account"} lucideIcon={CirclePlus} />
            </div>
          </PermissionGuard>



          {/* <div className="w-max  px-5 h-11  hover:bg-[#0e8dc7] transition-colors duration-100 flex items-center gap-3 bg-white border-2 border-slate-200 shadow-sm cursor-pointer text-zinc-700  rounded-xl font-semibold text-sm focus:outline-none focus:ring-0 hover:text-white "
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

              <option className='bg-white text-black' value="accountQarza">Account Qarza</option>
              <option className='bg-white text-black ' value="directQarza">Direct Qarza</option>
            </select>
          </div> */}





          <input
            type="text"
            name="qarzaAccSearc"
            className=" group flex-1 hover:shadow-lg transition-shadow duration-150   transition-colors duration-100 flex items-center gap-3 bg-white border-2 border-slate-200 shadow-sm cursor-pointer text-zinc-700 p-2.5 px-6 rounded-xl font-semibold"
            placeholder='Search Qarza Profile.... '
            value={qarzaAccSearch}
            onChange={(e) => { setQarzaAccSearch(e.target.value) }}
          />
        </div>






        <PermissionGuard permission={"qarza-with-account-view"}>
          <div className="h-max w-full overflow-x-hidden flex flex-wrap gap-5 mt-10  p-5 justify-center">
            {

              allQarzaAccounts?.length < 1
                ?
                <div className='text-gray-600 h-[50vh] w-full flex justify-center items-center'>Qarza Accounts are not found.</div>

                :
                allQarzaAccounts?.map((acc) => {

                  if (acc?.name?.toLowerCase().includes(qarzaAccSearch?.toLowerCase()) || qarzaAccSearch == "") {




                    const shortLetter = acc?.name?.charAt(0)?.toUpperCase();
                    const createdDate = acc?.createdAt ? new Date(acc.createdAt).toLocaleDateString() : "";
                    let finalPaymentAmount = 0;
                    if (acc.payments?.length > 0) {
                      for (let payment of acc.payments) {
                        if (payment.type == "cashin") {
                          finalPaymentAmount += payment.amount
                        } else {
                          finalPaymentAmount -= payment.amount
                        }
                      }
                    }

                    return (
                      <div
                        key={acc._id}
                        onClick={() => { navigate(`/qarzaAccountPayments/${acc._id}`) }}
                        className="group relative flex flex-col w-full sm:w-[320px] bg-white rounded-[1.5rem] shadow-sm hover:shadow-xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer overflow-hidden border border-slate-100 active:scale-95"
                      >
                        {/* Header Section */}
                        <div className="relative h-20 flex items-center gap-4 px-5 w-full bg-gradient-to-r from-[#0e8dc7] via-[#1aa2e6] to-[#109fe1]">
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                          {/* Initial Letter Box */}
                          <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-white p-1 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
                            <div className="h-full w-full rounded-xl bg-gradient-to-br from-[#0e8dc7] to-[#109fe1] flex items-center justify-center text-white text-xl font-black uppercase">
                              {shortLetter}
                            </div>
                          </div>

                          {/* Identity Section */}
                          <div className="flex flex-col min-w-0 flex-1">
                            <h3 className="text-lg font-black text-white leading-tight uppercase truncate">
                              {acc?.name}
                            </h3>
                            <div className="flex">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/90 px-2 py-0.5 rounded-md mt-1">
                                {acc?.type}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Profile Body */}
                        <div className="flex flex-col p-4 flex-1">

                          {/* Upper Content: Text & Image Row */}
                          <div className="flex items-start justify-between gap-3 mb-4">

                            {/* Left side: Contact Details */}
                            <div className="flex-1 flex flex-col gap-2 pt-1">
                              {acc.phoneNo && (
                                <div className="">
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <i className="ri-phone-fill text-[#1aa2e6]"></i>
                                    <span className="text-xs font-bold">Phone Number</span>
                                  </div>
                                  <span className='text-xs ml-8 font-bold text-gray-400'>{acc.phoneNo}</span>
                                </div>
                              )}
                              {acc.address && (
                                <div className="">
                                  <div className="flex items-start gap-2 text-slate-500">
                                    <i className="ri-map-pin-2-fill text-[#1aa2e6] mt-0.5"></i>
                                    <span className="text-xs font-medium italic line-clamp-2 leading-relaxed">
                                      Address
                                    </span>
                                  </div>
                                  <span className='text-xs ml-8 font-bold text-gray-400'>{acc.address}</span>

                                </div>
                              )}

                              {/* Amount Badge (Placed under contact info for better flow) */}
                              {finalPaymentAmount !== 0 && (
                                <div className={`mt-2 self-start flex flex-col px-3 py-1 rounded-xl border shadow-sm ${finalPaymentAmount > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                                  <span className={`text-[8px] font-black uppercase tracking-tighter ${finalPaymentAmount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {finalPaymentAmount > 0 ? 'To Give' : 'To Receive'}
                                  </span>
                                  <span className={`text-sm font-black ${finalPaymentAmount > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {Math.abs(finalPaymentAmount).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Right side: Profile Image */}
                            <div className="flex-shrink-0 h-24 w-24 bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-50 shadow-inner">
                              <img
                                src={acc?.qarzaProfileImage ? `${backendBaseUrl}/uploads/${acc.qarzaProfileImage}` : emptyImage}
                                className="w-full h-full object-cover"
                                alt={acc?.name}
                              />
                            </div>
                          </div>

                          {/* Footer Actions (Pushed to bottom) */}
                          <div className="mt-auto flex gap-2 pt-3 border-t border-slate-50">
                            <PermissionGuard permission={"qarza-with-account-update"}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentToUpadateAccount(acc);
                                  setQarzaAccountEditVisibility(true);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 text-slate-600 font-bold text-[11px] uppercase tracking-wider hover:bg-[#0e8dc7] hover:text-white transition-all duration-300"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Edit
                              </button>
                            </PermissionGuard>

                            <PermissionGuard permission={"qarza-with-account-delete"}>
                              <ConfirmDialog
                                message='Are you want to delete the Qarza Account?'
                                onConfirm={() => {
                                  e.stopPropagation();
                                  deleteQarzaAccountBtnClick(acc._id);
                                }}>
                                <button
                                  className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </ConfirmDialog>
                            </PermissionGuard>
                          </div>
                        </div>
                      </div>
                    );
                  }

                })
            }


          </div>
        </PermissionGuard>















      </div>

    </div>
  )
}

export default QarzaAccounts
