/**
 * Peaklyy Forge - Centralized Programming Language Definitions (P0 Only)
 * 
 * Defines metadata, file mappings, starter templates, and Monaco syntax bindings
 * for all compiler-supported and target languages.
 */

export const languageMeta = {
  python: {
    label: "Python",
    extension: "py",
    defaultFileName: "main.py",
    monacoLang: "python",
    badgeColor: "#387eb8",
    category: "general",
    isExecutable: true,
  },
  java: {
    label: "Java",
    extension: "java",
    defaultFileName: "Main.java",
    monacoLang: "java",
    badgeColor: "#e76f00",
    category: "general",
    isExecutable: true,
  },
  c: {
    label: "C",
    extension: "c",
    defaultFileName: "main.c",
    monacoLang: "c",
    badgeColor: "#a8b9cc",
    category: "systems",
    isExecutable: true,
  },
  cpp: {
    label: "C++",
    extension: "cpp",
    defaultFileName: "main.cpp",
    monacoLang: "cpp",
    badgeColor: "#00599c",
    category: "systems",
    isExecutable: true,
  },
  javascript: {
    label: "JavaScript",
    extension: "js",
    defaultFileName: "main.js",
    monacoLang: "javascript",
    badgeColor: "#f7df1e",
    category: "web",
    isExecutable: true,
  },
  typescript: {
    label: "TypeScript",
    extension: "ts",
    defaultFileName: "main.ts",
    monacoLang: "typescript",
    badgeColor: "#3178c6",
    category: "web",
    isExecutable: true,
  },
  csharp: {
    label: "C#",
    extension: "cs",
    defaultFileName: "Program.cs",
    monacoLang: "csharp",
    badgeColor: "#239120",
    category: "general",
    isExecutable: true,
  },
  go: {
    label: "Go",
    extension: "go",
    defaultFileName: "main.go",
    monacoLang: "go",
    badgeColor: "#00add8",
    category: "systems",
    isExecutable: true,
  },
  rust: {
    label: "Rust",
    extension: "rs",
    defaultFileName: "main.rs",
    monacoLang: "rust",
    badgeColor: "#dea584",
    category: "systems",
    isExecutable: true,
  },
  php: {
    label: "PHP",
    extension: "php",
    defaultFileName: "main.php",
    monacoLang: "php",
    badgeColor: "#777bb4",
    category: "web",
    isExecutable: true,
  },
  kotlin: {
    label: "Kotlin",
    extension: "kt",
    defaultFileName: "Main.kt",
    monacoLang: "kotlin",
    badgeColor: "#7f52ff",
    category: "mobile",
    isExecutable: true,
  },
  swift: {
    label: "Swift",
    extension: "swift",
    defaultFileName: "main.swift",
    monacoLang: "swift",
    badgeColor: "#f05138",
    category: "mobile",
    isExecutable: true,
  },
  ruby: {
    label: "Ruby",
    extension: "rb",
    defaultFileName: "main.rb",
    monacoLang: "ruby",
    badgeColor: "#cc342d",
    category: "general",
    isExecutable: true,
  },
  dart: {
    label: "Dart",
    extension: "dart",
    defaultFileName: "main.dart",
    monacoLang: "dart",
    badgeColor: "#0175c2",
    category: "mobile",
    isExecutable: true,
  },
  html: {
    label: "HTML",
    extension: "html",
    defaultFileName: "index.html",
    monacoLang: "html",
    badgeColor: "#e44d26",
    category: "markup",
    isPreview: true,
  },
  css: {
    label: "CSS",
    extension: "css",
    defaultFileName: "style.css",
    monacoLang: "css",
    badgeColor: "#264de4",
    category: "markup",
    isPreview: true,
  },
};

/**
 * List of target languages in LeetCode-inspired ordering for multi-column grid
 */
export const TARGET_LANGUAGES = [
  "python",
  "java",
  "c",
  "cpp",
  "javascript",
  "typescript",
  "csharp",
  "go",
  "rust",
  "php",
  "kotlin",
  "swift",
  "ruby",
  "dart",
  "html",
  "css",
];

/**
 * Languages with verified, working execution runtimes on this machine
 */
export const RUNNABLE_LANGUAGES = [
  "python",
  "java",
  "c",
  "cpp",
  "javascript",
  "typescript",
  "csharp",
  "go",
  "rust",
  "php",
  "kotlin",
  "swift",
  "ruby",
  "dart",
  "html",
  "css",
];

export const starterCode = {
  python: `def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()
`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
  c: `#include <stdio.h>

int main(void) {
    printf("Hello, World!\\n");
    return 0;
}
`,
  cpp: `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
`,
  javascript: `function main() {
    console.log("Hello, World!");
}

main();
`,
  typescript: `function main(): void {
    const greeting: string = "Hello, World!";
    console.log(greeting);
}

main();
`,
  csharp: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
    }
}
`,
  go: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
`,
  rust: `fn main() {
    println!("Hello, World!");
}
`,
  php: `<?php
echo "Hello, World!\\n";
`,
  kotlin: `fun main() {
    println("Hello, World!")
}
`,
  swift: `import Foundation

print("Hello, World!")
`,
  ruby: `def main
  puts "Hello, World!"
end

main
`,
  dart: `void main() {
  print('Hello, World!');
}
`,
  html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Peaklyy Forge</title>
</head>
<body>

    <h1>Hello, World!</h1>

</body>
</html>
`,
  css: `body {
    margin: 0;
    font-family: Arial, sans-serif;
}

h1 {
    color: #ff3b4a;
}
`,
};

/**
 * Helper to determine Monaco editor syntax / language identifier from a file name.
 */
export const getFileLanguage = (fileName = "", defaultLang = "python") => {
  if (!fileName || typeof fileName !== "string") return defaultLang || "plaintext";
  const hasExt = fileName.includes(".") && !fileName.endsWith(".");
  if (!hasExt) return defaultLang || "plaintext";
  const ext = fileName.split(".").pop().toLowerCase();
  switch (ext) {
    case "py":
      return "python";
    case "java":
      return "java";
    case "c":
    case "h":
      return "c";
    case "cpp":
    case "cc":
    case "cxx":
    case "hpp":
      return "cpp";
    case "js":
    case "mjs":
    case "cjs":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "cs":
      return "csharp";
    case "go":
      return "go";
    case "rs":
      return "rust";
    case "php":
      return "php";
    case "kt":
    case "kts":
      return "kotlin";
    case "swift":
      return "swift";
    case "rb":
      return "ruby";
    case "dart":
      return "dart";
    case "html":
    case "htm":
      return "html";
    case "css":
      return "css";
    case "json":
      return "json";
    case "md":
      return "markdown";
    case "sql":
      return "sql";
    default:
      return "plaintext";
  }
};

export const initialOutput = {
  status: "IDLE",
  output: "Your program output will appear here.",
  error: null,
  executionTime: null,
  memoryUsage: null,
  exitCode: null,
  type: "idle",
  value: "Your program output will appear here.",
};
