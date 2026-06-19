import React from 'react'
import { useCreateSubCategoryMutation, useGetSubCategoryByIdQuery, useUpdateSubCategoryMutation } from '../services/subCategories.service';
import { useState } from 'react';
import FormLayout from '@shared/components/FormLayout';
import { useEffect } from 'react';
import { useGetCategoriesQuery } from '../services/category.service';

const SubCategoryCrudModel = ({ setVisibility, id, operation = "create", catagId }) => {
    let { data: subCategoryData, isLoading: isFetching } = useGetSubCategoryByIdQuery(id, { skip: operation == "create" })
    let [updateSubCategoryMutation] = useUpdateSubCategoryMutation({ skip: operation == "create" })
    let [createSubCategoryMutation] = useCreateSubCategoryMutation()
    const { data: allCategories, isLoading: allCategoriesLoading } = useGetCategoriesQuery()





    const [formData, setformData] = useState({
        id: "",
        name: "",
        description: "",
        category: ""
    })





    useEffect(() => {
        if (operation == "create" && catagId) {
            setformData({ ...formData, category: catagId })
        }
    }, [])



    useEffect(() => {
        if (operation == "update") {

            setformData({
                id: subCategoryData?._id,
                name: subCategoryData?.name,
                description: subCategoryData?.description,
                category: subCategoryData?.category || ""
            })
        }
    }, [subCategoryData])


    const config = {
        title: operation == "update" ? "Update Sub Category" : "Create Sub Category",
        columns: 1,
        submitLabel: operation?.toLocaleUpperCase() + " Sub Category",
        fields: [
            {
                type: "select",
                name: "category",
                label: "Category",
                options: allCategories?.map((category) => ({
                    label: category.name,
                    value: category._id,
                })),
                placeholder: "Category select karein",
                required: true,
            },
            {
                name: "name",
                label: "Sub Category Name",
                type: "text",
                placeholder: "Sub Category ka naam likhein",
                required: true,
            },
            {
                name: "description",
                label: "Description",
                type: "textarea",
                placeholder: "Sub Category description likhein",
                rows: 4,
                span: "full",
            },
        ],
    };



    async function onSubmit() {
        if (operation == "update") {
            await updateSubCategoryMutation(formData)
        } else {
            await createSubCategoryMutation(formData)
        }
        setVisibility(false)
    }



    return (
        <div className='z-50'>

            <FormLayout
                setVisibility={setVisibility}
                config={config}
                formData={formData}
                setFormData={setformData}
                onSubmit={onSubmit}
                zIndex={100}
            />


        </div>
    )
}

export default SubCategoryCrudModel