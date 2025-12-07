import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

export const GeminiDebugger = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const log = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const runDiagnostics = async () => {
        setLoading(true);
        setLogs([]);
        log("Starting diagnostics...");

        try {
            // 1. Get Key
            const envKey = import.meta.env.VITE_API_KEY || (import.meta as any).env?.GEMINI_API_KEY;
            const processKey = typeof process !== 'undefined' ? process.env.VITE_API_KEY : 'N/A';

            log(`Key Check (Vite): ${envKey ? `Found (${envKey.toString().slice(0, 4)}...)` : 'MISSING'}`);
            log(`Key Check (Process): ${processKey ? 'Found' : 'MISSING'}`);

            const activeKey = envKey || processKey;

            if (!activeKey) {
                log("CRITICAL: No API Key found anywhere. Aborting.");
                setLoading(false);
                return;
            }

            // 2. Initialize SDK
            const genAI = new GoogleGenerativeAI(activeKey);
            log("SDK Initialized.");

            // 3. Test Model Listing (if supported by key scope)
            // Note: Users often have keys restricted to generative-language but not cloud resource manager
            try {
                // There isn't a direct "listModels" on the instance in the client SDK usually, 
                // but we can try a direct fetch to the endpoint to verify connectivity if we wanted.
                // Instead, let's try a generate call with a SAFE model.
                log("Attempting Generation with 'gemini-1.5-flash'...");
                const modelFlash = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const resultFlash = await modelFlash.generateContent("Hello, are you online?");
                const responseFlash = await resultFlash.response;
                log(`Response (Flash): ${responseFlash.text()}`);
            } catch (e: any) {
                log(`ERROR with 1.5-flash: ${e.toString()}`);

                // Fallback test
                log("Attempting Generation with 'gemini-pro' (Fallback)...");
                try {
                    const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
                    const resultPro = await modelPro.generateContent("Hello?");
                    const responsePro = await resultPro.response;
                    log(`Response (Pro): ${responsePro.text()}`);
                } catch (e2: any) {
                    log(`ERROR with gemini-pro: ${e2.toString()}`);
                }
            }

        } catch (err: any) {
            log(`FATAL ERROR: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-black/90 text-green-400 p-4 rounded-xl border border-green-500/30 w-96 font-mono text-xs shadow-2xl">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">Gemini Connection Probe</h3>
                <button
                    onClick={runDiagnostics}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                >
                    {loading ? 'Probing...' : 'Run Test'}
                </button>
            </div>
            <div className="h-48 overflow-y-auto bg-black/50 p-2 rounded border border-white/10">
                {logs.length === 0 ? <span className="opacity-50">Ready to test connection...</span> : logs.map((l, i) => (
                    <div key={i} className="mb-1 border-b border-white/5 pb-1">{l}</div>
                ))}
            </div>
        </div>
    );
};
