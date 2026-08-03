import { useSelector } from "react-redux";
import { useGetUserQuery } from "../services/authApi.js";

export const useCurrentUser = () => {
    const userId = useSelector((state) => state.auth.id);
    const { data, error, isLoading, refetch } = useGetUserQuery(userId, { skip: !userId });

    // If data is not present and we have a userId, refetch
    if (userId && !data && !isLoading && !error) {
        refetch();
    }

    return { data: data.data, error, isLoading, refetch };
};
