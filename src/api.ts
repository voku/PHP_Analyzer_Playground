import {normalizeAnalysisResult} from "./phpstan";

export async function analyzePhpCode(code: string) {
  const params = new URLSearchParams();
  params.append("code", code);

  const res = await fetch("https://php.moelleken.org/phpstan/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `HTTP Error: ${res.status}`);
  }

  return normalizeAnalysisResult(await res.json());
}

export async function fixPhpCode(code: string) {
  const params = new URLSearchParams();
  params.append("code", code);

  const res = await fetch("https://php.moelleken.org/php-cs-fixer/fix", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `HTTP Error: ${res.status}`);
  }

  return res.json();
}
