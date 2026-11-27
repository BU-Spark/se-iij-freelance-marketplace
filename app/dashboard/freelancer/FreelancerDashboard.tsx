'use client';
import { useState } from 'react';
import type { ReactNode } from 'react';
import type { DeskAssignment } from '../../types/dashboard.types';
import { taskStatus, FILTERS, type FeedFilter } from './freelancer.utils';
import { TaskCard, TaskSummary, ActiveAssignments, TaskFilters, TaskResponse } from './components';
import { useAssignmentResponses } from '../../hooks/useAssignmentResponses';
import PageSearch from '../components/PageSearch';
import SegmentedControl from '../components/SegmentedControl';
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
  const { responses, loading, error, respond, withdraw } = useAssignmentResponses();
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
      {/* laid out like the editor desk: status bar, then your work on the left and the feed on the right */}
      <div className={dashboardStyles.statusBar}>
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
      <div className={dashboardStyles.columns}>
        <div className={styles.side}>
          {children}
          <ActiveAssignments active={active} freelancerId={freelancerId} />
        </div>
        <section id="task-feed" tabIndex={-1} aria-label="Task feed" className={styles.feed}>
          <div className={dashboardStyles.sectionHead}>
            <h2 id="feed-heading" className={dashboardStyles.sectionTitle}>
              Available assignments
            </h2>
            <SegmentedControl
              label="Filter assignments"
              options={FILTERS}
              value={filter}
              onChange={(value) => {
                setFilter(value);
              }}
            />
          </div>
          <TaskFilters
            query={query}
            filter={filter}
            category={category}
            location={location}
            categories={categories}
            resultsLabel={
              matching.length
                ? `Showing ${matching.length} of ${relevant.length} assignments`
                : relevant.length === 0
                  ? 'No open assignments yet. New work shows up here as editors post it.'
                  : 'No matching tasks. Try changing or clearing your filters.'
            }
            locations={locations}
            onQueryChange={(value) => {
              setQuery(value);
            }}
            onCategoryChange={(value) => {
              setCategory(value);
            }}
            onLocationChange={(value) => {
              setLocation(value);
            }}
            onClear={() => showStatus('all')}
          />
          {error && (
            <p role="alert" className={styles.emptyState}>
              {error}
            </p>
          )}
          <ul className={styles.grid}>
            {matching.map((task) => (
              <li key={task.id}>
                <TaskCard
                  task={task}
                  freelancerId={freelancerId}
                  footer={
                    // work already assigned to this freelancer needs no answer
                    !loading && taskStatus(task, freelancerId) !== 'in-progress' ? (
                      <TaskResponse
                        title={task.title}
                        response={responses[task.id]}
                        respond={(input) => respond(task.id, input)}
                        withdraw={() => withdraw(task.id)}
                      />
                    ) : undefined
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
