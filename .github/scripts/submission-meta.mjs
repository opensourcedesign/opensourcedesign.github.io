/** Shared submission kind labels for approval and rejection emails. */

const SITE = process.env.SITE || 'https://opensourcedesign.net';

export function submissionMeta(ref) {
  if (ref.startsWith('event-edit/')) {
    return {
      kind: 'event update',
      label: 'event listing update',
      formName: 'event form',
      boardName: 'events calendar',
      viewCta: 'View your event listing',
      boardUrl: `${SITE}/events/`,
    };
  }
  if (ref.startsWith('event/')) {
    return {
      kind: 'event',
      label: 'event listing',
      formName: 'event form',
      boardName: 'events calendar',
      viewCta: 'View your event listing',
      boardUrl: `${SITE}/events/`,
    };
  }
  if (ref.startsWith('job-edit/')) {
    return {
      kind: 'job posting update',
      label: 'job posting update',
      formName: 'job form',
      boardName: 'job board',
      viewCta: 'View your job posting',
      boardUrl: `${SITE}/jobs/`,
    };
  }
  if (ref.startsWith('resource/')) {
    return {
      kind: 'resource suggestion',
      label: 'resource suggestion',
      formName: 'resource suggestion form',
      boardName: 'resources library',
      viewCta: 'View your resource',
      boardUrl: `${SITE}/resources/links/`,
    };
  }
  return {
    kind: 'job posting',
    label: 'job posting',
    formName: 'job form',
    boardName: 'job board',
    viewCta: 'View your job posting',
    boardUrl: `${SITE}/jobs/`,
  };
}
