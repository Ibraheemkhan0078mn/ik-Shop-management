import React from 'react'
import { useCreateCategoryMutation } from '../services/category.service';
import { useState } from 'react';
import FormLayout from '@shared/components/FormLayout';

const AddCategories = ({ setVisibility }) => {
    let [createCategoryMutation] = useCreateCategoryMutation()
    const [formData, setformData] = useState({
        name: "",
        description: ""
    })


    const config = {
        title: "Add New Category",
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
        await createCategoryMutation(formData).unwrap()
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

export default AddCategories