/**
 * Suite 7: Concurrent Executions and Workspace Isolation
 * 
 * Verifies that concurrent execution requests across multiple languages
 * do not leak standard input, cross-contaminate output, or corrupt
 * sibling processes during failures.
 */

const { executeCodeApi } = require("../helpers/apiClient");

async function runConcurrencyAndIsolationTests(collector) {
  const suite = "Concurrency & Isolation Tests";
  const category = "Multi-Process Isolation";

  // 1. Cross-Language Concurrent Burst with Unique Tokens
  {
    const t0 = Date.now();
    const tokenPy = `PY_CONCURRENT_${Date.now()}_A`;
    const tokenJs = `JS_CONCURRENT_${Date.now()}_B`;
    const tokenTs = `TS_CONCURRENT_${Date.now()}_C`;
    const tokenJava = `JAVA_CONCURRENT_${Date.now()}_D`;
    const tokenCs = `CS_CONCURRENT_${Date.now()}_E`;

    const tasks = [
      executeCodeApi("python", `print("${tokenPy}")`),
      executeCodeApi("javascript", `console.log("${tokenJs}");`),
      executeCodeApi("typescript", `const t: string = "${tokenTs}"; console.log(t);`),
      executeCodeApi("java", `public class Main { public static void main(String[] args) { System.out.println("${tokenJava}"); } }`),
      executeCodeApi("csharp", `using System; class Program { static void Main() { Console.WriteLine("${tokenCs}"); } }`),
    ];

    const results = await Promise.all(tasks);
    const duration = Date.now() - t0;

    const [resPy, resJs, resTs, resJava, resCs] = results;

    const pyOk = resPy.data?.output?.includes(tokenPy) && !resPy.data?.output?.includes(tokenJs);
    const jsOk = resJs.data?.output?.includes(tokenJs) && !resJs.data?.output?.includes(tokenPy);
    const tsOk = resTs.data?.output?.includes(tokenTs) && !resTs.data?.output?.includes(tokenJs);
    const javaOk = resJava.data?.output?.includes(tokenJava) && !resJava.data?.output?.includes(tokenPy);
    const csOk = resCs.data?.output?.includes(tokenCs) && !resCs.data?.output?.includes(tokenJava);

    const allIsolated = pyOk && jsOk && tsOk && javaOk && csOk;

    collector.record({
      suite,
      category,
      name: "CONCURRENCY - Multi-language concurrent execution with distinct token isolation",
      language: "multi",
      status: allIsolated ? "PASS" : "FAIL",
      expected: "5 concurrent requests across 5 languages complete with zero cross-contamination",
      actual: allIsolated ? "All outputs strictly isolated" : "Cross-leakage or failure observed",
      durationMs: duration,
      details: `Outputs: Py=${pyOk}, Js=${jsOk}, Ts=${tsOk}, Java=${javaOk}, Cs=${csOk}`,
    });
  }

  // 2. Concurrent Stdin Isolation
  {
    const t0 = Date.now();
    const inputA = "SECRET_INPUT_ALPHA_111";
    const inputB = "SECRET_INPUT_BETA_222";

    const tasks = [
      executeCodeApi("python", "val = input()\nprint(f'ECHO: {val}')", inputA),
      executeCodeApi("python", "val = input()\nprint(f'ECHO: {val}')", inputB),
    ];

    const [resA, resB] = await Promise.all(tasks);
    const duration = Date.now() - t0;

    const aClean =
      resA.data?.output?.includes(inputA) && !resA.data?.output?.includes(inputB);
    const bClean =
      resB.data?.output?.includes(inputB) && !resB.data?.output?.includes(inputA);

    collector.record({
      suite,
      category,
      name: "CONCURRENCY - Concurrent stdin streams do not leak across sibling executions",
      language: "python",
      status: aClean && bClean ? "PASS" : "FAIL",
      expected: "Stream A receives inputA only, Stream B receives inputB only",
      actual: aClean && bClean ? "Stdin strictly isolated" : "Stdin leak detected",
      durationMs: duration,
    });
  }

  // 3. Failure Fault-Isolation Under Concurrency
  {
    const t0 = Date.now();
    const validToken = "STABLE_CONCURRENT_VALID_OUTPUT";

    const tasks = [
      // Task 1: Deliberate division by zero runtime crash
      executeCodeApi("python", "1 / 0"),
      // Task 2: Deliberate syntax error
      executeCodeApi("python", "def broken("),
      // Task 3: Normal valid execution that must succeed unhindered
      executeCodeApi("python", `print("${validToken}")`),
      // Task 4: Normal valid execution in Node
      executeCodeApi("javascript", 'console.log("NODE_STABLE");'),
    ];

    const [resDivZero, resSyntax, resValidPy, resValidJs] = await Promise.all(tasks);
    const duration = Date.now() - t0;

    const pyCrashedProperly = resDivZero.data?.status === "RUNTIME_ERROR";
    const syntaxFailedProperly =
      resSyntax.data?.status === "COMPILATION_ERROR" || resSyntax.data?.status === "RUNTIME_ERROR";
    const validPySucceeded =
      resValidPy.data?.status === "SUCCESS" && resValidPy.data?.output?.includes(validToken);
    const validJsSucceeded =
      resValidJs.data?.status === "SUCCESS" && resValidJs.data?.output?.includes("NODE_STABLE");

    const isFaultIsolated =
      pyCrashedProperly && syntaxFailedProperly && validPySucceeded && validJsSucceeded;

    collector.record({
      suite,
      category,
      name: "CONCURRENCY - Error and crash in one execution does not corrupt concurrent healthy runs",
      language: "multi",
      status: isFaultIsolated ? "PASS" : "FAIL",
      expected: "Crashes contained to originating process; healthy processes succeed",
      actual: isFaultIsolated ? "Strict fault isolation verified" : "Corruption detected",
      durationMs: duration,
    });
  }

  // 4. Burst Concurrency Load (8 parallel requests)
  {
    const t0 = Date.now();
    const burstCount = 8;
    const tasks = [];
    for (let i = 0; i < burstCount; i++) {
      tasks.push(executeCodeApi("python", `print("BURST_RUN_${i}")`));
    }

    const results = await Promise.all(tasks);
    const duration = Date.now() - t0;

    const allSuccessful = results.every(
      (r, idx) => r.data?.status === "SUCCESS" && r.data?.output?.includes(`BURST_RUN_${idx}`)
    );

    collector.record({
      suite,
      category,
      name: "CONCURRENCY - Burst load of 8 parallel requests all complete successfully",
      language: "python",
      status: allSuccessful ? "PASS" : "FAIL",
      expected: "8/8 parallel runs succeed with correct matching outputs",
      actual: `${results.filter((r) => r.data?.status === "SUCCESS").length}/${burstCount} succeeded`,
      durationMs: duration,
    });
  }

  // 5. Concurrent Native Compilation Matrix (C, C++, Go, Rust)
  {
    const t0 = Date.now();
    const tokenC = `C_NATIVE_${Date.now()}`;
    const tokenCpp = `CPP_NATIVE_${Date.now()}`;
    const tokenGo = `GO_NATIVE_${Date.now()}`;
    const tokenRust = `RUST_NATIVE_${Date.now()}`;

    const tasks = [
      executeCodeApi("c", `#include <stdio.h>\nint main(){ printf("${tokenC}\\n"); return 0; }`),
      executeCodeApi("cpp", `#include <iostream>\nint main(){ std::cout << "${tokenCpp}\\n"; return 0; }`),
      executeCodeApi("go", `package main\nimport "fmt"\nfunc main(){ fmt.Println("${tokenGo}") }`),
      executeCodeApi("rust", `fn main(){ println!("${tokenRust}"); }`),
    ];

    const [resC, resCpp, resGo, resRust] = await Promise.all(tasks);
    const duration = Date.now() - t0;

    const cOk = resC.data?.output?.includes(tokenC);
    const cppOk = resCpp.data?.output?.includes(tokenCpp);
    const goOk = resGo.data?.output?.includes(tokenGo);
    const rustOk = resRust.data?.output?.includes(tokenRust);
    const allNativeOk = cOk && cppOk && goOk && rustOk;

    collector.record({
      suite,
      category,
      name: "CONCURRENCY - Concurrent native compilation across C, C++, Go, and Rust without artifact collision",
      language: "multi",
      status: allNativeOk ? "PASS" : "FAIL",
      expected: "All 4 native compilers build and execute concurrently in isolated workspaces",
      actual: allNativeOk ? "Clean concurrent compilation across all native runtimes" : `Failures: C=${cOk}, CPP=${cppOk}, GO=${goOk}, RUST=${rustOk}`,
      durationMs: duration,
      details: `C=${cOk}, CPP=${cppOk}, GO=${goOk}, RUST=${rustOk}`,
    });
  }
}

module.exports = {
  runConcurrencyAndIsolationTests,
};
