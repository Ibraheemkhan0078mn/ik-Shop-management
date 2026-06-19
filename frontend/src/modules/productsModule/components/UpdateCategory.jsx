import React from 'react'
import { useGetCategoryByIdQuery, useUpdateCategoryMutation } from '../services/category.service';
import { useState } from 'react';
import FormLayout from '@shared/components/FormLayout';
import { useEffect } from 'react';

const UpdateCategory = ({ setVisibility, id }) => {
    let { data: categoryData, isLoading: isFetching } = useGetCategoryByIdQuery(id)
    let [updateCategoryMutation] = useUpdateCategoryMutation()
    const [formData, setformData] = useState({
        id: "",
        name: "",
        description: ""
    })


    useEffect(() => {
        setformData({
            id: categoryData?._id,
            name: categoryData?.name,
            description: categoryData?.description
        })
    }, [categoryData])


    const config = {
        title: "Update Category",
        columns: 1,
        submitLabel: "Save Category",
        fields: [
            {
                name: "name",
                label: "Category Name",
                type: "text",
                placeholder: "Category ka naam likhein",
                required: true,
            },
            {
                name: "description",
                label: "Description",
                type: "textarea",
                placeholder: "Category description likhein",
                rows: 4,
                span: "full",
            },
        ],
    };



    async function onSubmit() {
        await updateCategoryMutation(formData)
        setVisibility(false)
    }



    return (
        <div>

            <FormLayout
                setVisibility={setVisibility}
                config={config}
                formData={formData}
                setFormData={setformData}
                onSubmit={onSubmit}
            />


        </div>
    )
}

export default UpdateCategory