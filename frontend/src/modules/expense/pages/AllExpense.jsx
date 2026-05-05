






import React, { useEffect, useRef, useState } from "react";
import ExpenseCreation from "../parts/expenseCreations.jsx";
import ExpenseUpdate from "../parts/ExpenseUpdate.jsx";
import { CassetteTape, PlusCircle, Search } from "lucide-react";
import EachExpenseInCardView from "../parts/EachExpenseInCardView.jsx";
import EachExpenseInTableView from "../parts/EachExpenseInTableView.jsx";
import ExpenseCatags from "../parts/ExpenseCatags.jsx";
import ExpenseCatagCreation from "../parts/ExpenseCatagCreation.jsx";
import ScreenTabButton from "../../../common/components/ScreenTabButton.jsx";
import api from "../../../services/axiosInstance.js";
import { PermissionGuard } from '../../../common/components/PermissionGaurd.jsx'
import { useHotkeys } from "react-hotkeys-hook";

export default function AllExpenses() {
    const AdminExpensePageRef = useRef();
    let expenseCardsView = localStorage.getItem("expenseView") || "table";
    let [expenseCreationVisiblity, setExpenseCreationVisibility] = useState(false);
    let [expensesData, setExpensesData] = useState([]);
    let [currentToUpdateExpenseData, setCurrentToUpdateExpenseData] = useState(null);
    let [expenseUpdateVisibility, setExpenseUpdateVisibility] = useState(false);
    let [expenseCatagCreationVisibility, setExpenseCatagCreationVisibility] = useState(false);
    let [expenseCatagVisibility, setExpenseCatagVisibility] = useState(false);
    let [searchDate, setSearchDate] = useState("none"); // Default "none" for all data
    let limitExpense = 20;
    let skipExpense = useRef(0);
    let [loadingExpense, setLoadingExpense] = useState(false);
    let [hasMore, setHasMore] = useState(true);
    let [catagSearch, setCatagSearch] = useState("");

    useHotkeys("ctrl+n", () => { setExpenseCreationVisibility(true) }, { enableOnFormTags: true });

    async function getExpenses(origin) {
        try {
            // Reset scroll position on update/delete/date change
            if (origin == "update" || origin == "delete" || origin == "dateChange") {
                skipExpense.current = 0;
                setHasMore(true);
            }

            setLoadingExpense(true);

            let skipTo = (origin == "update" || origin == "delete" || origin == "dateChange") ? 0 : skipExpense.current;
            let res = await api.get(`/expenseRoutes/getExpense/${skipTo}/${limitExpense}/${searchDate}`);

            if (res.data) {
                setLoadingExpense(false);
            }

            if (res.data.success) {
                let expenses = res.data.expenses;

                if (expenses?.length > 0) {
                    // Reset data on update/delete/date change, otherwise append
                    if (origin == "update" || origin == "delete" || origin == "dateChange") {
                        setExpensesData(expenses);
                        skipExpense.current = expenses.length;
                    } else {
                        setExpensesData(prev => [...prev, ...expenses]);
                        skipExpense.current = skipExpense.current + expenses.length;
                    }

                    // Check if more data available
                    if (expenses.length < limitExpense) {
                        setHasMore(false);
                    }
                } else {
                    // No more data
                    setHasMore(false);
                    if (skipExpense.current === 0) {
                        setExpensesData([]);
                    }
                }
            }
        } catch (error) {
            setLoadingExpense(false);
            console.error(error);
        }
    }

    // Initial load
    useEffect(() => {
        getExpenses("dateChange");
    }, [searchDate]);

    function handleContainerScroll() {
        let container = AdminExpensePageRef.current;
        if (!container) return;

        let result = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;

        if (result && !loadingExpense && hasMore) {
            getExpenses();
        }
    }



    async function handleCatagSearchIconClick() {
        try {
            if (catagSearch) {
                let res = await api.post(`/expenseRoutes/getCatagBasesExpense`, { catagName: catagSearch });
                if (res.data.success) {
                    setExpensesData(res.data.expenses);
                    setHasMore(false); // Category search doesn't support pagination
                }
            }
        } catch (error) {
            console.error(error?.message);
        }
    }

    return (
        <div className='h-full overflow-hidden relative flex'>
            {/* <Navbar /> */}

            {expenseCreationVisiblity && (
                <ExpenseCreation
                    getExpensesFunc={getExpenses}
                    setVisibility={setExpenseCreationVisibility}
                    setExpensesData={setExpensesData}
                />
            )}

            {expenseUpdateVisibility && (
                <ExpenseUpdate
                    getExpensesFunc={getExpenses}
                    setVisibility={setExpenseUpdateVisibility}
                    setExpensesData={setExpensesData}
                    expenseData={currentToUpdateExpenseData}
                />
            )}

            {expenseCatagVisibility && (
                <ExpenseCatags
                    setVisibility={setExpenseCatagVisibility}
                    setExpenseCatagCreationVisibility={setExpenseCatagCreationVisibility}
                />
            )}

            {expenseCatagCreationVisibility && (
                <ExpenseCatagCreation setVisibility={setExpenseCatagCreationVisibility} />
            )}













            <div
                ref={AdminExpensePageRef}
                onWheel={(e) => {
                    AdminExpensePageRef.current.scrollTop += e.deltaY;
                }}
                onScroll={handleContainerScroll}
                className="h-screen overflow-y-scroll flex-1 p-10 font-sans"
            >
                <div className="mb-10">
                    <h1 className="w-max bg-gradient-to-r from-cyan-600 to-blue-800 bg-clip-text text-4xl font-bold text-transparent">
                        Expenses
                    </h1>
                    <p className="text-slate-500 text-lg font-medium">
                        All Expenses is present here.
                    </p>
                </div>

                <div className="flex items-center gap-5 px-2">
                    <PermissionGuard permission={"expense-create"}>
                        <div onClick={() => { setExpenseCreationVisibility(true) }}>
                            <ScreenTabButton text={"Add Expense"} lucideIcon={PlusCircle} />
                        </div>
                    </PermissionGuard>

                    <PermissionGuard permission={"expense-category-view"}>
                        <div onClick={() => { setExpenseCatagVisibility(true) }}>
                            <ScreenTabButton text={"Categories"} lucideIcon={CassetteTape} />
                        </div>
                    </PermissionGuard>

                    <PermissionGuard permission={"expense-search-previous"}>
                        <div className="group w-max  transition-colors duration-100 flex items-center gap-3 bg-white border-2 border-slate-200 shadow-sm cursor-pointer text-zinc-700 p-2.5 px-6 rounded-xl font-semibold">
                            <input
                                value={catagSearch}
                                type="text"
                                className="focus:ring-0  cursor-pointer outline-0 border-0"
                                placeholder="Search on Category..."
                                onChange={(e) => { setCatagSearch(e.target.value); handleCatagSearchIconClick() }}
                            />
                            <Search
                                onClick={handleCatagSearchIconClick}
                                className="text-cyan-600 "
                            />
                        </div>
                    </PermissionGuard>

                    <PermissionGuard permission={"expense-category-search"}>
                        <div className="group flex-1  transition-colors duration-100 flex items-center gap-3 bg-white border-2 border-slate-200 shadow-sm cursor-pointer text-zinc-700 p-2.5 px-6 rounded-xl font-semibold">
                            <input
                                value={searchDate === "none" ? "" : searchDate}
                                type="month"
                                onClick={() => { setCatagSearch("") }}
                                className="flex-1 [&::-webkit-calendar-picker-indicator]:invert-0  focus:ring-0  cursor-pointer outline-0 border-0"
                                onChange={(e) => {
                                    setSearchDate(e.target.value || "none");
                                }}
                            />
                        </div>
                    </PermissionGuard>
                </div>

                {expenseCardsView == "table" && (
                    <div className="flex w-full border-b mt-10 border-gray-600 bg-slate-100 font-semibold text-slate-700">
                        <div className="w-[15%] px-5 py-3 text-center">Amount</div>
                        {/* <div className="w-[10%] px-5 py-3 text-center">Type</div> */}
                        <div className="w-[12%] px-5 py-3 whitespace-nowrap text-center">Date</div>
                        <div className="w-[15%] px-5 py-3 whitespace-nowrap text-center">Category</div>
                        <div className="flex-1 px-5 py-3 text-center">Notes</div>
                        <div className="w-[20%] px-5 py-3 whitespace-nowrap text-center">Actions</div>
                    </div>
                )}

                {expensesData?.length < 1 ? (
                    <div className='text-gray-600 h-[50vh] w-full flex justify-center items-center'>
                        {searchDate === "none"
                            ? "No expenses found"
                            : `No expenses found for ${searchDate}`
                        }
                    </div>
                ) : (
                    <div className={`w-full ${expenseCardsView == "card" ? "flex gap-2 flex-wrap justify-center" : null}`}>
                        {expensesData.map((exp, index) => (
                            <div key={exp._id || index} className={`${expenseCardsView == "card" ? "w-max" : "w-full"}`}>
                                {expenseCardsView == "card" ? (
                                    <EachExpenseInCardView
                                        getExpensesFunc={getExpenses}
                                        exp={exp}
                                        setExpenseUpdateVisibility={setExpenseUpdateVisibility}
                                        setCurrentToUpdateExpenseData={setCurrentToUpdateExpenseData}
                                        setExpensesData={setExpensesData}
                                    />
                                ) : (
                                    <EachExpenseInTableView
                                        getExpensesFunc={getExpenses}
                                        exp={exp}
                                        setExpenseUpdateVisibility={setExpenseUpdateVisibility}
                                        setCurrentToUpdateExpenseData={setCurrentToUpdateExpenseData}
                                        setExpensesData={setExpensesData}
                                        catagSearch={catagSearch}
                                    />
                                )}
                            </div>
                        ))}

                        {loadingExpense && (
                            <div className="w-full py-4 text-center text-gray-500">
                                Loading more expenses...
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}