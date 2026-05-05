import React, { useEffect, useRef, useState } from "react";
import { CirclePlus, Delete, Edit, Edit2, Plus, Trash, Trash2 } from "lucide-react";
import QarzaPaymentCreationForm from "../parts/QarzaPaymentCreationForm";
import { useNavigate, useParams } from "react-router-dom";

import QarzaPaymentEditForm from "../parts/QarzaPaymentEditForm";
import { useSelector } from "react-redux";
import ScreenTabButton from "../../../common/components/ScreenTabButton.jsx";
import api from "../../../services/axiosInstance.js";
import ConfirmDialog from "../../../common/components/ConfirmationDialog.jsx";

export default function EachQarzaAccountRecords() {
  let param = useParams()
  let Navigate = useNavigate()
  let loggedInUserData = useSelector(state => state.user.loggedInUserData)
  let userPermissions = new Set(loggedInUserData?.permissions || [])
  let qarzaPaymentContainerRef = useRef()
  let [qarzaPaymentCreationVisibility, setQarzaPaymentCreationVisibility] = useState(false)
  let [qarzaPaymentEditVisibility, setQarzaPaymentEditVisibility] = useState(false)
  let [qarzaPaymentData, setQarzaPaymentData] = useState([])
  let [currentToUpdatePaymentData, setCurrentToUpdatePaymentData] = useState(null)
  let [qarzaAccountEditVisibility, setQarzaAccountEditVisibility] = useState(false)
  let [paymentSummary, setPaymentSummary] = useState({ totalCashIn: 0, totalCashOut: 0, netBalance: 0 })



  function calculateSummary(payments) {
    return payments.reduce((acc, item) => {
      if (item.type === "cashin") {
        acc.totalCashIn += item.amount
      } else {
        acc.totalCashOut += item.amount
      }
      acc.netBalance = acc.totalCashIn - acc.totalCashOut
      return acc
    }, { totalCashIn: 0, totalCashOut: 0, netBalance: 0 })
  }




  async function getAccountPaymentAndSummary() {
    const date = new Date();
    const start = new Date(date.setHours(0, 0, 0, 0));
    const end = new Date(date.setHours(23, 59, 59, 999));



    let res = await api.post(`/qarzaRoutes/getQarzaAccountRelatedPayments`, {
      qarzaAccountId: param.id,
      startDate: start,
      endDate: end
    })
    if (res.data.success) {
      setQarzaPaymentData(res.data.data)
      setPaymentSummary(calculateSummary(res.data.data)) // ADD THIS
    }
  }


  useEffect(() => {
    getAccountPaymentAndSummary()
  }, [])









  async function deletePayment(paymentId) {
    try {
      let res = await api.delete(`qarzaRoutes/deleteQarzaPayment`, { data: { paymentId, qarzaAccountId: param.id } })
      if (res.data.success) {
        setQarzaPaymentData(res.data.data)
      }
    } catch (error) {
      console.error(error?.message, error?.stack)
    }
  }
















  async function deleteQarzaAccountBtnClick() {
    try {


      let res = await api.delete(`/qarzaRoutes/qarzaAccountDelete`, { data: { _id: param.id } })
      if (res.data.success) {
        Navigate("/qarzaAccount")
      }
    } catch (error) {
      console.error(error?.message)
    }
  }





  return (
    <div className='h-full  overflow-hidden relative flex   '>







      {/* <Navbar /> */}





      {
        qarzaPaymentCreationVisibility
        &&
        <QarzaPaymentCreationForm getAccountPaymentAndSummary={getAccountPaymentAndSummary} qarzaAccountId={param?.id} setVisibility={setQarzaPaymentCreationVisibility} setQarzaPaymentData={setQarzaPaymentData} />
      }

      {
        qarzaPaymentEditVisibility
        &&
        <QarzaPaymentEditForm getAccountPaymentAndSummary={getAccountPaymentAndSummary} currentToUpdateData={currentToUpdatePaymentData} setVisibility={setQarzaPaymentEditVisibility} setQarzaPaymentData={setQarzaPaymentData} />
      }




      {/* MAIN CONTAINER */}
      <div
        ref={qarzaPaymentContainerRef}
        onWheel={(e) => {
          qarzaPaymentContainerRef.current.scrollTop += e.deltaY;
        }}
        className="h-screen overflow-y-scroll flex-1 p-10 pl-5 font-sans">








        {/* Header */}
        {/* <div className="px-5 w-full border-b-2 border-zinc-200 flex justify-between">
          <h1 className="font-bold text-4xl text-zinc-700 p-5">
            Qarza Payment
          </h1>


          <div className="flex items-center">
            {
              (userPermissions?.has("qarza-with-account-payment-create") || loggedInUserData?.role === "admin") &&
              (
                <div
                  onClick={() => { setQarzaPaymentCreationVisibility(true) }}
                  className="w-max h-max flex gap-2 bg-[#1c6f48] text-zinc-100 p-2 px-5 rounded-lg font-bold justify-center items-center cursor-pointer"
                >
                  <i className="ri-add-line text-sm"></i>
                  <p>Add</p>
                </div>
              )
            }

          </div>

        </div> */}


        {/* Header Section */}
        <div className="mb-10">
          <h1 className="w-max bg-gradient-to-r from-cyan-600 to-blue-800 bg-clip-text text-4xl font-bold text-transparent">
            Qarza Account Payments
          </h1>
          <p className="text-slate-500 text-lg font-medium">
            All direct qarza payments is present here.
          </p>
        </div>




        <div className="flex items-center gap-5  pr-2  ">


          {
            (userPermissions?.has("qarza-with-account-payment-create") || loggedInUserData?.role === "admin") &&
            (
              <div
                onClick={() => { setQarzaPaymentCreationVisibility(true) }}
              >
                <ScreenTabButton text={"Add Payment"} lucideIcon={CirclePlus} />
              </div>
            )
          }


        </div>


        <div className="grid grid-cols-3 gap-4 mt-6">
          {/* Total Cash In */}
          <div className="relative overflow-hidden bg-white/80 backdrop-blur-md border border-emerald-100 rounded-2xl p-5 shadow-sm hover:shadow-emerald-200/40 hover:shadow-lg transition-all duration-300">
            <div className="absolute -top-3 -right-3 h-16 w-16 rounded-full bg-emerald-100 opacity-60" />
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-emerald-500 text-white shadow-inner">
                <i className="ri-arrow-left-down-line text-sm" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cash In</span>
            </div>
            <p className="text-2xl font-black text-slate-800 tracking-tight">
              {paymentSummary.totalCashIn.toLocaleString()}
              <span className="text-xs font-bold text-slate-400 ml-1">PKR</span>
            </p>
          </div>

          {/* Total Cash Out */}
          <div className="relative overflow-hidden bg-white/80 backdrop-blur-md border border-rose-100 rounded-2xl p-5 shadow-sm hover:shadow-rose-200/40 hover:shadow-lg transition-all duration-300">
            <div className="absolute -top-3 -right-3 h-16 w-16 rounded-full bg-rose-100 opacity-60" />
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-rose-500 text-white shadow-inner">
                <i className="ri-arrow-right-up-line text-sm" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cash Out</span>
            </div>
            <p className="text-2xl font-black text-slate-800 tracking-tight">
              {paymentSummary.totalCashOut.toLocaleString()}
              <span className="text-xs font-bold text-slate-400 ml-1">PKR</span>
            </p>
          </div>

          {/* Net Balance */}
          <div className={`relative overflow-hidden bg-white/80 backdrop-blur-md border rounded-2xl p-5 shadow-sm transition-all duration-300
        ${paymentSummary.netBalance >= 0 ? "border-blue-100 hover:shadow-blue-200/40" : "border-rose-100 hover:shadow-rose-200/40"} hover:shadow-lg`}>
            <div className={`absolute -top-3 -right-3 h-16 w-16 rounded-full opacity-60 ${paymentSummary.netBalance >= 0 ? "bg-blue-100" : "bg-rose-100"}`} />
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-8 w-8 flex items-center justify-center rounded-xl text-white shadow-inner ${paymentSummary.netBalance >= 0 ? "bg-blue-500" : "bg-rose-500"}`}>
                <i className="ri-scales-line text-sm" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Net Balance</span>
            </div>
            <p className={`text-2xl font-black tracking-tight ${paymentSummary.netBalance >= 0 ? "text-blue-600" : "text-rose-600"}`}>
              {paymentSummary.netBalance.toLocaleString()}
              <span className="text-xs font-bold text-slate-400 ml-1">PKR</span>
            </p>
          </div>
        </div>




        {
          (userPermissions?.has("qarza-with-account-payment-view") || loggedInUserData?.role === "admin") &&
          (
            <div className="flex flex-col gap-2 mt-5">
              {qarzaPaymentData?.length > 0
                &&
                qarzaPaymentData?.map((item, index) => (
                  <div
                    key={index}
                    className="group relative flex items-center justify-between p-4 mb-3 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-200/30 hover:-translate-y-1 transition-all duration-500 cursor-default overflow-hidden"
                  >
                    {/* 1. Animated Type Indicator Ring */}
                    <div className="relative flex items-center justify-center h-12 w-12 shrink-0">
                      <div className={`absolute inset-0 rounded-full opacity-20 animate-pulse ${item.type === "cashin" ? "bg-emerald-400" : "bg-rose-400"}`} />
                      <div className={`z-10 flex h-9 w-9 items-center justify-center rounded-full shadow-inner ${item.type === "cashin" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
                        {item.type === "cashin" ? <i className="ri-arrow-left-down-line text-lg" /> : <i className="ri-arrow-right-up-line text-lg" />}
                      </div>
                    </div>

                    {/* 2. Transaction Details Section */}
                    <div className="flex-1 px-4 min-w-0">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-slate-800 tracking-tight">
                          {item.amount.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PKR</span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <div className={`h-1.5 w-1.5 rounded-full ${item.type === "cashin" ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <p className="text-[11px] font-medium text-slate-500 truncate italic max-w-[150px] sm:max-w-xs">
                          {item.notes || "Official Transaction"}
                        </p>
                      </div>
                    </div>

                    {/* 3. Dynamic Date Stamp */}
                    <div className="hidden md:flex flex-col items-end px-4">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <i className="ri-calendar-event-line text-xs" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Recorded</span>
                      </div>
                      <span className="text-xs font-bold text-slate-600">
                        {new Date(item.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                      </span>
                    </div>

                    {/* 4. Glass Action Buttons */}
                    <div className="flex items-center gap-2 pl-4 border-l border-slate-50">
                      {(userPermissions?.has("qarza-with-account-payment-edit") || loggedInUserData?.role === "admin") && (
                        <button
                          onClick={() => { setCurrentToUpdatePaymentData(item); setQarzaPaymentEditVisibility(true) }}
                          className="group/btn h-9 w-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-[#0e8dc7] hover:text-white hover:rotate-[360deg] transition-all duration-500"
                        >
                          <Edit className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                        </button>
                      )}

                      {(userPermissions?.has("qarza-with-account-payment-delete") || loggedInUserData?.role === "admin") && (
                        <ConfirmDialog onConfirm={() => { deletePayment(item?._id) }} message="Are you want to delete payment?">
                          <button
                            className="group/btn h-9 w-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white hover:scale-110 transition-all duration-300"
                          >
                            <Delete className="w-4 h-4 transition-transform group-active/btn:rotate-12" />
                          </button>
                        </ConfirmDialog>
                      )}
                    </div>

                    {/* 5. The "Wonderful" Background Sparkle */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                      <div className="absolute -left-full group-hover:left-full top-0 w-1/2 h-full bg-linear-to-r from-transparent via-white/40 to-transparent transition-all duration-1000 skew-x-12" />
                    </div>
                  </div>
                ))
              }
            </div>
          )
        }




        {/* <div className="absolute right-1/2 bottom-6 flex gap-6 translate-x-1/2 
  backdrop-blur-xl bg-white/70 border border-zinc-200 
  rounded-2xl shadow-lg p-4 px-10">

          <button className="flex items-center gap-2 rounded-xl 
    bg-gradient-to-br from-green-500 to-green-600 
    text-white font-semibold py-2 px-6 
    shadow-[0_4px_12px_rgba(0,0,0,0.15)] 
    hover:scale-105 transition-all duration-200">
            <span>Edit Profile</span>
            <Edit2 className="w-4" />
          </button>

          <button
            onClick={() => {
              deleteQarzaAccountBtnClick()
            }}
            className="flex items-center gap-2 rounded-xl 
    bg-gradient-to-br from-red-500 to-red-600 
    text-white font-semibold py-2 px-6 
    shadow-[0_4px_12px_rgba(0,0,0,0.15)] 
    hover:scale-105 transition-all duration-200">
            <span>Delete Profile</span>
            <Trash2 className="w-4" />
          </button>

        </div> */}

      </div>
    </div>
  );
}
