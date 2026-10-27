const fetch = globalThis.fetch;

async function runTest(name, payload) {
  process.stdout.write(`Testing: ${name}... `);
  try {
    const res = await fetch('http://localhost:5000/api/compiler/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function main() {
  console.log('=== PEAKLYY FORGE P0 COMPILER VERIFICATION ===\n');

  // 1. Python standard execution
  const pyTest = await runTest('Python standard execution', {
    language: 'python',
    code: 'print("Hello from Python 3!")',
  });
  console.log(pyTest.data.output?.trim() === 'Hello from Python 3!' ? 'PASSED [Output: "Hello from Python 3!"]' : `FAILED: ${JSON.stringify(pyTest.data)}`);

  // 2. Python stdin
  const pyStdin = await runTest('Python standard input (stdin)', {
    language: 'python',
    code: 'import sys\nname = sys.stdin.read().strip()\nprint(f"Hello, {name}!")',
    input: 'PeaklyyForge',
  });
  console.log(pyStdin.data.output?.trim() === 'Hello, PeaklyyForge!' ? 'PASSED [Output: "Hello, PeaklyyForge!"]' : `FAILED: ${JSON.stringify(pyStdin.data)}`);

  // 3. Python syntax error
  const pySyntax = await runTest('Python syntax error', {
    language: 'python',
    code: 'def broken(: pass',
  });
  console.log(pySyntax.data.error?.includes('SyntaxError') ? 'PASSED [Proper SyntaxError returned]' : `FAILED: ${JSON.stringify(pySyntax.data)}`);

  // 4. JavaScript standard execution
  const jsTest = await runTest('JavaScript standard execution', {
    language: 'javascript',
    code: 'console.log("Hello from JavaScript!");',
  });
  console.log(jsTest.data.output?.trim() === 'Hello from JavaScript!' ? 'PASSED [Output: "Hello from JavaScript!"]' : `FAILED: ${JSON.stringify(jsTest.data)}`);

  // 5. JavaScript stdin
  const jsStdin = await runTest('JavaScript standard input (stdin)', {
    language: 'javascript',
    code: 'const fs = require("fs"); const input = fs.readFileSync(0, "utf-8").trim(); console.log(`Echo: ${input}`);',
    input: 'StdinTest123',
  });
  console.log(jsStdin.data.output?.trim() === 'Echo: StdinTest123' ? 'PASSED [Output: "Echo: StdinTest123"]' : `FAILED: ${JSON.stringify(jsStdin.data)}`);

  // 6. TypeScript standard execution
  const tsTest = await runTest('TypeScript standard execution', {
    language: 'typescript',
    code: 'interface User { name: string; age: number; }\nconst u: User = { name: "TypeScript", age: 5 };\nconsole.log(`Hello from ${u.name} (age ${u.age})!`);',
  });
  console.log(tsTest.data.output?.trim() === 'Hello from TypeScript (age 5)!' ? 'PASSED [Output: "Hello from TypeScript (age 5)!"]' : `FAILED: ${JSON.stringify(tsTest.data)}`);

  // 7. Java standard execution
  const javaTest = await runTest('Java standard execution', {
    language: 'java',
    code: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello from Java OpenJDK!");\n  }\n}',
  });
  console.log(javaTest.data.output?.trim() === 'Hello from Java OpenJDK!' ? 'PASSED [Output: "Hello from Java OpenJDK!"]' : `FAILED: ${JSON.stringify(javaTest.data)}`);

  // 8. Java compile error
  const javaCompileError = await runTest('Java compilation error handling', {
    language: 'java',
    code: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Missing semicolon")\n  }\n}',
  });
  console.log(javaCompileError.data.error?.includes(';') || javaCompileError.data.error?.includes('error') ? 'PASSED [Compilation error reported accurately]' : `FAILED: ${JSON.stringify(javaCompileError.data)}`);

  // 9. C# native execution
  const csTest = await runTest('C# native Windows execution', {
    language: 'csharp',
    code: 'using System;\nclass Program {\n  static void Main() {\n    Console.WriteLine("Hello from C# on Windows!");\n  }\n}',
  });
  console.log(csTest.data.output?.trim() === 'Hello from C# on Windows!' ? 'PASSED [Output: "Hello from C# on Windows!"]' : `FAILED: ${JSON.stringify(csTest.data)}`);

  // 10. Check GET /languages endpoint
  const langsRes = await fetch('http://localhost:5000/api/compiler/languages');
  const langsData = await langsRes.json();
  console.log('\nGET /api/compiler/languages returned:');
  console.log(langsData);
}

main();
