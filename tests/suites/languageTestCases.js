/**
 * Peaklyy Forge - Comprehensive Multi-Language Valid Program Matrix
 * 
 * Provides deterministic programs for all 13 active languages:
 * - Minimal execution
 * - Multiline stdout
 * - Empty stdout
 * - Unicode & special characters
 * - Large output (100 lines)
 * - Standard input: single line, multiple values, multiline, whitespace preservation
 * - Section 5: Multiple independent test cases in one execution (T=3, T=1)
 * - Section 8: Algorithmic edge cases (sorting, recursion)
 */

const LANGUAGE_TEST_CASES = {
  python: {
    minimal: { code: 'print("Hello Peaklyy")', expectedOutput: "Hello Peaklyy" },
    multiLine: { code: 'print("Alpha")\nprint("Beta")\nprint("Gamma")', expectedOutput: "Alpha\nBeta\nGamma" },
    emptyOutput: { code: "pass", expectedOutput: "" },
    unicode: { code: 'print("Hello 🚀 Γειά σου κόσμε 日本語 ñoño")', expectedOutput: "Hello 🚀 Γειά σου κόσμε 日本語 ñoño" },
    specialChars: { code: 'print("Quote: \\", Backslash: \\\\, Tab: [\\t], Braces: {a: 1}")', expectedOutput: 'Quote: ", Backslash: \\, Tab: [\t], Braces: {a: 1}' },
    largeOutput: { code: 'for i in range(1, 101):\n    print(f"Line {i}")', verifier: (out) => out.includes("Line 1") && out.includes("Line 100") && out.split("\n").length >= 100 },
    stdinSingle: { code: 'name = input()\nprint(f"Hello, {name}!")', input: "PeaklyyUser", expectedOutput: "Hello, PeaklyyUser!" },
    stdinMultiValues: { code: 'a, b = map(int, input().split())\nprint(a + b)', input: "15 27", expectedOutput: "42" },
    stdinMultiLines: { code: 'line1 = input()\nline2 = input()\nprint(f"{line1} and {line2}")', input: "FirstLine\nSecondLine", expectedOutput: "FirstLine and SecondLine" },
    stdinEmpty: { code: 'import sys\nraw = sys.stdin.read()\nprint("LEN:", len(raw))', input: "", expectedOutput: "LEN: 0" },
    stdinWithSpaces: { code: 'val = input()\nprint("VAL:", val)', input: "Hello World With Spaces", expectedOutput: "VAL: Hello World With Spaces" },
    stdinWhitespaceTrim: { code: 'val = input()\nprint("EXACT:", val)', input: "   leading and trailing   ", expectedOutput: "EXACT:    leading and trailing   " },
    numericParsing: { code: 'nums = [float(x) for x in input().split()]\nprint("SUM:", sum(nums))', input: "1.5 2.5 3.0", expectedOutput: "SUM: 7.0" },
    multiTestCase_T3: {
      code: 't = int(input())\nfor _ in range(t):\n    a, b = map(int, input().split())\n    print(a + b)',
      input: "3\n2 3\n10 20\n-5 8",
      expectedOutput: "5\n30\n3",
    },
    multiTestCase_T1: {
      code: 't = int(input())\nfor _ in range(t):\n    a, b = map(int, input().split())\n    print(a + b)',
      input: "1\n40 2",
      expectedOutput: "42",
    },
    algorithmic_sorting: {
      code: 'nums = [5, 2, 8, 1, 9]\nnums.sort()\nprint(" ".join(map(str, nums)))',
      expectedOutput: "1 2 5 8 9",
    },
    algorithmic_recursion: {
      code: 'def fact(n):\n    return 1 if n <= 1 else n * fact(n - 1)\nprint(fact(6))',
      expectedOutput: "720",
    },
  },

  javascript: {
    minimal: { code: 'console.log("Hello Peaklyy");', expectedOutput: "Hello Peaklyy" },
    multiLine: { code: 'console.log("Alpha");\nconsole.log("Beta");\nconsole.log("Gamma");', expectedOutput: "Alpha\nBeta\nGamma" },
    emptyOutput: { code: "// do nothing", expectedOutput: "" },
    unicode: { code: 'console.log("Hello 🚀 Γειά σου κόσμε 日本語 ñoño");', expectedOutput: "Hello 🚀 Γειά σου κόσμε 日本語 ñoño" },
    specialChars: { code: 'console.log("Quote: \\", Backslash: \\\\, Tab: [\\t], Braces: {a: 1}");', expectedOutput: 'Quote: ", Backslash: \\, Tab: [\t], Braces: {a: 1}' },
    largeOutput: { code: 'for (let i = 1; i <= 100; i++) console.log("Line " + i);', verifier: (out) => out.includes("Line 1") && out.includes("Line 100") && out.split("\n").length >= 100 },
    stdinSingle: { code: 'const fs = require("fs");\nconst input = fs.readFileSync(0, "utf-8").trim();\nconsole.log("Hello, " + input + "!");', input: "PeaklyyUser", expectedOutput: "Hello, PeaklyyUser!" },
    stdinMultiValues: { code: 'const fs = require("fs");\nconst parts = fs.readFileSync(0, "utf-8").trim().split(/\\s+/);\nconsole.log(Number(parts[0]) + Number(parts[1]));', input: "15 27", expectedOutput: "42" },
    stdinMultiLines: { code: 'const fs = require("fs");\nconst lines = fs.readFileSync(0, "utf-8").trim().split(/\\r?\\n/);\nconsole.log(lines[0] + " and " + lines[1]);', input: "FirstLine\nSecondLine", expectedOutput: "FirstLine and SecondLine" },
    stdinEmpty: { code: 'const fs = require("fs");\nconst input = fs.readFileSync(0, "utf-8");\nconsole.log("LEN:", input.length);', input: "", expectedOutput: "LEN: 0" },
    stdinWithSpaces: { code: 'const fs = require("fs");\nconst input = fs.readFileSync(0, "utf-8").replace(/\\r?\\n$/, "");\nconsole.log("VAL:", input);', input: "Hello World With Spaces", expectedOutput: "VAL: Hello World With Spaces" },
    stdinWhitespaceTrim: { code: 'const fs = require("fs");\nconst input = fs.readFileSync(0, "utf-8").replace(/\\r?\\n$/, "");\nconsole.log("EXACT:", input);', input: "   leading and trailing   ", expectedOutput: "EXACT:    leading and trailing   " },
    numericParsing: { code: 'const fs = require("fs");\nconst nums = fs.readFileSync(0, "utf-8").trim().split(/\\s+/).map(Number);\nconsole.log("SUM:", nums.reduce((a, b) => a + b, 0));', input: "1.5 2.5 3.0", expectedOutput: "SUM: 7" },
    multiTestCase_T3: {
      code: 'const fs = require("fs");\nconst lines = fs.readFileSync(0, "utf-8").trim().split(/\\r?\\n/).filter(Boolean);\nconst t = parseInt(lines[0], 10);\nfor (let i = 1; i <= t; i++) {\n  const [a, b] = lines[i].trim().split(/\\s+/).map(Number);\n  console.log(a + b);\n}',
      input: "3\n2 3\n10 20\n-5 8",
      expectedOutput: "5\n30\n3",
    },
    multiTestCase_T1: {
      code: 'const fs = require("fs");\nconst lines = fs.readFileSync(0, "utf-8").trim().split(/\\r?\\n/).filter(Boolean);\nconst [a, b] = lines[1].trim().split(/\\s+/).map(Number);\nconsole.log(a + b);',
      input: "1\n40 2",
      expectedOutput: "42",
    },
    algorithmic_sorting: {
      code: 'const nums = [5, 2, 8, 1, 9];\nnums.sort((a, b) => a - b);\nconsole.log(nums.join(" "));',
      expectedOutput: "1 2 5 8 9",
    },
    algorithmic_recursion: {
      code: 'function fact(n) { return n <= 1 ? 1 : n * fact(n - 1); }\nconsole.log(fact(6));',
      expectedOutput: "720",
    },
  },

  typescript: {
    minimal: { code: 'const msg: string = "Hello Peaklyy";\nconsole.log(msg);', expectedOutput: "Hello Peaklyy" },
    multiLine: { code: 'const lines: string[] = ["Alpha", "Beta", "Gamma"];\nlines.forEach(l => console.log(l));', expectedOutput: "Alpha\nBeta\nGamma" },
    emptyOutput: { code: "const x: number = 42;", expectedOutput: "" },
    unicode: { code: 'const s: string = "Hello 🚀 Γειά σου κόσμε 日本語 ñoño";\nconsole.log(s);', expectedOutput: "Hello 🚀 Γειά σου κόσμε 日本語 ñoño" },
    specialChars: { code: 'console.log("Quote: \\", Backslash: \\\\, Tab: [\\t], Braces: {a: 1}");', expectedOutput: 'Quote: ", Backslash: \\, Tab: [\t], Braces: {a: 1}' },
    largeOutput: { code: 'for (let i: number = 1; i <= 100; i++) console.log("Line " + i);', verifier: (out) => out.includes("Line 1") && out.includes("Line 100") && out.split("\n").length >= 100 },
    stdinSingle: { code: 'import * as fs from "fs";\nconst input: string = fs.readFileSync(0, "utf-8").trim();\nconsole.log(`Hello, ${input}!`);', input: "PeaklyyUser", expectedOutput: "Hello, PeaklyyUser!" },
    stdinMultiValues: { code: 'import * as fs from "fs";\nconst parts: string[] = fs.readFileSync(0, "utf-8").trim().split(/\\s+/);\nconsole.log(Number(parts[0]) + Number(parts[1]));', input: "15 27", expectedOutput: "42" },
    stdinMultiLines: { code: 'import * as fs from "fs";\nconst lines: string[] = fs.readFileSync(0, "utf-8").trim().split(/\\r?\\n/);\nconsole.log(`${lines[0]} and ${lines[1]}`);', input: "FirstLine\nSecondLine", expectedOutput: "FirstLine and SecondLine" },
    numericParsing: { code: 'import * as fs from "fs";\nconst nums: number[] = fs.readFileSync(0, "utf-8").trim().split(/\\s+/).map(Number);\nconsole.log("SUM:", nums.reduce((a, b) => a + b, 0));', input: "1.5 2.5 3.0", expectedOutput: "SUM: 7" },
    multiTestCase_T3: {
      code: 'import * as fs from "fs";\nconst lines: string[] = fs.readFileSync(0, "utf-8").trim().split(/\\r?\\n/).filter(Boolean);\nconst t: number = parseInt(lines[0], 10);\nfor (let i: number = 1; i <= t; i++) {\n  const [a, b]: number[] = lines[i].trim().split(/\\s+/).map(Number);\n  console.log(a + b);\n}',
      input: "3\n2 3\n10 20\n-5 8",
      expectedOutput: "5\n30\n3",
    },
    algorithmic_sorting: {
      code: 'const nums: number[] = [5, 2, 8, 1, 9];\nnums.sort((a, b) => a - b);\nconsole.log(nums.join(" "));',
      expectedOutput: "1 2 5 8 9",
    },
    algorithmic_recursion: {
      code: 'function fact(n: number): number { return n <= 1 ? 1 : n * fact(n - 1); }\nconsole.log(fact(6));',
      expectedOutput: "720",
    },
  },

  java: {
    minimal: { code: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello Peaklyy");\n    }\n}', expectedOutput: "Hello Peaklyy" },
    multiLine: { code: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Alpha");\n        System.out.println("Beta");\n        System.out.println("Gamma");\n    }\n}', expectedOutput: "Alpha\nBeta\nGamma" },
    emptyOutput: { code: 'public class Main {\n    public static void main(String[] args) {\n    }\n}', expectedOutput: "" },
    unicode: { code: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello 🚀 Γειά σου κόσμε 日本語 ñoño");\n    }\n}', expectedOutput: "Hello 🚀 Γειά σου κόσμε 日本語 ñoño" },
    specialChars: { code: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Quote: \\", Backslash: \\\\, Tab: [\\t], Braces: {a: 1}");\n    }\n}', expectedOutput: 'Quote: ", Backslash: \\, Tab: [\t], Braces: {a: 1}' },
    largeOutput: { code: 'public class Main {\n    public static void main(String[] args) {\n        for (int i = 1; i <= 100; i++) System.out.println("Line " + i);\n    }\n}', verifier: (out) => out.includes("Line 1") && out.includes("Line 100") && out.split("\n").length >= 100 },
    stdinSingle: { code: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine();\n        System.out.println("Hello, " + s + "!");\n    }\n}', input: "PeaklyyUser", expectedOutput: "Hello, PeaklyyUser!" },
    stdinMultiValues: { code: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        System.out.println(a + b);\n    }\n}', input: "15 27", expectedOutput: "42" },
    multiTestCase_T3: {
      code: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int t = sc.nextInt();\n        for (int i = 0; i < t; i++) {\n            int a = sc.nextInt();\n            int b = sc.nextInt();\n            System.out.println(a + b);\n        }\n    }\n}',
      input: "3\n2 3\n10 20\n-5 8",
      expectedOutput: "5\n30\n3",
    },
    algorithmic_sorting: {
      code: 'import java.util.Arrays;\npublic class Main {\n    public static void main(String[] args) {\n        int[] arr = {5, 2, 8, 1, 9};\n        Arrays.sort(arr);\n        for (int i = 0; i < arr.length; i++) System.out.print(arr[i] + (i == arr.length - 1 ? "\\n" : " "));\n    }\n}',
      expectedOutput: "1 2 5 8 9",
    },
    algorithmic_recursion: {
      code: 'public class Main {\n    public static long fact(int n) { return n <= 1 ? 1 : n * fact(n - 1); }\n    public static void main(String[] args) { System.out.println(fact(6)); }\n}',
      expectedOutput: "720",
    },
  },

  csharp: {
    minimal: { code: 'using System;\nclass Program { static void Main() { Console.WriteLine("Hello Peaklyy"); } }', expectedOutput: "Hello Peaklyy" },
    multiLine: { code: 'using System;\nclass Program { static void Main() { Console.WriteLine("Alpha"); Console.WriteLine("Beta"); Console.WriteLine("Gamma"); } }', expectedOutput: "Alpha\nBeta\nGamma" },
    emptyOutput: { code: 'using System;\nclass Program { static void Main() {} }', expectedOutput: "" },
    largeOutput: { code: 'using System;\nclass Program { static void Main() { for (int i = 1; i <= 100; i++) Console.WriteLine("Line " + i); } }', verifier: (out) => out.includes("Line 1") && out.includes("Line 100") && out.split("\n").length >= 100 },
    stdinSingle: { code: 'using System;\nclass Program { static void Main() { string s = Console.ReadLine(); Console.WriteLine("Hello, " + s + "!"); } }', input: "PeaklyyUser", expectedOutput: "Hello, PeaklyyUser!" },
    stdinMultiValues: { code: 'using System;\nclass Program { static void Main() { string[] p = Console.ReadLine().Split(\' \'); Console.WriteLine(int.Parse(p[0]) + int.Parse(p[1])); } }', input: "15 27", expectedOutput: "42" },
    multiTestCase_T3: {
      code: 'using System;\nclass Program {\n    static void Main() {\n        string l = Console.ReadLine();\n        if (string.IsNullOrEmpty(l)) return;\n        int t = int.Parse(l.Trim());\n        for (int i = 0; i < t; i++) {\n            string[] p = Console.ReadLine().Trim().Split(\' \');\n            Console.WriteLine(int.Parse(p[0]) + int.Parse(p[1]));\n        }\n    }\n}',
      input: "3\n2 3\n10 20\n-5 8",
      expectedOutput: "5\n30\n3",
    },
    algorithmic_sorting: {
      code: 'using System;\nclass Program {\n    static void Main() {\n        int[] arr = new int[5];\n        arr[0] = 5; arr[1] = 2; arr[2] = 8; arr[3] = 1; arr[4] = 9;\n        Array.Sort(arr);\n        Console.WriteLine(string.Join(" ", arr));\n    }\n}',
      expectedOutput: "1 2 5 8 9",
    },
    algorithmic_recursion: {
      code: 'using System;\nclass Program {\n    static long Fact(int n) { return n <= 1 ? 1 : n * Fact(n - 1); }\n    static void Main() { Console.WriteLine(Fact(6)); }\n}',
      expectedOutput: "720",
    },
  },

  c: {
    minimal: { code: '#include <stdio.h>\nint main(){ printf("Hello Peaklyy\\n"); return 0; }', expectedOutput: "Hello Peaklyy" },
    multiLine: { code: '#include <stdio.h>\nint main(){ printf("Alpha\\nBeta\\nGamma\\n"); return 0; }', expectedOutput: "Alpha\nBeta\nGamma" },
    emptyOutput: { code: 'int main(){ return 0; }', expectedOutput: "" },
    largeOutput: { code: '#include <stdio.h>\nint main(){ for(int i=1; i<=100; i++) printf("Line %d\\n", i); return 0; }', verifier: (out) => out.includes("Line 1") && out.includes("Line 100") && out.split("\n").length >= 100 },
    stdinSingle: { code: '#include <stdio.h>\nint main(){ char s[100]; scanf("%s", s); printf("Hello, %s!\\n", s); return 0; }', input: "PeaklyyUser", expectedOutput: "Hello, PeaklyyUser!" },
    stdinMultiValues: { code: '#include <stdio.h>\nint main(){ int a, b; scanf("%d %d", &a, &b); printf("%d\\n", a + b); return 0; }', input: "15 27", expectedOutput: "42" },
    multiTestCase_T3: {
      code: '#include <stdio.h>\nint main() {\n    int t;\n    if (scanf("%d", &t) != 1) return 0;\n    while (t--) {\n        int a, b;\n        if (scanf("%d %d", &a, &b) == 2) printf("%d\\n", a + b);\n    }\n    return 0;\n}',
      input: "3\n2 3\n10 20\n-5 8",
      expectedOutput: "5\n30\n3",
    },
    algorithmic_sorting: {
      code: '#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *a, const void *b){ return (*(int*)a - *(int*)b); }\nint main() {\n    int arr[] = {5, 2, 8, 1, 9};\n    qsort(arr, 5, sizeof(int), cmp);\n    for(int i=0; i<5; i++) printf("%d%c", arr[i], i==4?\'\\n\':\' \');\n    return 0;\n}',
      expectedOutput: "1 2 5 8 9",
    },
    algorithmic_recursion: {
      code: '#include <stdio.h>\nlong long fact(int n){ return n <= 1 ? 1 : n * fact(n - 1); }\nint main(){ printf("%lld\\n", fact(6)); return 0; }',
      expectedOutput: "720",
    },
  },

  cpp: {
    minimal: { code: '#include <iostream>\nint main(){ std::cout << "Hello Peaklyy\\n"; return 0; }', expectedOutput: "Hello Peaklyy" },
    multiLine: { code: '#include <iostream>\nint main(){ std::cout << "Alpha\\nBeta\\nGamma\\n"; return 0; }', expectedOutput: "Alpha\nBeta\nGamma" },
    emptyOutput: { code: 'int main(){ return 0; }', expectedOutput: "" },
    largeOutput: { code: '#include <iostream>\nint main(){ for(int i=1; i<=100; i++) std::cout << "Line " << i << "\\n"; return 0; }', verifier: (out) => out.includes("Line 1") && out.includes("Line 100") && out.split("\n").length >= 100 },
    stdinSingle: { code: '#include <iostream>\n#include <string>\nint main(){ std::string s; std::cin >> s; std::cout << "Hello, " << s << "!\\n"; return 0; }', input: "PeaklyyUser", expectedOutput: "Hello, PeaklyyUser!" },
    stdinMultiValues: { code: '#include <iostream>\nint main(){ int a, b; std::cin >> a >> b; std::cout << a + b << "\\n"; return 0; }', input: "15 27", expectedOutput: "42" },
    multiTestCase_T3: {
      code: '#include <iostream>\nint main() {\n    int t;\n    if (!(std::cin >> t)) return 0;\n    while (t--) {\n        int a, b;\n        if (std::cin >> a >> b) std::cout << a + b << "\\n";\n    }\n    return 0;\n}',
      input: "3\n2 3\n10 20\n-5 8",
      expectedOutput: "5\n30\n3",
    },
    algorithmic_sorting: {
      code: '#include <iostream>\n#include <vector>\n#include <algorithm>\nint main() {\n    std::vector<int> v = {5, 2, 8, 1, 9};\n    std::sort(v.begin(), v.end());\n    for (size_t i = 0; i < v.size(); ++i) std::cout << v[i] << (i + 1 == v.size() ? "\\n" : " ");\n    return 0;\n}',
      expectedOutput: "1 2 5 8 9",
    },
    algorithmic_recursion: {
      code: '#include <iostream>\nlong long fact(int n) { return n <= 1 ? 1 : n * fact(n - 1); }\nint main() { std::cout << fact(6) << "\\n"; return 0; }',
      expectedOutput: "720",
    },
  },

  go: {
    minimal: { code: 'package main\nimport "fmt"\nfunc main(){ fmt.Println("Hello Peaklyy") }', expectedOutput: "Hello Peaklyy" },
    multiLine: { code: 'package main\nimport "fmt"\nfunc main(){ fmt.Println("Alpha"); fmt.Println("Beta"); fmt.Println("Gamma") }', expectedOutput: "Alpha\nBeta\nGamma" },
    emptyOutput: { code: 'package main\nfunc main(){}', expectedOutput: "" },
    largeOutput: { code: 'package main\nimport "fmt"\nfunc main(){ for i := 1; i <= 100; i++ { fmt.Printf("Line %d\\n", i) } }', verifier: (out) => out.includes("Line 1") && out.includes("Line 100") && out.split("\n").length >= 100 },
    stdinSingle: { code: 'package main\nimport "fmt"\nfunc main(){ var s string; fmt.Scan(&s); fmt.Printf("Hello, %s!\\n", s) }', input: "PeaklyyUser", expectedOutput: "Hello, PeaklyyUser!" },
    stdinMultiValues: { code: 'package main\nimport "fmt"\nfunc main(){ var a, b int; fmt.Scan(&a, &b); fmt.Println(a + b) }', input: "15 27", expectedOutput: "42" },
    multiTestCase_T3: {
      code: 'package main\nimport "fmt"\nfunc main() {\n    var t int\n    if _, err := fmt.Scan(&t); err != nil { return }\n    for i := 0; i < t; i++ {\n        var a, b int\n        fmt.Scan(&a, &b)\n        fmt.Println(a + b)\n    }\n}',
      input: "3\n2 3\n10 20\n-5 8",
      expectedOutput: "5\n30\n3",
    },
    algorithmic_sorting: {
      code: 'package main\nimport ("fmt"; "sort")\nfunc main() {\n    arr := []int{5, 2, 8, 1, 9}\n    sort.Ints(arr)\n    for i, v := range arr {\n        if i > 0 { fmt.Print(" ") }\n        fmt.Print(v)\n    }\n    fmt.Println()\n}',
      expectedOutput: "1 2 5 8 9",
    },
    algorithmic_recursion: {
      code: 'package main\nimport "fmt"\nfunc fact(n int) int { if n <= 1 { return 1 }; return n * fact(n - 1) }\nfunc main() { fmt.Println(fact(6)) }',
      expectedOutput: "720",
    },
  },

  rust: {
    minimal: { code: 'fn main(){ println!("Hello Peaklyy"); }', expectedOutput: "Hello Peaklyy" },
    multiLine: { code: 'fn main(){ println!("Alpha"); println!("Beta"); println!("Gamma"); }', expectedOutput: "Alpha\nBeta\nGamma" },
    emptyOutput: { code: 'fn main(){}', expectedOutput: "" },
    largeOutput: { code: 'fn main(){ for i in 1..=100 { println!("Line {}", i); } }', verifier: (out) => out.includes("Line 1") && out.includes("Line 100") && out.split("\n").length >= 100 },
    stdinSingle: { code: 'use std::io::{self, BufRead};\nfn main(){\n    let stdin = io::stdin();\n    let mut line = String::new();\n    stdin.lock().read_line(&mut line).unwrap();\n    println!("Hello, {}!", line.trim());\n}', input: "PeaklyyUser", expectedOutput: "Hello, PeaklyyUser!" },
    stdinMultiValues: { code: 'use std::io::{self, BufRead};\nfn main(){\n    let stdin = io::stdin();\n    let mut line = String::new();\n    stdin.lock().read_line(&mut line).unwrap();\n    let nums: Vec<i32> = line.split_whitespace().map(|x| x.parse().unwrap()).collect();\n    println!("{}", nums[0] + nums[1]);\n}', input: "15 27", expectedOutput: "42" },
    multiTestCase_T3: {
      code: 'use std::io::{self, Read};\nfn main() {\n    let mut input = String::new();\n    io::stdin().read_to_string(&mut input).unwrap();\n    let mut iter = input.split_whitespace();\n    if let Some(t_str) = iter.next() {\n        let t: usize = t_str.parse().unwrap();\n        for _ in 0..t {\n            let a: i32 = iter.next().unwrap().parse().unwrap();\n            let b: i32 = iter.next().unwrap().parse().unwrap();\n            println!("{}", a + b);\n        }\n    }\n}',
      input: "3\n2 3\n10 20\n-5 8",
      expectedOutput: "5\n30\n3",
    },
    algorithmic_sorting: {
      code: 'fn main() {\n    let mut arr = vec![5, 2, 8, 1, 9];\n    arr.sort();\n    let s: Vec<String> = arr.iter().map(|x| x.to_string()).collect();\n    println!("{}", s.join(" "));\n}',
      expectedOutput: "1 2 5 8 9",
    },
    algorithmic_recursion: {
      code: 'fn fact(n: u64) -> u64 { if n <= 1 { 1 } else { n * fact(n - 1) } }\nfn main() { println!("{}", fact(6)); }',
      expectedOutput: "720",
    },
  },

  php: {
    minimal: { code: '<?php echo "Hello Peaklyy\n"; ?>', expectedOutput: "Hello Peaklyy" },
    multiLine: { code: '<?php echo "Alpha\nBeta\nGamma\n"; ?>', expectedOutput: "Alpha\nBeta\nGamma" },
    emptyOutput: { code: '<?php ?>', expectedOutput: "" },
    largeOutput: { code: '<?php for ($i = 1; $i <= 100; $i++) echo "Line {$i}\n"; ?>', verifier: (out) => out.includes("Line 1") && out.includes("Line 100") && out.split("\n").length >= 100 },
    stdinSingle: { code: '<?php $s = trim(fgets(STDIN)); echo "Hello, {$s}!\n"; ?>', input: "PeaklyyUser", expectedOutput: "Hello, PeaklyyUser!" },
    stdinMultiValues: { code: '<?php fscanf(STDIN, "%d %d", $a, $b); echo ($a + $b) . "\n"; ?>', input: "15 27", expectedOutput: "42" },
    multiTestCase_T3: {
      code: '<?php\nfscanf(STDIN, "%d", $t);\nfor ($i = 0; $i < $t; $i++) {\n    fscanf(STDIN, "%d %d", $a, $b);\n    echo ($a + $b) . "\n";\n}\n?>',
      input: "3\n2 3\n10 20\n-5 8",
      expectedOutput: "5\n30\n3",
    },
    algorithmic_sorting: {
      code: '<?php $arr = [5, 2, 8, 1, 9]; sort($arr); echo implode(" ", $arr) . "\n"; ?>',
      expectedOutput: "1 2 5 8 9",
    },
    algorithmic_recursion: {
      code: '<?php function fact($n){ return $n <= 1 ? 1 : $n * fact($n - 1); } echo fact(6) . "\n"; ?>',
      expectedOutput: "720",
    },
  },

  ruby: {
    minimal: { code: 'puts "Hello Peaklyy"', expectedOutput: "Hello Peaklyy" },
    multiLine: { code: 'puts "Alpha"\nputs "Beta"\nputs "Gamma"', expectedOutput: "Alpha\nBeta\nGamma" },
    emptyOutput: { code: '# nothing', expectedOutput: "" },
    largeOutput: { code: '(1..100).each { |i| puts "Line #{i}" }', verifier: (out) => out.includes("Line 1") && out.includes("Line 100") && out.split("\n").length >= 100 },
    stdinSingle: { code: 's = gets.strip; puts "Hello, #{s}!"', input: "PeaklyyUser", expectedOutput: "Hello, PeaklyyUser!" },
    stdinMultiValues: { code: 'a, b = gets.split.map(&:to_i); puts a + b', input: "15 27", expectedOutput: "42" },
    multiTestCase_T3: {
      code: 't = gets.to_i\nt.times do\n  a, b = gets.split.map(&:to_i)\n  puts a + b\nend',
      input: "3\n2 3\n10 20\n-5 8",
      expectedOutput: "5\n30\n3",
    },
    algorithmic_sorting: {
      code: 'puts [5, 2, 8, 1, 9].sort.join(" ")',
      expectedOutput: "1 2 5 8 9",
    },
    algorithmic_recursion: {
      code: 'def fact(n); n <= 1 ? 1 : n * fact(n - 1); end; puts fact(6)',
      expectedOutput: "720",
    },
  },

  dart: {
    minimal: { code: 'void main(){ print("Hello Peaklyy"); }', expectedOutput: "Hello Peaklyy" },
    multiLine: { code: 'void main(){ print("Alpha"); print("Beta"); print("Gamma"); }', expectedOutput: "Alpha\nBeta\nGamma" },
    emptyOutput: { code: 'void main(){}', expectedOutput: "" },
    largeOutput: { code: 'void main(){ for(int i=1; i<=100; i++) print("Line $i"); }', verifier: (out) => out.includes("Line 1") && out.includes("Line 100") && out.split("\n").length >= 100 },
    stdinSingle: { code: 'import \'dart:io\'; void main(){ final s = stdin.readLineSync()!.trim(); print("Hello, $s!"); }', input: "PeaklyyUser", expectedOutput: "Hello, PeaklyyUser!" },
    stdinMultiValues: { code: 'import \'dart:io\'; void main(){ final parts = stdin.readLineSync()!.trim().split(\' \'); print(int.parse(parts[0]) + int.parse(parts[1])); }', input: "15 27", expectedOutput: "42" },
    multiTestCase_T3: {
      code: 'import \'dart:io\';\nvoid main() {\n  final tLine = stdin.readLineSync();\n  if (tLine == null) return;\n  final t = int.parse(tLine.trim());\n  for (int i = 0; i < t; i++) {\n    final line = stdin.readLineSync()!.trim();\n    final parts = line.split(RegExp(r\'\\s+\'));\n    print(int.parse(parts[0]) + int.parse(parts[1]));\n  }\n}',
      input: "3\n2 3\n10 20\n-5 8",
      expectedOutput: "5\n30\n3",
    },
    algorithmic_sorting: {
      code: 'void main(){ final l = [5, 2, 8, 1, 9]; l.sort(); print(l.join(" ")); }',
      expectedOutput: "1 2 5 8 9",
    },
    algorithmic_recursion: {
      code: 'int fact(int n) => n <= 1 ? 1 : n * fact(n - 1); void main(){ print(fact(6)); }',
      expectedOutput: "720",
    },
  },

  kotlin: {
    minimal: { code: 'fun main(){ println("Hello Peaklyy") }', expectedOutput: "Hello Peaklyy" },
    multiLine: { code: 'fun main(){ println("Alpha"); println("Beta"); println("Gamma") }', expectedOutput: "Alpha\nBeta\nGamma" },
    emptyOutput: { code: 'fun main(){}', expectedOutput: "" },
    largeOutput: { code: 'fun main(){ for(i in 1..100) println("Line $i") }', verifier: (out) => out.includes("Line 1") && out.includes("Line 100") && out.split("\n").length >= 100 },
    stdinSingle: { code: 'fun main(){ val s = readLine()!!.trim(); println("Hello, $s!") }', input: "PeaklyyUser", expectedOutput: "Hello, PeaklyyUser!" },
    stdinMultiValues: { code: 'fun main(){ val parts = readLine()!!.trim().split(" "); println(parts[0].toInt() + parts[1].toInt()) }', input: "15 27", expectedOutput: "42" },
    multiTestCase_T3: {
      code: 'import java.util.Scanner\nfun main() {\n    val sc = Scanner(System.`in`)\n    if (!sc.hasNextInt()) return\n    val t = sc.nextInt()\n    for (i in 0 until t) {\n        val a = sc.nextInt()\n        val b = sc.nextInt()\n        println(a + b)\n    }\n}',
      input: "3\n2 3\n10 20\n-5 8",
      expectedOutput: "5\n30\n3",
    },
    algorithmic_sorting: {
      code: 'fun main(){ val arr = intArrayOf(5, 2, 8, 1, 9); arr.sort(); println(arr.joinToString(" ")) }',
      expectedOutput: "1 2 5 8 9",
    },
    algorithmic_recursion: {
      code: 'fun fact(n: Long): Long = if (n <= 1) 1 else n * fact(n - 1); fun main(){ println(fact(6)) }',
      expectedOutput: "720",
    },
  },
};

module.exports = {
  LANGUAGE_TEST_CASES,
};
