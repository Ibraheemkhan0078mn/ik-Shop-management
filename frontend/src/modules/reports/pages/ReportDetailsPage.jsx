import Table from "@shared/ui/Table";
import { useParams, useSearchParams } from "react-router-dom";
import Button from "@shared/ui/Button";
import { REPORT_MODULE_REGISTRY } from "./REPORT_MODULE_REGISTRY";
import { REPORT_COLUMNS_REGISTRY } from "./REPORT_COLUMNS_REGISTRY";

const ReportDetailsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { module } = useParams(); // sales | purchases | inventory

    const reportKey = searchParams.get("reportKey");

    const MODULE_REGISTRY = REPORT_MODULE_REGISTRY[module];
    const COLUMNS_REGISTRY = REPORT_COLUMNS_REGISTRY[module];
    const report = MODULE_REGISTRY[reportKey];

    if (!report) return <div>Report not found</div>;

    const data = [];

    return (
        <div
            className={`min-h-screen bg-(--surface) p-6 rounded-3xl border border-(--border) shadow-[0_18px_50px_rgba(64,45,28,0.12)] flex gap-2 flex-col`}
        >
            <header className="px-2 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-(--ink) font-display">
                        {report.title.en}
                    </h3>
                    <p className="text-sm text-(--muted)">
                        {report.description}
                    </p>
                </div>
                <div className="flex gap-2 items-center justify-center">
                    <div className="flex flex-col">
                        <label className="text-(--muted)">Start Date</label>
                        <input
                            type="date"
                            className="border border-(--border) rounded-xl p-2 text-(--ink) bg-(--surface-muted)"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-(--muted)">End Date</label>
                        <input
                            type="date"
                            className="border border-(--border) rounded-xl p-2 text-(--ink) bg-(--surface-muted)"
                        />
                    </div>
                    <Button size="sm" className="mt-5">
                        Apply
                    </Button>
                </div>
            </header>
            <div className="w-full">
                <Table
                    columns={COLUMNS_REGISTRY[report.columnsKey]}
                    data={data}
                    exportFilename={report.exportFile}
                />
            </div>
        </div>
    );
};

export default ReportDetailsPage;
