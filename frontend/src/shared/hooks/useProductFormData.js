import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo } from "react";
import { useGetCategoriesQuery } from "@modules/productsModule/services/category.service";

export function useProductFormData() {
    const dispatch = useDispatch();

    const { data: categoriesData } = useGetCategoriesQuery();
    const categoriesList = categoriesData?.data || categoriesData || [];

    // ✅ Memoize filtered categories
    const categories = useMemo(
        () => categoriesList.filter((c) => c?.isActive),
        [categoriesList],
    );

    return { categories };
}
