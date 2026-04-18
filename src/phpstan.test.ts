import test from "node:test";
import assert from "node:assert/strict";
import {countAnalysisIssues, normalizeAnalysisResult} from "./phpstan";

test("normalizeAnalysisResult handles current PHPStan messages arrays", () => {
  const result = normalizeAnalysisResult({
    totals: {errors: 0, file_errors: 1},
    files: {
      "/tmp/example.php": {
        errors: 1,
        messages: [
          {
            message: "Dumped type: 1",
            line: 8,
            ignorable: false,
            identifier: "phpstan.dumpType",
          },
        ],
      },
    },
  });

  assert.deepEqual(result, {
    files: {
      "/tmp/example.php": {
        errors: [
          {
            message: "Dumped type: 1",
            line: 8,
            ignorable: false,
            identifier: "phpstan.dumpType",
          },
        ],
      },
    },
    message: undefined,
  });
});

test("normalizeAnalysisResult keeps legacy errors arrays usable", () => {
  const result = normalizeAnalysisResult({
    files: {
      "/tmp/example.php": {
        errors: [
          {
            message: "Undefined variable: $foo",
            line: 3,
            ignorable: true,
          },
        ],
      },
    },
  });

  assert.deepEqual(result.files?.["/tmp/example.php"]?.errors, [
    {
      message: "Undefined variable: $foo",
      line: 3,
      ignorable: true,
      identifier: undefined,
    },
  ]);
});

test("countAnalysisIssues splits errors and warnings", () => {
  const counts = countAnalysisIssues({
    files: {
      "/tmp/example.php": {
        errors: [
          {message: "error", line: 1, ignorable: false},
          {message: "warning", line: 2, ignorable: true},
        ],
      },
    },
  });

  assert.deepEqual(counts, {errors: 1, warnings: 1});
});
