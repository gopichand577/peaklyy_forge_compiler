/**
 * Suite 8: Preview Languages and Editor Alignment Verification
 * 
 * Verifies HTML/CSS preview execution semantics, starter template
 * execution against the real backend, and language-to-extension mappings.
 */

const { executeCodeApi } = require("../helpers/apiClient");
const { LANGUAGE_CONFIG } = require("../../server/config/languages");

async function runPreviewAndEditorTests(collector) {
  const suite = "Preview Languages & Editor Alignment Tests";

  // 1. HTML Preview Behavior
  {
    const category = "Preview Language Semantics";
    const t0 = Date.now();
    const htmlCode = "<!DOCTYPE html><html><body><h1>Peaklyy Live Preview</h1></body></html>";
    const res = await executeCodeApi("html", htmlCode);
    const isPreviewHandled =
      res.data?.status === "SUCCESS" &&
      res.data?.output?.includes("rendered successfully in live preview");

    collector.record({
      suite,
      category,
      name: "HTML - Preview language returns live preview status without compiler execution",
      language: "html",
      status: isPreviewHandled ? "PASS" : "FAIL",
      expected: "status: SUCCESS, output contains live preview notification",
      actual: `status=${res.data?.status}, output=${res.data?.output}`,
      durationMs: Date.now() - t0,
    });
  }

  // 2. CSS Preview Behavior
  {
    const category = "Preview Language Semantics";
    const t0 = Date.now();
    const cssCode = "body { background: #121212; color: #ff3b4a; }";
    const res = await executeCodeApi("css", cssCode);
    const isPreviewHandled =
      res.data?.status === "SUCCESS" &&
      res.data?.output?.includes("rendered successfully in live preview");

    collector.record({
      suite,
      category,
      name: "CSS - Preview language returns live preview status without compiler execution",
      language: "css",
      status: isPreviewHandled ? "PASS" : "FAIL",
      expected: "status: SUCCESS, output contains live preview notification",
      actual: `status=${res.data?.status}, output=${res.data?.output}`,
      durationMs: Date.now() - t0,
    });
  }

  // 3. Runnable Starter Codes Real Backend Verification
  {
    const category = "Starter Template Execution Verification";
    const activeLanguages = [
      {
        lang: "python",
        code: 'def main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()\n',
      },
      {
        lang: "javascript",
        code: 'function main() {\n    console.log("Hello, World!");\n}\n\nmain();\n',
      },
      {
        lang: "typescript",
        code: 'function main(): void {\n    const greeting: string = "Hello, World!";\n    console.log(greeting);\n}\n\nmain();\n',
      },
      {
        lang: "java",
        code: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n',
      },
      {
        lang: "csharp",
        code: 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}\n',
      },
      {
        lang: "c",
        code: '#include <stdio.h>\n\nint main(void) {\n    printf("Hello, World!\\n");\n    return 0;\n}\n',
      },
      {
        lang: "cpp",
        code: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}\n',
      },
      {
        lang: "go",
        code: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n',
      },
      {
        lang: "rust",
        code: 'fn main() {\n    println!("Hello, World!");\n}\n',
      },
      {
        lang: "php",
        code: '<?php\necho "Hello, World!\\n";\n',
      },
      {
        lang: "kotlin",
        code: 'fun main() {\n    println("Hello, World!")\n}\n',
      },
      {
        lang: "ruby",
        code: 'def main\n  puts "Hello, World!"\nend\n\nmain\n',
      },
      {
        lang: "dart",
        code: 'void main() {\n  print("Hello, World!");\n}\n',
      },
    ];

    for (const item of activeLanguages) {
      const t0 = Date.now();
      const res = await executeCodeApi(item.lang, item.code);
      const isOk =
        res.data?.status === "SUCCESS" &&
        res.data?.output?.trim().includes("Hello, World!");

      collector.record({
        suite,
        category,
        name: `${item.lang.toUpperCase()} - Default starter code executes and prints 'Hello, World!'`,
        language: item.lang,
        status: isOk ? "PASS" : "FAIL",
        expected: "status: SUCCESS with output 'Hello, World!'",
        actual: `status=${res.data?.status}, output=${res.data?.output?.trim()}`,
        durationMs: Date.now() - t0,
      });
    }
  }

  // 4. File Extension and Default Filename Mapping Consistency
  {
    const category = "File System & Template Mapping";
    const expectedMappings = {
      python: { ext: "py", file: "main.py" },
      java: { ext: "java", file: "Main.java" },
      c: { ext: "c", file: "main.c" },
      cpp: { ext: "cpp", file: "main.cpp" },
      javascript: { ext: "js", file: "main.js" },
      typescript: { ext: "ts", file: "main.ts" },
      csharp: { ext: "cs", file: "Program.cs" },
      go: { ext: "go", file: "main.go" },
      rust: { ext: "rs", file: "main.rs" },
      php: { ext: "php", file: "main.php" },
      kotlin: { ext: "kt", file: "Main.kt" },
      swift: { ext: "swift", file: "main.swift" },
      ruby: { ext: "rb", file: "main.rb" },
      dart: { ext: "dart", file: "main.dart" },
      html: { ext: "html", file: "index.html" },
      css: { ext: "css", file: "style.css" },
    };

    for (const [lang, map] of Object.entries(expectedMappings)) {
      const t0 = Date.now();
      const srv = LANGUAGE_CONFIG[lang];
      const isConsistent =
        srv && srv.extension === map.ext && srv.defaultFileName === map.file;

      collector.record({
        suite,
        category,
        name: `${lang.toUpperCase()} - Extension (.${map.ext}) and default file (${map.file}) alignment`,
        language: lang,
        status: isConsistent ? "PASS" : "FAIL",
        expected: `ext=${map.ext}, file=${map.file}`,
        actual: srv ? `ext=${srv.extension}, file=${srv.defaultFileName}` : "Missing config",
        durationMs: Date.now() - t0,
      });
    }
  }
}

module.exports = {
  runPreviewAndEditorTests,
};
