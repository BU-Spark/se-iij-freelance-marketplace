export type CalendarProvider = 'google' | 'apple';

export type AvailabilitySource = 'manual' | 'calendar';

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type WorkingWindow = {
  startsAt: string;
  endsAt: string;
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
  calendarConnection?: CalendarConnection;
  updatedAt: Date;
};
