import React from 'react'
import { useCreateSubCategoryMutation, useUpdateSubCategoryMutation } from '../services/subCategories.service.js';
import { useState } from 'react';
import FormLayout from '../../../components/common/FormLayout.jsx';
import { useGetCategoriesQuery } from '../services/category.service.js';

const CategoriesFormModel = ({ setVisibility, operation = "create", defaultValues = {} }) => {
    let [createSubCategoryMutation] = useCreateSubCategoryMutation()
    let [updateSubCategoryMutation] = useUpdateSubCategoryMutation()
    let { data: categories } = useGetCategoriesQuery()
    const [formData, setformData] = useState(defaultValues || {
        name: "",
        description: "",
        category: ""
    })


    const config = {
        title: operation == "create" ? "Add New SubCategory" : "Update SubCategory",
        columns: 1,
        submitLabel: operation == "create" ? "Save SubCategory" : "Update SubCategory",
        fields: [
            {
                name: "category",
                label: "Category Name",
                type: "select",
                options: categories?.map((category) => ({ label: category.name, value: category._id })),
                required: true,
            },
            {
                name: "name",
                label: "SubCategory Name",
                type: "text",
                placeholder: "SubCategory ka naam likhein",
                required: true,
            },
            {
                name: "description",
                label: "Description",
                type: "textarea",
                placeholder: "SubCategory description likhein",
                rows: 4,
                span: "full",
            },
        ],
    };



    async function onSubmit() {
        operation == "create" ? await createSubCategoryMutation(formData) : await updateSubCategoryMutation({ ...formData, id: defaultValues._id })
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
                zIndex={100}
            />


        </div>
    )
}

export default CategoriesFormModel