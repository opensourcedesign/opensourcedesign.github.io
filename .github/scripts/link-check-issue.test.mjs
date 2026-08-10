import assert from 'node:assert/strict';
import test from 'node:test';
import { parseLycheeReportContent } from './link-check-issue.mjs';

test('parseLycheeReportContent reads a single JSON object', () => {
  const report = parseLycheeReportContent(
    JSON.stringify({
      fail_map: {
        'https://opensourcedesign.net/a': [{ url: 'https://example.com/broken', status: '404' }],
      },
    }),
  );
  assert.equal(Object.keys(report.fail_map).length, 1);
});

test('parseLycheeReportContent ignores trailing content after the root object', () => {
  const report = parseLycheeReportContent(
    '{"fail_map":{"https://opensourcedesign.net/a":[{"url":"https://example.com/broken","status":"404"}]}}\n{"extra":"noise"}',
  );
  assert.equal(Object.keys(report.fail_map).length, 1);
});

test('parseLycheeReportContent merges JSONL fail_map entries', () => {
  const report = parseLycheeReportContent(
    [
      '{"fail_map":{"https://opensourcedesign.net/a":[{"url":"https://example.com/one","status":"404"}]}}',
      '{"fail_map":{"https://opensourcedesign.net/b":[{"url":"https://example.com/two","status":"500"}]}}',
    ].join('\n'),
  );
  assert.equal(Object.keys(report.fail_map).length, 2);
});
