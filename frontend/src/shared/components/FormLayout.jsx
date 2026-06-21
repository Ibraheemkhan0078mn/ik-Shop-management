

import { useRef } from "react";
import { X } from "lucide-react";
import { FormField, Input, Textarea, SearchableSelect } from "./FormFields";

// ─── Inline attached button ───────────────────────────────────
const AttachedButton = ({ btn }) => (
    <button
        type="button"
        onClick={btn.onClick}
        disabled={btn.disabled}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium
                   rounded-lg border border-(--border) bg-(--surface) text-(--ink)
                   hover:bg-(--surface-muted) active:scale-95 transition-all cursor-pointer
                   shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
    >
        {btn.icon && <span className="w-4 h-4 flex items-center justify-center">{btn.icon}</span>}
        {btn.label}
    </button>
);

// ─── Wraps an input + optional buttons in a flex row ─────────
const WithButtons = ({ buttons, children }) => {
    if (!buttons?.length) return children;
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">{children}</div>
            {buttons.map((btn, i) => (
                <AttachedButton key={i} btn={btn} />
            ))}
        </div>
    );
};

// ─── Shared option item style (radio / checkbox) ─────────────
const OptionItem = ({ type, name, value, checked, label, disabled, onChange }) => (
    <label className="flex items-center gap-2 text-sm text-(--ink) cursor-pointer select-none">
        <input
            type={type}
            name={name}
            value={value}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="w-4 h-4 accent-(--accent-2) cursor-pointer shrink-0"
        />
        {label}
    </label>
);

