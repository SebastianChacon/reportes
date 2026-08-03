import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { StepJob } from "../StepJob";
import { emptyReport, type JobReport } from "@/lib/types";

/**
 * Regression coverage for the bug where typing a job/truck number and
 * navigating away (or blurring) without pressing "+" or Enter silently
 * dropped the value — it never made it into the lifted `report` state,
 * so it looked "empty" on return and blocked sending (jobNumbers is
 * required, see lib/calc.ts missingRequired).
 */
function Harness({ onReport }: { onReport?: (r: JobReport) => void }) {
  const [report, setReport] = React.useState<JobReport>(() => emptyReport("en"));
  const update = (patch: Partial<JobReport>) => {
    setReport((prev) => {
      const next = { ...prev, ...patch };
      onReport?.(next);
      return next;
    });
  };
  return <StepJob report={report} lang="en" update={update} />;
}

describe("StepJob chip inputs", () => {
  it("commits a job number typed but not confirmed with + or Enter, on blur", async () => {
    const user = userEvent.setup();
    let latest: JobReport | null = null;
    render(<Harness onReport={(r) => (latest = r)} />);

    const jobInput = screen.getByPlaceholderText("e.g. 21550");
    await user.type(jobInput, "21550");
    // Tab away instead of clicking "+" or pressing Enter — this is what
    // happens when the user just moves on to the next field/step.
    await user.tab();

    expect(latest?.jobNumbers).toEqual(["21550"]);
    expect(screen.getByText("#21550")).toBeInTheDocument();
  });

  it("commits a truck number typed but not confirmed with + or Enter, on blur", async () => {
    const user = userEvent.setup();
    let latest: JobReport | null = null;
    render(<Harness onReport={(r) => (latest = r)} />);

    const truckInput = screen.getByPlaceholderText("e.g. 28");
    await user.type(truckInput, "28");
    await user.tab();

    expect(latest?.truckNumbers).toEqual(["28"]);
    expect(screen.getByText("#28")).toBeInTheDocument();
  });

  it("still supports the explicit Add button and Enter key", async () => {
    const user = userEvent.setup();
    let latest: JobReport | null = null;
    render(<Harness onReport={(r) => (latest = r)} />);

    const jobInput = screen.getByPlaceholderText("e.g. 21550");
    await user.type(jobInput, "100");
    await user.click(screen.getAllByRole("button", { name: "Add" })[0]);
    expect(latest?.jobNumbers).toEqual(["100"]);

    await user.type(jobInput, "200{Enter}");
    expect(latest?.jobNumbers).toEqual(["100", "200"]);
  });

  it("does not add a blank or duplicate chip on blur", async () => {
    const user = userEvent.setup();
    let latest: JobReport | null = null;
    render(<Harness onReport={(r) => (latest = r)} />);

    const jobInput = screen.getByPlaceholderText("e.g. 21550");

    // Blurring an empty field must not create an empty chip.
    await user.click(jobInput);
    await user.tab();
    expect(latest).toBeNull();

    await user.type(jobInput, "300");
    await user.tab();
    expect(latest?.jobNumbers).toEqual(["300"]);

    // Typing the same value again and blurring must not duplicate it.
    await user.click(jobInput);
    await user.type(jobInput, "300");
    await user.tab();
    expect(latest?.jobNumbers).toEqual(["300"]);
  });
});
