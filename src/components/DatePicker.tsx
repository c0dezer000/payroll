import React from "react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface Props {
  mode?: "single" | "range" | "month" | "year";
  value?: Date | null;
  onChange: (d: Date | null) => void;
  className?: string;
}

const DatePicker: React.FC<Props> = ({ mode = "single", value = null, onChange, className }) => {
  // Use a constrained container so the calendar doesn't overflow and overlap modal content.
  const containerClass = `${className || ""} max-h-[40vh] overflow-auto w-full`;

  if (mode === "month") {
    // For month selection we'll show a normal DayPicker but when a day is picked
    // we'll normalize to the first day of the month. Use caption buttons to avoid dropdown popovers.
    return (
      <div className={containerClass}>
        <DayPicker
          {...({
            mode: "single",
            selected: value || undefined,
            onSelect: (d: Date | undefined | null) => onChange(d ? new Date(d.getFullYear(), d.getMonth(), 1) : null),
            captionLayout: "dropdown",
            className: "w-full",
          } as any)}
        />
      </div>
    );
  }

  if (mode === "year") {
    // Year-only: pick any day but normalize to Jan 1 of the year; caption buttons avoid overlapping dropdowns.
    return (
      <div className={containerClass}>
        <DayPicker
          {...({
            mode: "single",
            selected: value || undefined,
            onSelect: (d: Date | undefined | null) => onChange(d ? new Date(d.getFullYear(), 0, 1) : null),
            captionLayout: "dropdown",
            className: "w-full",
          } as any)}
        />
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <DayPicker
        {...({
          mode: mode === "range" ? "range" : "single",
          selected: value || undefined,
          onSelect: onChange,
          captionLayout: "dropdown",
          className: "w-full",
        } as any)}
      />
    </div>
  );
};

export default DatePicker;
