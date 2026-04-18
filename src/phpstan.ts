export type PhpStanIssue = {
  message: string;
  line: number;
  ignorable: boolean;
  identifier?: string;
};

export type AnalysisFileResult = {
  errors?: PhpStanIssue[];
};

export type AnalysisResult = {
  message?: string;
  files?: Record<string, AnalysisFileResult>;
};

type RawIssue = Partial<PhpStanIssue>;

type RawFileResult = {
  errors?: number | RawIssue[];
  messages?: RawIssue[];
};

function normalizeIssue(issue: RawIssue): PhpStanIssue {
  return {
    message: typeof issue.message === "string" ? issue.message : "Unknown PHPStan issue",
    line: typeof issue.line === "number" && issue.line > 0 ? issue.line : 1,
    ignorable: Boolean(issue.ignorable),
    identifier: typeof issue.identifier === "string" ? issue.identifier : undefined,
  };
}

function normalizeFileResult(fileResult: RawFileResult | undefined): AnalysisFileResult {
  const rawIssues = Array.isArray(fileResult?.errors)
    ? fileResult.errors
    : Array.isArray(fileResult?.messages)
      ? fileResult.messages
      : [];

  return {
    errors: rawIssues.map(normalizeIssue),
  };
}

export function normalizeAnalysisResult(result: unknown): AnalysisResult {
  if (!result || typeof result !== "object") {
    return {};
  }

  const typedResult = result as {
    message?: unknown;
    files?: Record<string, RawFileResult>;
  };

  const files = typedResult.files && typeof typedResult.files === "object"
    ? Object.fromEntries(
        Object.entries(typedResult.files).map(([filename, fileResult]) => [
          filename,
          normalizeFileResult(fileResult),
        ]),
      )
    : undefined;

  return {
    message: typeof typedResult.message === "string" ? typedResult.message : undefined,
    files,
  };
}

export function countAnalysisIssues(result: AnalysisResult | null) {
  let errors = 0;
  let warnings = 0;

  Object.values(result?.files ?? {}).forEach((fileResult) => {
    (fileResult.errors ?? []).forEach((issue) => {
      if (issue.ignorable) {
        warnings += 1;
      } else {
        errors += 1;
      }
    });
  });

  return {errors, warnings};
}
