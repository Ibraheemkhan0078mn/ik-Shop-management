import api from "@shared/services/axiosInstance.js"




export async function getExpenses(origin) {
    try {

        if (origin == "update") {
            setExpenseBatchNo(0)
        }


        if (searchDate) {



            setLoadingExpense(true)


            let res = await api.get(`/expenseRoutes/getExpense/${origin == "update" || origin == "delete" ? 0 : skipExpense.current}/${limitExpense}/${searchDate || "none"}`)

            if (res.data) { setLoadingExpense(false) }
            if (res.data.success) {

                let expenses = res.data.expenses
                skipExpense.current = skipExpense.current + expenses?.length

                if (expenses?.length > 0) {
                    expenseBatchNo == 0 || origin == "update" || origin == "delete" ? setExpensesData(expenses) : setExpensesData(prev => ([...prev, ...expenses]))
                    setExpenseBatchNo(prev => prev + 1)
                } else if (expenses?.length <= 0 || origin == "update" || origin == "delete") {
                    setHasMore(false);
                    (expenseBatchNo == 0) ? setExpensesData(expenses) : null
                }

            }
        } else {
            let [m, d, y] = new Date().toLocaleDateString().split("/")
            setSearchDate(`${y}-${m < 10 ? `0${m}` : m}`)

        }
    } catch (error) {
        setLoadingExpense(false)
        console.error(error)
    }
}