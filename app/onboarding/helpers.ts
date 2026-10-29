import type { FieldError, ProfileErrors, Touched } from '../types/onboarding.types';

/** Adds a value to a chip list, or removes it when it is already selected */
export const toggleValue = (list: string[], value: string) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

/** Wraps a step's error map so messages only appear after the field has been touched */
export const fieldError =
  (errors: ProfileErrors, touched: Touched): FieldError =>
  (key) =>
    touched[key] ? errors[key] : undefined;

/**
 * ChipGroup speaks labels, the form stores ids. This adapts an id/label list into a single-select
 * set of chip props, with `toId` mapping the picked label back to the stored value.
 */
export const singleChoice = <T extends string>(options: { id: T; label: string }[], value: T) => ({
  options: options.map((option) => option.label),
  selected: options.filter((option) => option.id === value).map((option) => option.label),
  toId: (label: string) => options.find((option) => option.label === label)?.id ?? value,
});
