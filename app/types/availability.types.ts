export type CalendarProvider = 'google' | 'apple';

export type AvailabilitySource = 'manual' | 'calendar';

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type WorkingWindow = {
  startsAt: string;
  endsAt: string;
};

/** A single date that overrides the weekly pattern, e.g. a booked-out Friday */
export type AvailabilityException = {
  /** YYYY-MM-DD, the date where the person is */
  date: string;
  /** false = not working that date at all, true = working the usual window even if the weekday says no */
  available: boolean;
};

export type CalendarConnection = {
  provider: CalendarProvider;
  calendarId?: string;
  connectedAt: Date;
  link: string;
};

export type Availability = {
  source: AvailabilitySource;
  timezone: string;
  days: Weekday[];
  typicalWorkingWindow: WorkingWindow;
  /** dates that do not follow the weekly pattern */
  exceptions: AvailabilityException[];
  calendarConnection?: CalendarConnection;
  updatedAt: Date;
};
