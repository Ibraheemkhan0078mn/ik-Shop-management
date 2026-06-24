import Table from "../../../shared/ui/Table.jsx";
import { useParams, useSearchParams } from "react-router-dom";
import Button from "../../../shared/ui/Button.jsx";

const ReportDetailsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { module } = useParams(); // sales | purchases | inventory

    const reportKey = searchParams.get("reportKey");

    // Simple placeholder - use the main ReportsPage for actual functionality
    return (
        <div className="min-h-screen bg-(--surface) p-6 rounded-3xl border border-(--border) shadow-[0_18px_50px_rgba(64,45,28,0.12)]">
            <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-(--ink) mb-4">
                    Report Details
                </h2>
                <p className="text-(--muted) mb-6">
                    Module: {module} | Report Key: {reportKey}
                </p>
                <p className="text-sm text-(--muted)">
                    Please use the main Reports page for viewing report details.
                </p>
            </div>
        </div>
    );
};

export default ReportDetailsPage;
