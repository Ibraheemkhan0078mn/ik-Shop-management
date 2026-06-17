import { Mail, Shield, Minus, Square, X } from "lucide-react";
import React from "react";
import logo from "@shared/assets/Chai-Fi.png";
import logoCup from "@shared/assets/Chai_fi_cup.png";

export default function CopyrightDesktop() {
    const companyName = "Chai Fi System";
    const owner = "SSI";
    const year = new Date().getFullYear();

    return (
        <main>
            {/* Windows-Style Container */}
            <section className="w-full h-[80vh] bg-(--surface) rounded-3xl overflow-hidden">
                <div className="p-10">
                    {/* Hero Logo Section */}
                    <div className="flex flex-col items-center mb-10">
                        <img
                            src={logo}
                            alt={companyName}
                            className="h-24 w-auto mb-4 grayscale-[0.2] hover:grayscale-0 transition-all"
                        />
                        <div className="text-center">
                            <p className="text-xs text-(--muted) uppercase tracking-[0.2em] mt-1 font-semibold">
                                Version 3.0.0 • Desktop
                            </p>
                        </div>
                    </div>

                    {/* Legal & Ownership Section */}
                    <div className="space-y-4 border-t border-b border-(--border) py-8">
                        <div className="flex gap-4">
                            <Shield className="w-5 h-5 text-(--accent-2) shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-(--muted) leading-relaxed">
                                    © {year}{" "}
                                    <span className="text-(--ink) font-bold">
                                        {owner}
                                    </span>
                                    . All intellectual property rights,
                                    including source code and design systems,
                                    are strictly reserved.
                                </p>
                            </div>
                        </div>
                        <p className="text-[13px] text-(--muted) ml-9 italic leading-relaxed">
                            Unauthorized reproduction, modification, or
                            distribution of this software is prohibited under
                            international copyright laws.
                        </p>
                    </div>

                    {/* Contact Grid */}
                    <div className="mt-8 grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <span className="text-[11px] font-bold text-(--muted) uppercase tracking-wider">
                                Support
                            </span>
                            <a
                                href="mailto:support@ssi.com"
                                className="flex items-center gap-2 text-[13px] text-(--muted) hover:text-(--accent-2) transition-colors"
                            >
                                <Mail className="w-3.5 h-3.5" /> support@ssi.com
                            </a>
                        </div>
                        <div className="space-y-1 text-right">
                            <span className="text-[11px] font-bold text-(--muted) uppercase tracking-wider">
                                Contact
                            </span>
                            <p className="text-[13px] text-(--muted)">
                                +92 321 3268095
                            </p>
                        </div>
                    </div>

                    {/* Footer Branding */}
                    <div className="mt-12 pt-6 border-t border-(--border) flex justify-between items-center">
                        <p className="text-[11px] text-(--muted)">
                            Developed & Maintained by{" "}
                            <span className="font-semibold">{owner}</span>
                        </p>
                        <div className="flex gap-2">
                            <div
                                className="w-2 h-2 rounded-full bg-(--accent-2) shadow-[0_14px_30px_rgba(64,45,28,0.10)]"
                                title="System Online"
                            ></div>
                            <div className="w-2 h-2 rounded-full bg-(--surface-muted) shadow-[0_14px_30px_rgba(64,45,28,0.10)]"></div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

