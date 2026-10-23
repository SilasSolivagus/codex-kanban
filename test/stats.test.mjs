import test from 'node:test'
import assert from 'node:assert/strict'
import { buildStats, formatStats } from '../plugin/src/stats.mjs'

function board() {
  return {
    schema: 2,
    projects: [
      { id: 'p1', name: 'secret-project', prefix: 'SEC', archivedAt: null, createdAt: '2026-10-01T00:00:00.000Z' },
      { id: 'p2', name: 'archived-project', prefix: 'ARC', archivedAt: '2026-10-10T00:00:00.000Z', createdAt: '2026-09-01T00:00:00.000Z' },
    ],
    tasks: [
      {
        id: 't1', projectId: 'p1', identifier: 'SEC-1', title: 'Secret task title',
        status: 'in_progress', archivedAt: null,
        labels: ['auth', 'auth', 'ui'],
        links: [{ id: 'l1', label: 'x', url: 'https://example.com' }],
        attachments: [{ id: 'a1' }],
        comments: [{ id: 'c1' }, { id: 'c2' }],
        pendingQuestion: { prompt: 'secret?', createdAt: '2026-10-23T00:00:00.000Z' },
        activity: [{ at: '2026-10-23T00:00:00.000Z' }, { at: '2026-10-01T00:00:00.000Z' }],
      },
      { id: 't2', projectId: 'p1', identifier: 'SEC-2', title: 'Archived task', status: 'todo', archivedAt: '2026-10-20T00:00:00.000Z', labels: [], links: [], attachments: [], comments: [], activity: [] },
      { id: 't3', projectId: 'p1', identifier: 'SEC-3', title: 'Done task', status: 'done', archivedAt: null, labels: [], links: [], attachments: [], comments: [], activity: [] },
    ],
  }
}

test('stats count projects, columns, attention and content without leaking text', () => {
  const stats = buildStats(board(), { now: Date.parse('2026-10-24T00:00:00.000Z'), version: '0.7.3', platform: 'test', node: '22.0.0' })
  assert.equal(stats.projects.total, 2)
  assert.equal(stats.projects.archived, 1)
  assert.equal(stats.tasks.total, 3)
  assert.equal(stats.tasks.archived, 1)
  assert.equal(stats.tasks.byColumn.running, 0)
  assert.equal(stats.tasks.byColumn.done, 1)
  assert.equal(stats.tasks.byColumn.needs, 1)
  assert.equal(stats.attention.question, 1)
  assert.equal(stats.content.comments, 2)
  assert.equal(stats.content.attachments, 1)
  assert.equal(stats.content.links, 1)
  assert.equal(stats.content.distinctLabels, 2)
  assert.equal(stats.activity.last7d, 1)

  const json = JSON.stringify(stats)
  assert.doesNotMatch(json, /secret-project|archived-project|Secret task title|secret\?/)
  assert.doesNotMatch(json, /\/Users\//)
})

test('archived tasks are not counted in a column', () => {
  const stats = buildStats(board(), { now: Date.parse('2026-10-24T00:00:00.000Z') })
  assert.equal(stats.tasks.byColumn.backlog, 0)
  assert.equal(stats.tasks.byStatus.todo, 1)
})

test('the human summary explains what is and is not included', () => {
  const text = formatStats(buildStats(board(), { now: Date.parse('2026-10-24T00:00:00.000Z'), version: '0.7.3' }))
  assert.match(text, /Codex Kanban usage/)
  assert.match(text, /no repository path, project names, task titles or session content/)
  assert.match(text, /discussions\/1/)
})
