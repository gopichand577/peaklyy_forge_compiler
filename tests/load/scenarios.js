/**
 * Peaklyy Forge - Load Testing Scenarios & Payloads
 * 
 * Provides deterministic programs with expected outputs across:
 * - Browsing & API endpoints
 * - Interpreted languages (Python, JavaScript, Ruby, PHP)
 * - Compiled languages (C, C++, Go, Java, C#, Rust)
 * - Single-line and multiline stdin streaming
 * - Multi-test cases (T=3) in single execution
 * - Edge cases (Syntax errors, Runtime errors, Timeouts)
 */

const SCENARIOS = {
  // 1. Browsing and Language Selection
  browsing: [
    {
      type: "get",
      url: "/api/compiler/languages",
      validate: (data) => data.success === true && Array.isArray(data.languages) && data.languages.length >= 15,
      description: "Fetch language registry and real runtime availability",
    },
    {
      type: "get",
      url: "/api/health",
      validate: (data) => data.status === "OK",
      description: "Backend health check",
    },
    {
      type: "get",
      url: "/api/compiler/stats",
      validate: (data) => data.success === true && data.queue && typeof data.queue.activeWorkers === "number",
      description: "Queue status telemetry",
    },
  ],

  // 2. Interpreted Language Execution
  interpreted: [
    {
      name: "python_interpreted",
      language: "python",
      code: "print('Python VU Load OK')",
      input: "",
      expectedOutput: "Python VU Load OK",
      expectedStatus: "SUCCESS",
    },
    {
      name: "javascript_interpreted",
      language: "javascript",
      code: "console.log('JS VU Load OK');",
      input: "",
      expectedOutput: "JS VU Load OK",
      expectedStatus: "SUCCESS",
    },
    {
      name: "ruby_interpreted",
      language: "ruby",
      code: "puts 'Ruby VU Load OK'",
      input: "",
      expectedOutput: "Ruby VU Load OK",
      expectedStatus: "SUCCESS",
    },
    {
      name: "php_interpreted",
      language: "php",
      code: "<?php echo 'PHP VU Load OK'; ?>",
      input: "",
      expectedOutput: "PHP VU Load OK",
      expectedStatus: "SUCCESS",
    },
  ],

  // 3. Compiled Language Execution
  compiled: [
    {
      name: "c_compiled",
      language: "c",
      code: "#include <stdio.h>\nint main(){ printf(\"C VU Load OK\\n\"); return 0; }",
      input: "",
      expectedOutput: "C VU Load OK",
      expectedStatus: "SUCCESS",
    },
    {
      name: "cpp_compiled",
      language: "cpp",
      code: "#include <iostream>\nint main(){ std::cout << \"CPP VU Load OK\\n\"; return 0; }",
      input: "",
      expectedOutput: "CPP VU Load OK",
      expectedStatus: "SUCCESS",
    },
    {
      name: "go_compiled",
      language: "go",
      code: "package main\nimport \"fmt\"\nfunc main(){ fmt.Println(\"Go VU Load OK\") }",
      input: "",
      expectedOutput: "Go VU Load OK",
      expectedStatus: "SUCCESS",
    },
    {
      name: "java_compiled",
      language: "java",
      code: "public class Main { public static void main(String[] args) { System.out.println(\"Java VU Load OK\"); } }",
      input: "",
      expectedOutput: "Java VU Load OK",
      expectedStatus: "SUCCESS",
    },
    {
      name: "csharp_compiled",
      language: "csharp",
      code: "using System; class Program { static void Main() { Console.WriteLine(\"CSharp VU Load OK\"); } }",
      input: "",
      expectedOutput: "CSharp VU Load OK",
      expectedStatus: "SUCCESS",
    },
  ],

  // 4. Stdin Input Streaming (Single-line & Multiline)
  stdinStreaming: [
    {
      name: "stdin_single_line",
      language: "python",
      code: "import sys\nline = sys.stdin.readline().strip()\nprint(f'Echo: {line}')",
      input: "PeaklyyConcurrencyTest_42",
      expectedOutput: "Echo: PeaklyyConcurrencyTest_42",
      expectedStatus: "SUCCESS",
    },
    {
      name: "stdin_multiline_sum",
      language: "python",
      code: "import sys\nnums = [int(x) for x in sys.stdin.read().split()]\nprint(sum(nums))",
      input: "10\n25\n35\n50",
      expectedOutput: "120",
      expectedStatus: "SUCCESS",
    },
    {
      name: "stdin_cpp_multi_token",
      language: "cpp",
      code: "#include <iostream>\nint main(){ int a, b; if(std::cin >> a >> b) std::cout << (a * b) << std::endl; return 0; }",
      input: "7 8",
      expectedOutput: "56",
      expectedStatus: "SUCCESS",
    },
  ],

  // 5. Multiple Test Cases in One Execution (T=3)
  multiTestCases: [
    {
      name: "multi_cases_python_t3",
      language: "python",
      code: "import sys\nlines = sys.stdin.read().split()\nif lines:\n    T = int(lines[0])\n    idx = 1\n    for _ in range(T):\n        a, b = int(lines[idx]), int(lines[idx+1])\n        print(a + b)\n        idx += 2",
      input: "3\n10 20\n5 15\n100 200",
      expectedOutput: "30\n20\n300",
      expectedStatus: "SUCCESS",
    },
    {
      name: "multi_cases_c_t3",
      language: "c",
      code: "#include <stdio.h>\nint main(){\n    int t; if(scanf(\"%d\", &t) != 1) return 0;\n    while(t--){\n        int a, b; scanf(\"%d %d\", &a, &b);\n        printf(\"%d\\n\", a + b);\n    }\n    return 0;\n}",
      input: "3\n10 20\n5 15\n100 200",
      expectedOutput: "30\n20\n300",
      expectedStatus: "SUCCESS",
    },
  ],

  // 6. Mixed Edge Cases (Errors, Exceptions, Timeouts)
  edgeCases: [
    {
      name: "syntax_error_python",
      language: "python",
      code: "def invalid_syntax(: pass",
      input: "",
      expectedStatus: "COMPILATION_ERROR",
      isExpectedFailure: true,
      errorContains: "SyntaxError",
    },
    {
      name: "runtime_error_div_zero",
      language: "python",
      code: "x = 42 / 0",
      input: "",
      expectedStatus: "RUNTIME_ERROR",
      isExpectedFailure: true,
      errorContains: "ZeroDivisionError",
    },
    {
      name: "timeout_bounded",
      language: "python",
      code: "import time\ntime.sleep(15)",
      input: "",
      expectedStatus: "TIME_LIMIT_EXCEEDED",
      isExpectedFailure: true,
    },
  ],
};

module.exports = {
  SCENARIOS,
};
