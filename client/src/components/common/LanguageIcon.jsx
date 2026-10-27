import {
  SiC,
  SiCplusplus,
  SiDart,
  SiGo,
  SiKotlin,
  SiPhp,
  SiRuby,
  SiRust,
  SiSwift,
  SiTypescript,
} from "react-icons/si";
import { TbBrandCSharp } from "react-icons/tb";

/**
 * Official Python Logo SVG
 */
export function PythonIcon({ size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 255"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="py_grad_top" x1="12.6%" y1="12.3%" x2="87.4%" y2="87.7%">
          <stop offset="0%" stopColor="#3776AB" />
          <stop offset="100%" stopColor="#2D608B" />
        </linearGradient>
        <linearGradient id="py_grad_bot" x1="12.6%" y1="12.3%" x2="87.4%" y2="87.7%">
          <stop offset="0%" stopColor="#FFD43B" />
          <stop offset="100%" stopColor="#FFE052" />
        </linearGradient>
      </defs>
      <path
        d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.331c0 64.972 36.21 62.775 36.21 62.775h21.61v-30.426s-1.164-36.21 35.632-36.21h61.579s34.475-.434 34.475-33.897V31.293S194.225.072 126.916.072zm-34.982 19.37a11.9 11.9 0 1 1 0 23.8 11.9 11.9 0 0 1 0-23.8z"
        fill="url(#py_grad_top)"
      />
      <path
        d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.27c0-64.973-36.209-62.776-36.209-62.776h-21.61v30.426s1.165 36.21-35.632 36.21h-61.578s-34.476.434-34.476 33.897v58.264s-4.57 31.22 62.735 31.22zm34.981-19.37a11.9 11.9 0 1 1 0-23.8 11.9 11.9 0 0 1 0 23.8z"
        fill="url(#py_grad_bot)"
      />
    </svg>
  );
}

/**
 * Official Java Coffee Cup Logo SVG
 */
export function JavaIcon({ size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    >
      <path
        d="M47.4 96.5s-6.3 3.6 4.5 4.8c13 1.5 19.5 1.3 33.7-.7 0 0 4.6-2.9-2.7-4.1-10.4-1.7-27.7-2.9-35.5 0z"
        fill="#5382A1"
      />
      <path
        d="M43.7 108.6s-7.8 4.7 5.1 5.9c15.6 1.5 24.3 1.5 40.8-.9 0 0 5.6-3.7-3.4-5.3-13.1-2.2-33.1-2.8-42.5.3z"
        fill="#5382A1"
      />
      <path
        d="M68.5 76.8c7.8-8.9 4.2-16.7-3.6-24.8-5.3-5.5-7.3-10.3-4.5-16 0 0-10.9 5.6-6.4 16.9 4.3 11 11.6 13.9 14.5 23.9z"
        fill="#E76F00"
      />
      <path
        d="M54.5 86.8c-12.7 1.8-21.6 6.3-21.6 11.7 0 7.8 18.6 14.1 41.5 14.1s41.5-6.3 41.5-14.1c0-5.7-9.5-10.3-22.9-12l-1.9 4c12.2 1.4 20.1 4.7 20.1 8.5 0 5.3-16.5 9.7-36.8 9.7s-36.8-4.4-36.8-9.7c0-3.6 7.2-6.8 18.5-8.3l-1.6-3.9z"
        fill="#E76F00"
      />
      <path
        d="M61 5.8c0 0 10.7 11.1-2.9 27.5-11 13.3-3.6 22 0 31.8-8.1-9.2-12.2-17.5-6.3-26.6C58.4 28.2 62.4 18.9 61 5.8z"
        fill="#E76F00"
      />
    </svg>
  );
}

/**
 * Official JavaScript Badge Logo SVG
 */
export function JavaScriptIcon({ size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, borderRadius: 2 }}
    >
      <rect width="128" height="128" rx="16" fill="#F7DF1E" />
      <path
        d="M67.3 103c3.8 6.4 9.1 10.5 17.6 10.5 7.4 0 12.1-3.7 12.1-8.9 0-6.2-4.9-8.4-13.1-11.9l-4.5-1.9c-13.1-5.6-21.7-12.6-21.7-27.1 0-14.7 11.4-25.9 29.5-25.9 12.9 0 22.1 4.5 28.3 15.3l-12.9 8.3c-3.1-5.6-6.8-7.9-14.8-7.9-5.8 0-9.8 3.7-9.8 7.9 0 5.4 3.7 7.5 11.2 10.7l4.5 1.9c15.7 6.7 23.9 13.4 23.9 27.7 0 16.9-13.2 27.6-32.9 27.6-18.4 0-29.7-8.9-35.1-20.7l17.7-10.9zm-44-1.2c3 5.4 6.7 9.8 13.4 9.8 6.7 0 10.9-2.7 10.9-13.4V39h23.1v60c0 23.7-13.9 33.8-34 33.8-15.6 0-26.6-7.8-31-19.8l17.6-11.2z"
        fill="#000000"
      />
    </svg>
  );
}

