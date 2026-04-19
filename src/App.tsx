import React, { useState, useCallback, useRef, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { php } from "@codemirror/lang-php";
import { linter, lintGutter, Diagnostic } from "@codemirror/lint";
import { foldGutter } from "@codemirror/language";
import ReactDiffViewer from 'react-diff-viewer-continued';
import { CheckCircle2, Upload, Sun, Moon, ChevronDown, ChevronRight, Check, X, Github } from "lucide-react";
import { analyzePhpCode, fixPhpCode } from "./api";
import { examples } from "./examples";
import { Button } from "./components/Button";
import { AnalysisResult, countAnalysisIssues } from "./phpstan";

const FileResultSection: React.FC<{ filename: string, errors: any[], warnings: any[] }> = ({ filename, errors, warnings }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (errors.length === 0 && warnings.length === 0) return null;

  return (
     <div className="mb-4">
         <button
           onClick={() => setIsExpanded(!isExpanded)}
           className="w-full flex items-center justify-between text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 mt-2 bg-gray-100 dark:bg-gray-800/60 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700/60 transition-colors border border-transparent dark:border-gray-700/50"
         >
           <div className="flex items-center gap-2 truncate pr-2">
             {isExpanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
             <span className="truncate">{filename}</span>
           </div>
           <div className="flex items-center gap-1.5 text-[10px] shrink-0">
             {errors.length > 0 && <span className="text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 rounded flex items-center shadow-sm border border-red-200 dark:border-red-800">{errors.length} err</span>}
             {warnings.length > 0 && <span className="text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded flex items-center shadow-sm border border-amber-200 dark:border-amber-800">{warnings.length} warn</span>}
           </div>
         </button>
         
         {isExpanded && (
           <div className="pl-1 pt-1">
             {errors.map((err: any, i: number) => (
               <div key={`err-${i}`} className="border border-red-200 dark:border-red-900/50 rounded-md mb-2 overflow-hidden shadow-sm">
                 <div className="bg-red-50 dark:bg-red-900/30 px-3 py-1.5 font-mono text-[11px] border-b border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400 font-semibold flex justify-between">
                   <span>Line {err.line} &middot; Error</span>
                 </div>
                 <div className="p-3 font-mono bg-white dark:bg-gray-800/80 text-gray-800 dark:text-gray-300 text-xs whitespace-pre-wrap leading-relaxed break-words">
                   {err.message}
                 </div>
               </div>
             ))}
             {warnings.map((err: any, i: number) => (
               <div key={`warn-${i}`} className="border border-amber-200 dark:border-amber-900/50 rounded-md mb-2 overflow-hidden shadow-sm">
                 <div className="bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 font-mono text-[11px] border-b border-amber-100 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 font-semibold flex justify-between">
                   <span>Line {err.line} &middot; Warning / Hint</span>
                 </div>
                 <div className="p-3 font-mono bg-white dark:bg-gray-800/80 text-blue-600 dark:text-blue-400 text-xs font-semibold whitespace-pre-wrap leading-relaxed break-words">
                   {err.message}
                 </div>
               </div>
             ))}
           </div>
         )}
     </div>
  );
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [code, setCode] = useState<string>(examples[0].code);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [autoFormat, setAutoFormat] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [diffContent, setDiffContent] = useState<{original: string, fixed: string} | null>(null);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lintExtension = useMemo(() => {
    return linter((view) => {
      const diagnostics: Diagnostic[] = [];
      if (!results || !results.files) return diagnostics;
      
      const doc = view.state.doc;
      Object.values(results.files).forEach((fileData: any) => {
        fileData.errors?.forEach((err: any) => {
          const safeLine = err.line && err.line > 0 ? err.line : 1;
          const lineNum = Math.min(Math.max(1, safeLine), doc.lines);
          const lineInfo = doc.line(lineNum);
          
          diagnostics.push({
            from: lineInfo.from,
            to: Math.max(lineInfo.from, lineInfo.to),
            severity: err.ignorable ? "warning" : "error",
            message: err.message,
          });
        });
      });
      return diagnostics;
    });
  }, [results]);

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCode(e.target.result as string);
        setResults(null);
        setError(null);
      }
    };
    reader.readAsText(file);
  };

  const checkAndReadFile = (file: File) => {
    // Prevent ridiculously large files from crashing the browser tab
    if (file.size > 2 * 1024 * 1024) {
      setError(`Upload failed: File is too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum file size is 2MB.`);
      setResults(null);
      return;
    }

    // Validate that it's actually a PHP file
    if (file.name.toLowerCase().endsWith('.php') || file.type.includes('php')) {
      readFile(file);
    } else {
      setError(`Upload failed: "${file.name}" is not a valid PHP file. Please upload a file with a .php extension.`);
      setResults(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) checkAndReadFile(file);
    if (e.target) e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const relatedTarget = e.relatedTarget as Node | null;
    if (!e.currentTarget.contains(relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      checkAndReadFile(file);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setResults(null);
    setError(null);
    try {
      let currentCode = code;
      
      if (autoFormat) {
        setIsFixing(true);
        try {
          const fixData = await fixPhpCode(currentCode);
          if (fixData.status === "success" && fixData.fixed_code) {
            currentCode = fixData.fixed_code;
            setCode(currentCode);
          }
        } catch (fixErr) {
          console.warn("Auto-format failed:", fixErr);
          // Continue with unformatted code if formatting fails
        } finally {
          setIsFixing(false);
        }
      }

      const data = await analyzePhpCode(currentCode);
      setResults(data);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFix = async () => {
    setIsFixing(true);
    setError(null);
    try {
      const data = await fixPhpCode(code);
      if (data.status === "success" && data.fixed_code) {
        if (data.fixed_code !== code) {
          setDiffContent({ original: code, fixed: data.fixed_code });
          setShowDiff(true);
        } else {
          setResults({ message: "Code is already perfectly formatted!" });
        }
      } else {
        setError("Failed to fix code or no changes required.");
      }
    } catch (err: any) {
      setError(err.message || "An unknown error occurred");
    } finally {
      setIsFixing(false);
    }
  };

  const acceptDiff = () => {
    if (diffContent) {
      setCode(diffContent.fixed);
      setResults({ message: "Code fixed successfully with PHP-CS-Fixer!" });
    }
    setShowDiff(false);
    setDiffContent(null);
  };

  const discardDiff = () => {
    setShowDiff(false);
    setDiffContent(null);
    setResults({ message: "Fixes discarded." });
  };

  const loadExample = (exampleCode: string) => {
    setCode(exampleCode);
    setResults(null);
    setError(null);
  };

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-screen w-full overflow-hidden bg-[#f3f4f6] dark:bg-gray-950 text-gray-800 dark:text-gray-200 font-sans flex flex-col`}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 lg:px-6 py-3 lg:h-16 flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-0 shrink-0 shadow-sm z-10 relative">
        <div className="flex items-center gap-3 self-start lg:self-center">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-sm shrink-0">
            V
          </div>
          <span className="font-semibold text-lg text-gray-900 dark:text-white truncate">PHP Analyzer Playground</span>
        </div>
        <div className="flex flex-wrap items-center justify-start lg:justify-end gap-3 w-full lg:w-auto">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className="p-2 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 transition-colors mr-2"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <label className="flex items-center gap-2 text-[13px] text-gray-600 dark:text-gray-400 cursor-pointer mr-2 select-none">
            <input 
              type="checkbox" 
              checked={autoFormat}
              onChange={(e) => setAutoFormat(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-blue-600 checked:bg-blue-600 checked:border-blue-600 dark:checked:bg-blue-500 dark:checked:border-blue-500 focus:ring-blue-500 cursor-pointer"
            />
            Auto-format before analysis
          </label>
          <Button
            loading={isFixing && !isAnalyzing}
            variant="secondary"
            onClick={handleFix}
          >
            PHP CS Fixer
          </Button>
          <Button
            loading={isAnalyzing}
            variant="primary"
            onClick={handleAnalyze}
          >
            Run PHPStan
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-x-hidden overflow-y-auto lg:overflow-hidden relative">
        {/* Sidebar */}
        <aside className="w-full lg:w-[260px] bg-white dark:bg-gray-900 lg:border-r border-b lg:border-b-0 border-gray-200 dark:border-gray-800 flex flex-col py-5 shrink-0 z-10 h-auto lg:h-full lg:overflow-y-auto">
          <div className="px-5 pb-5 border-b border-gray-200 dark:border-gray-800 mb-5">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
              Upload PHP File
            </Button>
            <input
              type="file"
              accept=".php"
              hidden
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
          </div>
          <div className="px-5 pb-3 text-xs uppercase tracking-widest text-[#6b7280] dark:text-gray-500 font-bold">Examples</div>
          {examples.map((ex, idx) => (
            <div
              key={idx}
              onClick={() => loadExample(ex.code)}
              className={`px-5 py-2.5 text-sm cursor-pointer flex items-center gap-2.5 transition-colors ${
                code === ex.code
                  ? "bg-[#eff6ff] dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-[3px] border-blue-600 dark:border-blue-500"
                  : "text-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border-r-[3px] border-transparent"
              }`}
            >
              <span className="text-[#6b7280] dark:text-gray-500">&bull;</span>
              {ex.name}
            </div>
          ))}
          <div className="mt-auto p-5">
            <div className="text-xs text-[#6b7280] dark:text-gray-400 bg-[#f3f4f6] dark:bg-gray-800 p-3 rounded-md">
              <strong>Tip:</strong> Use PHPStan\dumpType() to debug inferred types during analysis.
            </div>
          </div>
        </aside>

        {/* Editor Pane */}
        <section 
          className={`flex-1 relative flex flex-col min-w-0 min-h-[500px] lg:min-h-0 ${isDarkMode ? 'bg-[#0d0d0d]' : 'bg-white'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {showDiff && diffContent ? (
            <div className="absolute inset-0 z-[60] flex flex-col bg-white dark:bg-[#0d0d0d]">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shrink-0">
                <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">Review Formatting Changes</span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={discardDiff} className="h-8 text-xs py-1 px-3">
                    <X className="w-4 h-4 mr-1" /> Discard
                  </Button>
                  <Button variant="primary" onClick={acceptDiff} className="h-8 text-xs py-1 px-3">
                    <Check className="w-4 h-4 mr-1" /> Accept Fixes
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ReactDiffViewer 
                  oldValue={diffContent.original} 
                  newValue={diffContent.fixed} 
                  splitView={true}
                  useDarkTheme={isDarkMode}
                  leftTitle="Original Code"
                  rightTitle="Fixed Code"
                  styles={{
                    variables: {
                      dark: { diffViewerBackground: '#0d0d0d', addedBackground: '#042f1c', removedBackground: '#3f1119' },
                      light: { diffViewerBackground: '#fff', addedBackground: '#e6ffed', removedBackground: '#ffeef0' }
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <>
              {isDragging && (
                <div 
                  className="absolute inset-0 z-50 border-2 border-blue-500 bg-blue-500/5 shadow-[inset_0_0_30px_rgba(59,130,246,0.15)] pointer-events-none"
                />
              )}
              <div className={`h-9 flex items-center px-4 text-[12px] justify-between shrink-0 ${isDarkMode ? 'bg-[#1a1a1a] text-[#999]' : 'bg-gray-100 text-gray-500 border-b border-gray-200'}`}>
                <span>main.php</span>
                <span>UTF-8</span>
              </div>
              <div className="flex-1 overflow-y-auto w-full h-full relative" style={{ fontSize: "14px", fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace" }}>
                <CodeMirror
                  value={code}
                  height="100%"
                  extensions={[php(), lintGutter(), lintExtension, foldGutter()]}
                  onChange={(value) => setCode(value)}
                  className="h-full border-0 focus:outline-none"
                  theme={isDarkMode ? 'dark' : 'light'}
                />
              </div>
            </>
          )}
        </section>

        {/* Results Pane */}
        <aside className="w-full lg:w-[350px] bg-white dark:bg-gray-900 lg:border-l border-t lg:border-t-0 border-gray-200 dark:border-gray-800 flex flex-col min-w-0 shrink-0 min-h-[400px] lg:min-h-0 h-auto lg:h-full">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 font-semibold text-sm shrink-0">
            Analysis Results
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto text-[13px] leading-relaxed">
            {!results && !error && !isAnalyzing && (
              <div className="text-[#6b7280] dark:text-gray-500 text-center mt-10">
                Run analysis to see results here.
              </div>
            )}

            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center mt-10 text-[#6b7280] dark:text-gray-500 space-y-4">
                <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm">Analyzing code...</p>
              </div>
            )}

            {error && (
              <div className="border border-red-200 dark:border-red-900/50 rounded-md mb-3 overflow-hidden">
                <div className="bg-red-50 dark:bg-red-900/30 px-3 py-2 font-mono text-[11px] border-b border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-semibold">
                  Error
                </div>
                <div className="p-3 font-mono bg-white dark:bg-gray-800 text-red-800 dark:text-red-300 whitespace-pre-wrap">
                  {error}
                </div>
              </div>
            )}

            {results && !error && (
              <div>
                {(() => {
                  const {errors: totalErrors, warnings: totalWarnings} = countAnalysisIssues(results);

                  return (
                    <>
                      {(totalErrors > 0 || totalWarnings > 0) && (
                        <div className="flex gap-3 mb-5">
                          <div className="flex-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-3 flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 tracking-wider mb-1">Errors</span>
                            <span className="text-2xl font-semibold text-red-700 dark:text-red-500 leading-none">{totalErrors}</span>
                          </div>
                          <div className="flex-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3 flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-500 tracking-wider mb-1">Warnings / Hints</span>
                            <span className="text-2xl font-semibold text-amber-700 dark:text-amber-500 leading-none">{totalWarnings}</span>
                          </div>
                        </div>
                      )}

                      {totalErrors === 0 && totalWarnings === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-2 text-center animate-in fade-in duration-500">
                          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-500" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No issues found!</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">PHPStan couldn't find any structural errors or hints in your code. Great job!</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {results.files && Object.entries(results.files).map(([filename, fileData]: [string, any]) => {
                            const errors = fileData.errors?.filter((e: any) => !e.ignorable) || [];
                            const warnings = fileData.errors?.filter((e: any) => e.ignorable) || [];
                            return (
                              <FileResultSection 
                                key={filename}
                                filename={filename}
                                errors={errors}
                                warnings={warnings}
                              />
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </aside>
      </main>

      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3 lg:py-0 lg:h-7 shrink-0 flex flex-col lg:flex-row items-center text-[11px] text-[#6b7280] dark:text-gray-500 justify-between gap-1 lg:gap-0 z-10">
        <div>PHP 8.2 &nbsp; | &nbsp; PHPStan &nbsp; | &nbsp; Strict Mode: Enabled</div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span>API: php.moelleken.org/phpstan/analyze</span>
          <span aria-hidden="true">&middot;</span>
          <a
            href="https://github.com/voku/PHP_Analyzer_Playground"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <Github className="w-3.5 h-3.5" />
            Contribute on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