// ─── File / Image upload box ──────────────────────────────────
const UploadBox = ({ field, val, update }) => {
    const isImage = field.type === "image";
    const files = Array.isArray(val) ? val : [];
    const ref = useRef(null);

    const pick = (incoming) =>
        update(field.multiple ? [...files, ...incoming] : incoming);

    return (
        <div className="flex flex-col gap-2">
            <div
                onClick={() => ref.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); pick(Array.from(e.dataTransfer.files)); }}
                className="border-2 border-dashed border-(--border) rounded-xl p-5 text-center
                           cursor-pointer bg-(--surface-muted) hover:border-(--accent-2) hover:bg-(--surface) transition-colors"
            >
                {isImage ? (
                    <svg className="mx-auto text-(--muted) mb-1" width="24" height="24" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                    </svg>
                ) : (
                    <svg className="mx-auto text-(--muted) mb-1" width="24" height="24" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                            strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
                <span className="text-xs text-(--muted)">
                    {field.placeholder || (isImage ? "Image chunein ya drag karein" : "File chunein ya drag karein")}
                </span>
                {field.accept && (
                    <span className="block text-xs text-(--muted)/60 mt-0.5">{field.accept}</span>
                )}
                <input
                    ref={ref}
                    type="file"
                    className="hidden"
                    accept={field.accept || (isImage ? "image/*" : undefined)}
                    multiple={field.multiple}
                    onChange={(e) => pick(Array.from(e.target.files || []))}
                />
            </div>

            {files.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {files.map((f, i) =>
                        isImage ? (
                            <div key={i} className="relative inline-block">
                                <img
                                    src={URL.createObjectURL(f)}
                                    alt={f.name}
                                    className="w-14 h-14 object-cover rounded-lg border border-(--border)"
                                />
                                <button
                                    onClick={() => update(files.filter((_, idx) => idx !== i))}
                                    className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center
                                               bg-(--surface) border border-(--border) rounded-full text-(--muted)
                                               hover:text-(--ink) text-xs transition-colors"
                                >✕</button>
                            </div>
                        ) : (
                            <div key={i}
                                className="flex items-center gap-1.5 text-xs bg-(--surface-muted) border
                                           border-(--border) rounded-md px-2 py-1 text-(--ink)">
                                {f.name}
                                <button
                                    onClick={() => update(files.filter((_, idx) => idx !== i))}
                                    className="text-(--muted) hover:text-(--ink) transition-colors"
                                >✕</button>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Single field renderer ────────────────────────────────────
function Field({ field, formData, setFormData }) {
    const val = formData[field.name];
    const update = (v) => setFormData((prev) => ({ ...prev, [field.name]: v }));
    const btns = field.buttons || [];

    if (["text", "number", "password", "email", "tel", "date", "time", "url"].includes(field.type)) {
        return (
            <FormField label={field.label} error={field.error}>
                <WithButtons buttons={btns}>
                    <Input
                        type={field.type}
                        placeholder={field.placeholder || ""}
                        value={val ?? ""}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        disabled={field.disabled}
                        onChange={(e) => update(e.target.value)}
                    />
                </WithButtons>
                {field.hint && <span className="text-xs text-(--muted)">{field.hint}</span>}
            </FormField>
        );
    }

    if (field.type === "select") {
        return (
            <FormField label={field.label} error={field.error}>
                <WithButtons buttons={btns}>
                    <SearchableSelect
                        options={field.options || []}
                        value={val ?? ""}
                        placeholder={field.placeholder || "Chunein..."}
                        disabled={field.disabled}
                        onChange={update}
                    />
                </WithButtons>
                {field.hint && <span className="text-xs text-(--muted)">{field.hint}</span>}
            </FormField>
        );
    }

    if (field.type === "radio") {
        return (
            <FormField label={field.label} error={field.error}>
                <div className={field.inline ? "flex flex-wrap gap-x-4 gap-y-2" : "flex flex-col gap-2"}>
                    {(field.options || []).map((o) => (
                        <OptionItem
                            key={o.value}
                            type="radio"
                            name={field.name}
                            value={o.value}
                            label={o.label}
                            checked={val === o.value}
                            disabled={field.disabled}
                            onChange={() => update(o.value)}
                        />
                    ))}
                </div>
                {btns.length > 0 && (
                    <div className="flex gap-2 mt-1">
                        {btns.map((btn, i) => <AttachedButton key={i} btn={btn} />)}
                    </div>
                )}
                {field.hint && <span className="text-xs text-(--muted)">{field.hint}</span>}
            </FormField>
        );
    }



    if (field.type === "toggle") {
        return (
            <FormField label={field.label} error={field.error}>
                <label className="flex items-center gap-3 cursor-pointer select-none w-fit">
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={!!val}
                            disabled={field.disabled}
                            onChange={(e) => update(e.target.checked)}
                        />
                        <div className="w-10 h-6 bg-(--surface-muted) rounded-full peer-checked:bg-(--accent-2) transition-colors duration-200" />
                        <div className="absolute top-1 left-1 w-4 h-4 bg-(--surface) rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4" />
                    </div>
                    <span className="text-sm text-(--ink)">
                        {val ? (field.onLabel || "Yes") : (field.offLabel || "No")}
                    </span>
                </label>
                {field.hint && <span className="text-xs text-(--muted)">{field.hint}</span>}
            </FormField>
        );
    }





    if (field.type === "textarea") {
        return (
            <FormField label={field.label} error={field.error}>
                <WithButtons buttons={btns}>
                    <Textarea
                        placeholder={field.placeholder || ""}
                        value={val ?? ""}
                        rows={field.rows || 4}
                        disabled={field.disabled}
                        onChange={(e) => update(e.target.value)}
                    />
                </WithButtons>
                {field.hint && <span className="text-xs text-(--muted)">{field.hint}</span>}
            </FormField>
        );
    }

    if (field.type === "file" || field.type === "image") {
        return (
            <FormField label={field.label} error={field.error}>
                <UploadBox field={field} val={val} update={update} />
                {btns.length > 0 && (
                    <div className="flex gap-2 mt-1">
                        {btns.map((btn, i) => <AttachedButton key={i} btn={btn} />)}
                    </div>
                )}
                {field.hint && <span className="text-xs text-(--muted)">{field.hint}</span>}
            </FormField>
        );
    }

    return null;
}

// ─── Grid columns map ─────────────────────────────────────────
const GRID = {
    1: "grid grid-cols-1 gap-x-5 gap-y-4",
    2: "grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4",
    3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4",
};

// ─── Form body (fields + submit btn) — shared between modes ──
function FormBody({ config, formData, setFormData, onSubmit }) {
    return (
        <div className="w-full  ">
            <div className={GRID[config.columns || 1] || GRID[1]}>
                {(config.fields || []).map((field, i) => {

                    if (field.visible === false) return null;

                    if (field.type === "divider")
                        return <hr key={i} className="col-span-full border-(--border) my-1" />;

                    if (field.type === "section")
                        return (
                            <p key={i} className="col-span-full text-xs font-semibold text-(--muted) uppercase tracking-widest pt-2">
                                {field.label}
                            </p>
                        );

                    return (
                        <div key={field.name || i} className={field.span === "full" || field.fullWidth ? "col-span-full" : ""}>
                            <Field field={field} formData={formData} setFormData={setFormData} />
                        </div>
                    );
                })}
            </div>

            {config.submitLabel !== false && (
                <div className="mt-6">
                    <button
                        onClick={() => onSubmit?.(formData)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium
                                   rounded-lg bg-(--accent-2) text-(--surface) hover:bg-(--accent-2)/80
                                   active:scale-95 transition-all cursor-pointer"
                    >
                        {config.submitLabel || "Submit"} →
                    </button>
                </div>
            )}
        </div>
    );
}


export default function FormLayout({zIndex=50, config, formData, setFormData, onSubmit, setVisibility }) {

    return (

        <div
            className={`fixed inset-0 z-[${zIndex}] flex items-center justify-center bg-black/50 backdrop-blur-md p-4`}
            onClick={() => setVisibility(false)}
        >
            <div
                className="rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-(--border) bg-(--surface)"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-(--border) shrink-0 bg-(--surface-muted)">
                    {config.title ? (
                        <h2 className="text-xl font-bold text-(--ink) tracking-tight">
                            {config.title}
                        </h2>
                    ) : (
                        <span />
                    )}
                    <button
                        type="button"
                        onClick={() => setVisibility(false)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-(--surface) text-(--muted) transition-colors duration-200"
                    >
                        ✕
                    </button>
                </div>

                {/* Scrollable form area */}
                <div className="overflow-y-auto flex-1 px-6 py-6 custom-scrollbar">
                    <FormBody
                        config={config}
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={onSubmit}
                    />
                </div>
            </div>
        </div>
    );
}