/**
 * Official HTML5 Shield Logo SVG
 */
export function HtmlIcon({ size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    >
      <path d="M18.6 117.8L8.5 4H119.5L109.4 117.8L63.9 130.4L18.6 117.8Z" fill="#E34F26" />
      <path d="M64 120.9L101.4 110.5L109.8 16.4H64V120.9Z" fill="#EF652A" />
      <path
        d="M64 54.4H42.7L41.3 38.6H64V22.8H24.1L27.6 69.8H64V54.4ZM64 94.6L63.9 94.7L47.7 90.3L46.7 78.5H30.9L32.8 100.2L63.9 108.8L64 108.8V94.6Z"
        fill="#FFFFFF"
      />
      <path
        d="M63.9 54.4V69.8H83.8L81.9 90.3L63.9 94.6V108.8L95 100.2L95.2 97.9L98.6 59.8L99.1 54.4H63.9ZM63.9 22.8V38.6H100.5L101.9 22.8H63.9Z"
        fill="#ECECEC"
      />
    </svg>
  );
}

/**
 * Official CSS3 Shield Logo SVG
 */
export function CssIcon({ size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    >
      <path d="M18.6 117.8L8.5 4H119.5L109.4 117.8L63.9 130.4L18.6 117.8Z" fill="#1572B6" />
      <path d="M64 120.9L101.4 110.5L109.8 16.4H64V120.9Z" fill="#33A9DC" />
      <path
        d="M64 54.7H43.9L45.3 70.5H64V85.9H31.7L28.1 39.3H64V54.7ZM64 108.8L63.9 108.8L32.8 100.2L30.9 78.5H46.7L47.7 90.3L63.9 94.7V108.8Z"
        fill="#FFFFFF"
      />
      <path
        d="M63.9 54.7V39.3H101.9L100.5 54.7H63.9ZM63.9 70.5V85.9L81.9 90.3L83.8 69.8H63.9V70.5ZM63.9 108.8V94.7L95 100.2L98.6 59.8H63.9V70.5H98.6L95 100.2L63.9 108.8Z"
        fill="#ECECEC"
      />
    </svg>
  );
}

export function TypeScriptIcon({ size = 18, className = "" }) {
  return <SiTypescript size={size} className={className} style={{ color: "#3178c6" }} />;
}

export function CIcon({ size = 18, className = "" }) {
  return <SiC size={size} className={className} style={{ color: "#a8b9cc" }} />;
}

export function CppIcon({ size = 18, className = "" }) {
  return <SiCplusplus size={size} className={className} style={{ color: "#00599c" }} />;
}

export function CsharpIcon({ size = 18, className = "" }) {
  return <TbBrandCSharp size={size} className={className} style={{ color: "#239120" }} />;
}

export function GoIcon({ size = 18, className = "" }) {
  return <SiGo size={size} className={className} style={{ color: "#00add8" }} />;
}

export function RustIcon({ size = 18, className = "" }) {
  return <SiRust size={size} className={className} style={{ color: "#dea584" }} />;
}

export function PhpIcon({ size = 18, className = "" }) {
  return <SiPhp size={size} className={className} style={{ color: "#777bb4" }} />;
}

export function KotlinIcon({ size = 18, className = "" }) {
  return <SiKotlin size={size} className={className} style={{ color: "#7f52ff" }} />;
}

export function SwiftIcon({ size = 18, className = "" }) {
  return <SiSwift size={size} className={className} style={{ color: "#f05138" }} />;
}

export function RubyIcon({ size = 18, className = "" }) {
  return <SiRuby size={size} className={className} style={{ color: "#cc342d" }} />;
}

export function DartIcon({ size = 18, className = "" }) {
  return <SiDart size={size} className={className} style={{ color: "#0175c2" }} />;
}

export const languageIconMap = {
  python: PythonIcon,
  py: PythonIcon,
  java: JavaIcon,
  javascript: JavaScriptIcon,
  js: JavaScriptIcon,
  typescript: TypeScriptIcon,
  ts: TypeScriptIcon,
  c: CIcon,
  cpp: CppIcon,
  csharp: CsharpIcon,
  cs: CsharpIcon,
  go: GoIcon,
  rust: RustIcon,
  rs: RustIcon,
  php: PhpIcon,
  kotlin: KotlinIcon,
  kt: KotlinIcon,
  swift: SwiftIcon,
  ruby: RubyIcon,
  rb: RubyIcon,
  dart: DartIcon,
  html: HtmlIcon,
  css: CssIcon,
};

export default function LanguageIcon({ language = "python", size = 18, className = "" }) {
  const key = (language || "").toLowerCase().trim();
  const IconComponent = languageIconMap[key] || PythonIcon;
  return <IconComponent size={size} className={className} />;
}
