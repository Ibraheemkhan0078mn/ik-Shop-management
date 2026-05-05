import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo } from "react";
import { useCategories } from "../features/categories/categories.service";

export function useProductFormData() {
    const dispatch = useDispatch();

    const categoriesList = useSelector((state) => state.categories.list || []);

    // ✅ Memoize filtered categories
    const categories = useMemo(
        () => categoriesList.filter((c) => c?.isActive),
        [categoriesList],
    );

    useEffect(() => {
        if (!categoriesList.length) dispatch(getCategories());
    }, [dispatch, categoriesList.length]);

    return { categories };
}
