import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { StepTimes } from "../StepTimes";
import { emptyReport, type JobReport } from "@/lib/types";

function Harness({ initial }: { initial?: Partial<JobReport> }) {
  const [report, setReport] = React.useState<JobReport>(() => ({
    ...emptyReport("en"),
    ...initial,
  }));
  return (
    <StepTimes
      report={report}
      lang="en"
      update={(patch) => setReport((prev) => ({ ...prev, ...patch }))}
    />
  );
}

const STANDARD = {
  startYard: "07:00",
  startJob: "07:30",
  endJob: "16:00",
  endYard: "16:30",
};

const field = (label: string) => screen.getByLabelText(label) as HTMLInputElement;

describe("entering the day's times", () => {
  it("shows nothing but a prompt before any time is entered", () => {
    render(<Harness />);
    expect(
      screen.getByText("Fill in the four times and the hours are worked out for you.")
    ).toBeInTheDocument();
  });

  it("works the hours out as soon as both ends of the day are in", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(field("Left the yard"), "07:00");
    await user.type(field("Back at the yard"), "16:30");

    // 9.5 hours on the clock, 30 minutes of it unpaid lunch.
    expect(screen.getByText("9")).toBeInTheDocument();
  });

  it("recalculates when the lunch length changes", async () => {
    const user = userEvent.setup();
    render(<Harness initial={STANDARD} />);

    expect(screen.getByText("9")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "0 min" }));
    expect(screen.getByText("9.5")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "60 min" }));
    expect(screen.getByText("8.5")).toBeInTheDocument();
  });

  it("marks the lunch actually in force", () => {
    render(<Harness initial={STANDARD} />);
    expect(screen.getByRole("radio", { name: "30 min" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "0 min" })).not.toBeChecked();
  });

  it("stamps the current time on the Now button, snapped to five minutes", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getAllByRole("button", { name: "Now" })[0]);

    const value = field("Left the yard").value;
    expect(value).toMatch(/^\d{2}:\d{2}$/);
    expect(Number(value.slice(3)) % 5).toBe(0);
  });
});

describe("times that contradict each other", () => {
  it("flags an arrival that comes before leaving the yard, naming what it must follow", async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ startYard: "07:00" }} />);

    await user.type(field("Arrived at job"), "06:30");

    expect(screen.getByRole("alert")).toHaveTextContent(
      'Cannot be earlier than “Left the yard”'
    );
    expect(field("Arrived at job")).toBeInvalid();
    expect(screen.getByText("Fix the times marked in red to continue")).toBeInTheDocument();
  });

  it("flags the AM/PM slip on the return to the yard", async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ ...STANDARD, endYard: "" }} />);

    await user.type(field("Back at the yard"), "04:30");

    expect(screen.getByRole("alert")).toHaveTextContent(
      'Cannot be earlier than “Left the job”'
    );
  });

  it("refuses to show hours while a time is contradictory", async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ ...STANDARD, endYard: "" }} />);

    await user.type(field("Back at the yard"), "04:30");
    expect(screen.queryByText("9")).not.toBeInTheDocument();
  });

  it("clears the error as soon as the time is corrected", async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ ...STANDARD, endYard: "04:30" }} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();

    await user.clear(field("Back at the yard"));
    await user.type(field("Back at the yard"), "16:30");

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
  });

  it("leaves a real night shift alone", () => {
    render(
      <Harness
        initial={{
          startYard: "22:00",
          startJob: "22:30",
          endJob: "01:00",
          endYard: "01:30",
          lunchMinutes: 0,
        }}
      />
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("3.5")).toBeInTheDocument();
  });

  it("marks only the offending field, not the whole form", async () => {
    const user = userEvent.setup();
    render(<Harness initial={STANDARD} />);

    await user.clear(field("Arrived at job"));
    await user.type(field("Arrived at job"), "05:00");

    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(field("Left the yard")).toBeValid();
    expect(field("Back at the yard")).toBeValid();
  });
});
