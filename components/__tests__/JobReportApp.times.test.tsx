import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { JobReportApp } from "../JobReportApp";
import { CREW } from "@/lib/catalog";

/**
 * The wizard lets you skip almost anything — it is a paper form, and a foreman
 * standing in a driveway should never be trapped. Contradictory times are the
 * one exception: a wrong AM/PM doubles a payroll day, and by the review screen
 * nobody remembers what the real times were.
 */

beforeEach(() => {
  localStorage.clear();
  // Pin the UI language so the assertions below can quote real labels.
  localStorage.setItem("btn.jobreport.lang", "en");
});

/** Walk from the job step to the times step. */
async function goToTimes(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: "Next" }));
  await screen.findByLabelText("Left the yard");
}

describe("moving past the times step", () => {
  it("blocks Next while a time contradicts another, and frees it once fixed", async () => {
    const user = userEvent.setup();
    render(<JobReportApp />);
    await goToTimes(user);

    await user.type(screen.getByLabelText("Left the yard"), "07:00");
    await user.type(screen.getByLabelText("Back at the yard"), "04:30");

    const next = screen.getByRole("button", { name: "Next" });
    expect(next).toBeDisabled();

    await user.click(next);
    // Still on the times step — the click did nothing.
    expect(screen.getByLabelText("Left the yard")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Back at the yard"));
    await user.type(screen.getByLabelText("Back at the yard"), "16:30");

    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByPlaceholderText("Search for a person…")).toBeInTheDocument();
  });

  it("lets an untouched times step through — every field is still optional", async () => {
    const user = userEvent.setup();
    render(<JobReportApp />);
    await goToTimes(user);

    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("carries the day's hours through to the crew step", async () => {
    const user = userEvent.setup();
    render(<JobReportApp />);
    await goToTimes(user);

    await user.type(screen.getByLabelText("Left the yard"), "07:00");
    await user.type(screen.getByLabelText("Back at the yard"), "16:30");
    await user.click(screen.getByRole("button", { name: "Next" }));

    const search = await screen.findByPlaceholderText("Search for a person…");
    await user.type(search, CREW[0].name);
    await user.click(await screen.findByText(CREW[0].name));

    // 7:00 → 4:30 less the 30-minute lunch, already on the person's row.
    expect(screen.getByLabelText(`Hours — ${CREW[0].name}`)).toHaveValue(9);
    expect(
      screen.getByText(
        "9 hrs from today's times — change it for anyone who worked different hours"
      )
    ).toBeInTheDocument();
  });
});
