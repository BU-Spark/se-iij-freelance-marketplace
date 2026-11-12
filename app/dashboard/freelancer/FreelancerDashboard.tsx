'use client';
import { useState } from 'react';
import type { ReactNode } from 'react';
import type { DeskAssignment } from '../../types/dashboard.types';
import { taskStatus, type FeedFilter } from './freelancer.utils';
import { TaskCard, TaskSummary, ActiveAssignments, TaskFilters } from './components';
import PageSearch from '../components/PageSearch';
import { formatDeskDate } from '../../utils/dashboard.utils';
import styles from './freelancer.module.css';
import dashboardStyles from '../dashboard.module.css';

export type FreelancerDashboardProps = {
  assignments: DeskAssignment[];
  freelancerId: string;
  dateLabel?: string;
  children?: ReactNode;
};

const byDeadline = (a: DeskAssignment, b: DeskAssignment) =>
  (a.deadline?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.deadline?.getTime() ?? Number.MAX_SAFE_INTEGER);

export default function FreelancerDashboard({
  assignments,
  freelancerId,
  dateLabel = formatDeskDate(new Date()),
  children,
}: FreelancerDashboardProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FeedFilter>('all');
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
    .sort(byDeadline);
  const normalizedQuery = query.trim().toLowerCase();
  const matching = relevant
    .filter(
      (task) =>
        (filter === 'all' || taskStatus(task, freelancerId) === filter) &&
        (!category || task.category === category) &&
        (!location || task.location === location) &&
        [task.title, task.category, task.type, task.location, task.contact.name, task.contact.desk].some((value) =>
          value?.toLowerCase().includes(normalizedQuery)
        )
    )
    .sort(byDeadline);

  const showStatus = (status: FeedFilter) => {
    setFilter(status);
    setQuery('');
    setCategory('');
    setLocation('');
  };

  return (
    <>
      <div className={styles.statusBar}>
        <div className={dashboardStyles.statusLead}>
          <p>
            <strong>{dateLabel}</strong>
          </p>
          <PageSearch targetId="task-feed" />
        </div>
        <TaskSummary
          openCount={relevant.filter((task) => taskStatus(task, freelancerId) === 'open').length}
          invitedCount={relevant.filter((task) => taskStatus(task, freelancerId) === 'invited').length}
          activeCount={active.length}
          onSelect={showStatus}
        />
      </div>
      {children}
      <ActiveAssignments active={active} freelancerId={freelancerId} />
      <section id="task-feed" tabIndex={-1} aria-label="Task feed" className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="feed-heading">Available assignments</h2>
          </div>
        </div>
        <TaskFilters
          query={query}
          filter={filter}
          category={category}
          location={location}
          categories={categories}
          locations={locations}
          onQueryChange={(value) => {
            setQuery(value);
          }}
          onFilterChange={(value) => {
            setFilter(value);
          }}
          onCategoryChange={(value) => {
            setCategory(value);
          }}
          onLocationChange={(value) => {
            setLocation(value);
          }}
          onClear={() => showStatus('all')}
        />
        <p role="status">
          {matching.length
            ? `Showing ${matching.length} of ${relevant.length} assignments`
            : relevant.length === 0
              ? 'No open assignments yet. New work shows up here as editors post it.'
              : 'No matching tasks. Try changing or clearing your filters.'}
        </p>
        <ul className={styles.grid}>
          {matching.map((task) => (
            <li key={task.id}>
              <TaskCard task={task} freelancerId={freelancerId} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
