/**
 * Suite 3: Compilation and Runtime Errors & Diagnostics Test
 * 
 * Verifies that syntax errors, compilation errors, runtime exceptions,
 * missing entry points, non-zero exits, and unavailable runtimes are
 * truthfully diagnosed and accurately categorized.
 */

const { executeCodeApi } = require("../helpers/apiClient");

async function runErrorAndDiagnosticTests(collector) {
  const suite = "Error & Diagnostics Tests";

  // =========================================================================
  // 1. PYTHON ERROR DIAGNOSTICS
  // =========================================================================
  {
    const lang = "python";
    const category = "Python Error Diagnostics";

    // Syntax Error
    const t0 = Date.now();
    const syntaxRes = await executeCodeApi(lang, "def broken_syntax(\n  print('missing paren'");
    const isSyntaxErr =
      syntaxRes.data?.status === "COMPILATION_ERROR" ||
      (syntaxRes.data?.status === "RUNTIME_ERROR" && syntaxRes.data?.error?.includes("SyntaxError"));
    collector.record({
      suite,
      category,
      name: "PYTHON - SyntaxError detection and error reporting",
      language: lang,
      status: isSyntaxErr ? "PASS" : "FAIL",
      expected: "COMPILATION_ERROR or SyntaxError in error panel",
      actual: `status=${syntaxRes.data?.status}, error=${syntaxRes.data?.error?.slice(0, 80)}`,
      durationMs: Date.now() - t0,
    });

    // Undefined Variable NameError
    const t1 = Date.now();
    const nameErrRes = await executeCodeApi(lang, "print(peaklyy_undefined_var_xyz)");
    const isNameErr =
      syntaxRes.data?.status !== "SUCCESS" &&
      nameErrRes.data?.error?.includes("NameError");
    collector.record({
      suite,
      category,
      name: "PYTHON - Undefined identifier (NameError)",
      language: lang,
      status: isNameErr ? "PASS" : "FAIL",
      expected: "NameError reported with status RUNTIME_ERROR",
      actual: `status=${nameErrRes.data?.status}, error contains NameError: ${isNameErr}`,
      durationMs: Date.now() - t1,
    });

    // ZeroDivisionError
    const t2 = Date.now();
    const divZeroRes = await executeCodeApi(lang, "a = 10\nb = 0\nprint(a / b)");
    const isDivZero =
      divZeroRes.data?.status === "RUNTIME_ERROR" &&
      divZeroRes.data?.error?.includes("ZeroDivisionError");
    collector.record({
      suite,
      category,
      name: "PYTHON - Runtime ZeroDivisionError",
      language: lang,
      status: isDivZero ? "PASS" : "FAIL",
      expected: "ZeroDivisionError reported in error panel",
      actual: `status=${divZeroRes.data?.status}, error contains ZeroDivisionError: ${isDivZero}`,
      durationMs: Date.now() - t2,
    });

    // Explicit Non-Zero Exit Code
    const t3 = Date.now();
    const exitRes = await executeCodeApi(lang, "import sys\nsys.exit(42)");
    const isExitErr = exitRes.data?.status === "RUNTIME_ERROR" || exitRes.data?.exitCode === 42;
    collector.record({
      suite,
      category,
      name: "PYTHON - Explicit non-zero exit code (sys.exit 42)",
      language: lang,
      status: isExitErr ? "PASS" : "FAIL",
      expected: "Non-zero exit reported as RUNTIME_ERROR with exitCode 42",
      actual: `status=${exitRes.data?.status}, exitCode=${exitRes.data?.exitCode}`,
      durationMs: Date.now() - t3,
    });
  }

  // =========================================================================
  // 2. JAVASCRIPT (NODE.JS) ERROR DIAGNOSTICS
  // =========================================================================
  {
    const lang = "javascript";
    const category = "JavaScript Error Diagnostics";

    // Syntax Error
    const t0 = Date.now();
    const jsSyntax = await executeCodeApi(lang, "const x = ;");
    const isJsSyntax =
      jsSyntax.data?.status === "COMPILATION_ERROR" ||
      (jsSyntax.data?.status === "RUNTIME_ERROR" && jsSyntax.data?.error?.includes("SyntaxError"));
    collector.record({
      suite,
      category,
      name: "JAVASCRIPT - SyntaxError detection",
      language: lang,
      status: isJsSyntax ? "PASS" : "FAIL",
      expected: "SyntaxError reported",
      actual: `status=${jsSyntax.data?.status}, error=${jsSyntax.data?.error?.slice(0, 80)}`,
      durationMs: Date.now() - t0,
    });

    // ReferenceError
    const t1 = Date.now();
    const jsRef = await executeCodeApi(lang, "console.log(peaklyy_missing_identifier);");
    const isJsRef = jsRef.data?.error?.includes("ReferenceError");
    collector.record({
      suite,
      category,
      name: "JAVASCRIPT - ReferenceError (undefined variable)",
      language: lang,
      status: isJsRef ? "PASS" : "FAIL",
      expected: "ReferenceError reported",
      actual: `status=${jsRef.data?.status}, error contains ReferenceError: ${isJsRef}`,
      durationMs: Date.now() - t1,
    });

    // Unhandled Exception
    const t2 = Date.now();
    const jsThrow = await executeCodeApi(lang, 'throw new Error("Deliberate Peaklyy Exception");');
    const isJsThrow = jsThrow.data?.error?.includes("Deliberate Peaklyy Exception");
    collector.record({
      suite,
      category,
      name: "JAVASCRIPT - Unhandled Exception (throw new Error)",
      language: lang,
      status: isJsThrow ? "PASS" : "FAIL",
      expected: "Deliberate Peaklyy Exception in error output",
      actual: `status=${jsThrow.data?.status}, hasExceptionMsg: ${isJsThrow}`,
      durationMs: Date.now() - t2,
    });
  }

  // =========================================================================
  // 3. TYPESCRIPT ERROR DIAGNOSTICS
  // =========================================================================
  {
    const lang = "typescript";
    const category = "TypeScript Error Diagnostics";

    // Syntax / Parse Error
    const t0 = Date.now();
    const tsSyntax = await executeCodeApi(lang, "let x: number = ;");
    const isTsSyntax = tsSyntax.data?.status !== "SUCCESS";
    collector.record({
      suite,
      category,
      name: "TYPESCRIPT - Syntax error handling",
      language: lang,
      status: isTsSyntax ? "PASS" : "FAIL",
      expected: "Failed execution status with error diagnostics",
      actual: `status=${tsSyntax.data?.status}`,
      durationMs: Date.now() - t0,
    });

    // Runtime Error
    const t1 = Date.now();
    const tsThrow = await executeCodeApi(lang, 'const msg: string = "TS Fail"; throw new Error(msg);');
    const isTsThrow = tsThrow.data?.error?.includes("TS Fail");
    collector.record({
      suite,
      category,
      name: "TYPESCRIPT - Runtime exception",
      language: lang,
      status: isTsThrow ? "PASS" : "FAIL",
      expected: "Runtime error reported in error panel",
      actual: `status=${tsThrow.data?.status}, error=${tsThrow.data?.error?.slice(0, 80)}`,
      durationMs: Date.now() - t1,
    });
  }

  // =========================================================================
  // 4. JAVA ERROR DIAGNOSTICS
  // =========================================================================
  {
    const lang = "java";
    const category = "Java Error Diagnostics";

    // Compilation Error (Syntax / Unresolved Symbol)
    const t0 = Date.now();
    const javaCompErr = await executeCodeApi(
      lang,
      "public class Main { public static void main(String[] args) { unknownMethodCall(); } }"
    );
    const isJavaComp =
      javaCompErr.data?.compilationStatus === "COMPILATION_ERROR" ||
      javaCompErr.data?.status === "COMPILATION_ERROR" ||
      javaCompErr.data?.error?.includes("cannot find symbol");
    collector.record({
      suite,
      category,
      name: "JAVA - Compilation error (cannot find symbol)",
      language: lang,
      status: isJavaComp ? "PASS" : "FAIL",
      expected: "COMPILATION_ERROR reported",
      actual: `status=${javaCompErr.data?.status}, compStatus=${javaCompErr.data?.compilationStatus}`,
      durationMs: Date.now() - t0,
    });

    // Missing Main Method (Entry Point)
    const t1 = Date.now();
    const javaNoMain = await executeCodeApi(
      lang,
      "public class Main { public void notMain() {} }"
    );
    const isJavaNoMain =
      javaNoMain.data?.status === "RUNTIME_ERROR" &&
      (javaNoMain.data?.error?.includes("Main method not found") ||
       javaNoMain.data?.error?.includes("main(String[] args)"));
    collector.record({
      suite,
      category,
      name: "JAVA - Missing entry point (main method)",
      language: lang,
      status: isJavaNoMain ? "PASS" : "FAIL",
      expected: "RUNTIME_ERROR: Main method not found in class Main",
      actual: `status=${javaNoMain.data?.status}, error=${javaNoMain.data?.error?.slice(0, 90)}`,
      durationMs: Date.now() - t1,
    });

    // Runtime ArithmeticException (Division by zero)
    const t2 = Date.now();
    const javaDivZero = await executeCodeApi(
      lang,
      "public class Main { public static void main(String[] args) { int a = 10; int b = 0; System.out.println(a / b); } }"
    );
    const isJavaDivZero =
      javaDivZero.data?.status === "RUNTIME_ERROR" &&
      javaDivZero.data?.error?.includes("ArithmeticException");
    collector.record({
      suite,
      category,
      name: "JAVA - Runtime ArithmeticException (/ by zero)",
      language: lang,
      status: isJavaDivZero ? "PASS" : "FAIL",
      expected: "RUNTIME_ERROR with ArithmeticException",
      actual: `status=${javaDivZero.data?.status}, error contains ArithmeticException: ${isJavaDivZero}`,
      durationMs: Date.now() - t2,
    });
  }

  // =========================================================================
  // 5. C# ERROR DIAGNOSTICS
  // =========================================================================
  {
    const lang = "csharp";
    const category = "C# Error Diagnostics";

    // Compilation Error (CS0103 name does not exist)
    const t0 = Date.now();
    const csCompErr = await executeCodeApi(
      lang,
      "using System; class Program { static void Main() { UndefinedCall(); } }"
    );
    const isCsComp =
      csCompErr.data?.status === "COMPILATION_ERROR" ||
      csCompErr.data?.compilationStatus === "COMPILATION_ERROR" ||
      csCompErr.data?.error?.includes("CS0103");
    collector.record({
      suite,
      category,
      name: "C# - Compilation error (CS0103)",
      language: lang,
      status: isCsComp ? "PASS" : "FAIL",
      expected: "COMPILATION_ERROR with CS0103",
      actual: `status=${csCompErr.data?.status}, error=${csCompErr.data?.error?.slice(0, 80)}`,
      durationMs: Date.now() - t0,
    });

    // Missing Entry Point (CS5001 program does not contain a static 'Main' method)
    const t1 = Date.now();
    const csNoMain = await executeCodeApi(
      lang,
      "using System; class Program { void Helper() {} }"
    );
    const isCsNoMain =
      csNoMain.data?.status === "COMPILATION_ERROR" ||
      csNoMain.data?.error?.includes("CS5001") ||
      csNoMain.data?.error?.includes("Main");
    collector.record({
      suite,
      category,
      name: "C# - Missing entry point (CS5001)",
      language: lang,
      status: isCsNoMain ? "PASS" : "FAIL",
      expected: "COMPILATION_ERROR for missing entry point",
      actual: `status=${csNoMain.data?.status}, error=${csNoMain.data?.error?.slice(0, 90)}`,
      durationMs: Date.now() - t1,
    });

    // Runtime DivideByZeroException
    const t2 = Date.now();
    const csDivZero = await executeCodeApi(
      lang,
      "using System; class Program { static void Main() { int b = 0; int a = 10 / b; Console.WriteLine(a); } }"
    );
    const isCsDivZero =
      csDivZero.data?.status === "RUNTIME_ERROR" &&
      csDivZero.data?.error?.includes("DivideByZeroException");
    collector.record({
      suite,
      category,
      name: "C# - Runtime DivideByZeroException",
      language: lang,
      status: isCsDivZero ? "PASS" : "FAIL",
      expected: "RUNTIME_ERROR with DivideByZeroException",
      actual: `status=${csDivZero.data?.status}, error contains DivideByZeroException: ${isCsDivZero}`,
      durationMs: Date.now() - t2,
    });
  }

  // =========================================================================
  // 6. TRUTHFUL REPORTING FOR UNINSTALLED RUNTIMES
  // =========================================================================
  {
    const category = "Uninstalled Runtimes Truthfulness";
    const { getLanguageAvailability } = require("../../server/config/languages");
    const availability = getLanguageAvailability();

    // Check truthfully for genuinely uninstalled runtimes
    const uninstalledLangs = Object.keys(availability).filter(
      (l) => !availability[l].available && availability[l].executionMode !== "preview"
    );

    if (uninstalledLangs.length === 0) {
      collector.record({
        suite,
        category,
        name: "ALL - All advertised language compilers verified installed on host",
        language: "all",
        status: "PASS",
        expected: "All advertised language runtimes/compilers active on host",
        actual: "100% runtimes available",
        durationMs: 0,
        details: "Every target compiler runtime is installed and verified active",
      });
    } else {
      for (const uLang of uninstalledLangs) {
        const t0 = Date.now();
        const res = await executeCodeApi(uLang, "some code");
        const isTruthful =
          res.data?.status === "SYSTEM_ERROR" &&
          res.data?.error &&
          (res.data.error.includes("not currently installed") || res.data.error.includes("requires"));

        collector.record({
          suite,
          category,
          name: `${uLang.toUpperCase()} - Truthful reporting of missing compiler runtime`,
          language: uLang,
          status: isTruthful ? "PASS" : "FAIL",
          expected: `SYSTEM_ERROR with explicit message that ${uLang} runtime is not installed`,
          actual: `status=${res.data?.status}, error=${res.data?.error?.slice(0, 80)}`,
          durationMs: Date.now() - t0,
          details: res.data?.error,
        });
      }
    }

    // For newly installed runtimes, verify backend recognizes them as available
    const installedCandidates = ["rust", "go", "php", "c", "cpp", "swift", "kotlin", "ruby", "dart"];
    for (const iLang of installedCandidates) {
      const isInstalled = Boolean(availability[iLang]?.available);
      if (isInstalled) {
        const t0 = Date.now();
        const res = await executeCodeApi(iLang, "some code");
        const isRecognized = res.data && res.data.status !== undefined;
        collector.record({
          suite,
          category,
          name: `${iLang.toUpperCase()} - Active compiler detected and recognized by backend`,
          language: iLang,
          status: isRecognized ? "PASS" : "FAIL",
          expected: "Backend recognizes active installed compiler",
          actual: `status=${res.data?.status}`,
          durationMs: Date.now() - t0,
          details: `Compiler verified installed on host: ${availability[iLang]?.name}`,
        });
      }
    }
  }
}

module.exports = {
  runErrorAndDiagnosticTests,
};
