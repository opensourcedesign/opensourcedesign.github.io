import assert from 'node:assert/strict';
import test from 'node:test';
import { hugoSlugFromTitle, jobPermalinkFromFields } from './hugo-job-slug.mjs';

const SITE = 'https://opensourcedesign.net';

test('hugoSlugFromTitle keeps slashes as path segments', () => {
  assert.equal(
    hugoSlugFromTitle('Senior UX/UI Designer, OpenProject'),
    'senior-ux/ui-designer-openproject',
  );
  assert.equal(hugoSlugFromTitle('UI/UX Designer Test'), 'ui/ux-designer-test');
  assert.equal(hugoSlugFromTitle('Foo/Bar Baz'), 'foo/bar-baz');
});

test('hugoSlugFromTitle handles titles without slashes', () => {
  assert.equal(hugoSlugFromTitle('TOR UX Lead'), 'tor-ux-lead');
});

test('jobPermalinkFromFields prefers explicit slug over title', () => {
  assert.equal(
    jobPermalinkFromFields({ title: 'Senior UX/UI Designer', slug: 'ui-ux-designer' }, SITE),
    `${SITE}/jobs/ui-ux-designer/`,
  );
});

test('jobPermalinkFromFields derives slug from title when slug omitted', () => {
  assert.equal(
    jobPermalinkFromFields({ title: 'Senior UX/UI Designer, OpenProject' }, SITE),
    `${SITE}/jobs/senior-ux/ui-designer-openproject/`,
  );
});
