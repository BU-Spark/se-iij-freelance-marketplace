'use client';

import { useState } from 'react';
import type { DeskAssignment } from '../../types/dashboard.types';
import { formatDeadline, formatRate } from '../../utils/dashboard.utils';
import styles from './freelancer.module.css';

type FeedFilter = 'all' | 'open' | 'invited' | 'in-progress';
const PAGE_SIZE = 4;
const FILTERS: { value: FeedFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'invited', label: 'Invited' },
  { value: 'in-progress', label: 'In progress' },
];

function taskStatus(task: DeskAssignment, freelancerId: string): Exclude<FeedFilter, 'all'> {
  if (task.assignedToId === freelancerId && task.status === 'assigned') return 'in-progress';
  if (task.invitedIds?.includes(freelancerId) && task.status !== 'assigned') return 'invited';
  return 'open';
}

function TaskCard({ task, freelancerId }: { task: DeskAssignment; freelancerId: string }) {
  const status = taskStatus(task, freelancerId);
  return (
    <article className={styles.card}>
      <div className={styles.tags}>
        <span className={styles[status]}>{FILTERS.find((item) => item.value === status)?.label}</span>
        {task.urgent && <span className={styles.urgent}>Urgent</span>}
        <span>{task.category}</span>
      </div>
      <h3>{task.title}</h3>
      <p>
        {task.contact.name} · {task.contact.desk}
      </p>
      <dl className={styles.details}>
        <div>
          <dt>Location</dt>
          <dd>{task.location}</dd>
        </div>
        <div>
          <dt>Compensation</dt>
          <dd>{formatRate(task.rate)}</dd>
        </div>
        <div>
          <dt>Deadline</dt>
          <dd>{formatDeadline(task.deadline)}</dd>
        </div>
        <div>
          <dt>Type / length</dt>
          <dd>
            {task.type} · {task.length}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export default function FreelancerDashboard({
  assignments,
  freelancerId,
}: {
  assignments: DeskAssignment[];
  freelancerId: string;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  // An invitation or assignment for another freelancer must not become a personal task.
  const relevant = assignments.filter(
    (task) =>
      task.status === 'open' ||
      (task.status === 'invited' && task.invitedIds?.includes(freelancerId)) ||
      (task.status === 'assigned' && task.assignedToId === freelancerId)
  );
  const categories = [...new Set(relevant.map((task) => task.category))].sort();
  const locations = [...new Set(relevant.map((task) => task.location))].sort();
  const active = relevant
    .filter((task) => task.status === 'assigned' && task.assignedToId === freelancerId)
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  const normalizedQuery = query.trim().toLowerCase();
  const matching = relevant
    .filter(
      (task) =>
        (filter === 'all' || taskStatus(task, freelancerId) === filter) &&
        (!category || task.category === category) &&
        (!location || task.location === location) &&
        [task.title, task.category, task.type, task.location, task.contact.name, task.contact.desk].some((value) =>
          value.toLowerCase().includes(normalizedQuery)
        )
    )
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  const pageCount = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = matching.slice(start, start + PAGE_SIZE);

  const showStatus = (status: FeedFilter) => {
    setFilter(status);
    setQuery('');
    setCategory('');
    setLocation('');
    setPage(1);
  };

  return (
    <>
      <ul className={styles.summary} aria-label="Task summary">
        <li>
          <a href="#task-feed" onClick={() => showStatus('open')}>
            <strong>{relevant.filter((task) => taskStatus(task, freelancerId) === 'open').length}</strong> Open
            opportunities
          </a>
        </li>
        <li>
          <a href="#task-feed" onClick={() => showStatus('invited')}>
            <strong>{relevant.filter((task) => taskStatus(task, freelancerId) === 'invited').length}</strong>{' '}
            Invitations
          </a>
        </li>
        <li>
          <a href="#task-feed" onClick={() => showStatus('in-progress')}>
            <strong>{active.length}</strong> In progress
          </a>
        </li>
      </ul>
      <section aria-labelledby="active-heading" className={styles.section}>
        <h2 id="active-heading">In progress</h2>
        <p>Your assigned work, ordered by deadline. This section stays visible while you filter the task feed.</p>
        {active.length ? (
          <ul className={styles.grid}>
            {active.map((task) => (
              <li key={task.id}>
                <TaskCard task={task} freelancerId={freelancerId} />
              </li>
            ))}
          </ul>
        ) : (
          <p>No assignments in progress.</p>
        )}
      </section>
      <section id="task-feed" tabIndex={-1} aria-labelledby="feed-heading" className={styles.section}>
        <h2 id="feed-heading">Task feed</h2>
        <p>Open opportunities, your invitations, and your ongoing work. Soonest deadlines first.</p>
        <div className={styles.controls}>
          <label>
            Search tasks
            <input
              type="search"
              value={query}
              placeholder="Title, specialty, location, or editor"
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <label>
            Status
            <select
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value as FeedFilter);
                setPage(1);
              }}
            >
              {FILTERS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All categories</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            Location
            <select
              value={location}
              onChange={(event) => {
                setLocation(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All locations</option>
              {locations.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={!query && filter === 'all' && !category && !location}
            onClick={() => {
              setQuery('');
              setFilter('all');
              setCategory('');
              setLocation('');
              setPage(1);
            }}
          >
            Clear filters
          </button>
        </div>
        <p role="status">
          {matching.length
            ? `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, matching.length)} of ${matching.length} tasks`
            : 'No matching tasks. Try changing or clearing your filters.'}
        </p>
        <ul className={styles.grid}>
          {visible.map((task) => (
            <li key={task.id}>
              <TaskCard task={task} freelancerId={freelancerId} />
            </li>
          ))}
        </ul>
        <nav aria-label="Task feed pagination" className={styles.pagination}>
          <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
            Previous
          </button>
          <span>
            Page {currentPage} of {pageCount}
          </span>
          <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>
            Next
          </button>
        </nav>
      </section>
    </>
  );
}
