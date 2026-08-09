import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { StepCrew } from "../StepCrew";
import { CREW } from "@/lib/catalog";
import { emptyReport, type JobReport } from "@/lib/types";

/** The standard day: out at 7, back at 4:30, half an hour of lunch → 9 hrs. */
const STANDARD = {
  startYard: "07:00",
  startJob: "07:30",
  endJob: "16:00",
  endYard: "16:30",
};

function Harness({
  initial,
  onReport,
}: {
  initial?: Partial<JobReport>;
  onReport?: (r: JobReport) => void;
}) {
  const [report, setReport] = React.useState<JobReport>(() => ({
    ...emptyReport("en"),
    ...initial,
  }));
  return (
    <StepCrew
      report={report}
      lang="en"
      update={(patch) =>
        setReport((prev) => {
          const next = { ...prev, ...patch };
          onReport?.(next);
          return next;
        })
      }
    />
  );
}

const FIRST = CREW[0];

/** Search for a crew member and pick them out of the results. */
async function addFirstMember(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("Search for a person…"), FIRST.name);
  await user.click(await screen.findByText(FIRST.name));
}

/** The per-person hours box next to a crew member's row. */
const hoursFor = (name: string) => screen.getByLabelText(`Hours — ${name}`) as HTMLInputElement;

beforeEach(() => {
  localStorage.clear();
});

describe("hours pre-filled from the day's times", () => {
  it("gives a newly added person the hours the day works out to", async () => {
    const user = userEvent.setup();
    let latest: JobReport | null = null;
    render(<Harness initial={STANDARD} onReport={(r) => (latest = r)} />);

    await addFirstMember(user);

    expect(latest!.crew[0].hours).toBe(9);
    expect(hoursFor(FIRST.name)).toHaveValue(9);
  });

  it("says where the number came from", () => {
    render(<Harness initial={{ ...STANDARD, crew: [{ id: "x", name: "Ana", roles: [], hours: 9 }] }} />);
    expect(
      screen.getByText(
        "9 hrs from today's times — change it for anyone who worked different hours"
      )
    ).toBeInTheDocument();
  });

  it("still lets each person's hours be changed afterwards", async () => {
    const user = userEvent.setup();
    let latest: JobReport | null = null;
    render(<Harness initial={STANDARD} onReport={(r) => (latest = r)} />);

    await addFirstMember(user);
    await user.clear(hoursFor(FIRST.name));
    await user.type(hoursFor(FIRST.name), "6.5");

    expect(latest!.crew[0].hours).toBe(6.5);
  });

  it("keeps a hand-typed bulk figure instead of snapping back to the suggestion", async () => {
    const user = userEvent.setup();
    let latest: JobReport | null = null;
    render(<Harness initial={STANDARD} onReport={(r) => (latest = r)} />);

    await addFirstMember(user);

    const bulk = screen.getByLabelText("Hours") as HTMLInputElement;
    await user.clear(bulk);
    await user.type(bulk, "7");
    await user.click(screen.getByRole("button", { name: "Apply to everyone" }));

    expect(latest!.crew.every((c) => c.hours === 7)).toBe(true);
    expect(bulk).toHaveValue(7);
  });

  it("asks for the times first when there are none", async () => {
    const user = userEvent.setup();
    let latest: JobReport | null = null;
    render(<Harness onReport={(r) => (latest = r)} />);

    await addFirstMember(user);

    expect(latest!.crew[0].hours).toBeNull();
    expect(
      screen.getByText("Fill in the times first and these come pre-filled")
    ).toBeInTheDocument();
  });

  it("suggests nothing while the times contradict each other", async () => {
    const user = userEvent.setup();
    let latest: JobReport | null = null;
    render(
      <Harness initial={{ ...STANDARD, endYard: "04:30" }} onReport={(r) => (latest = r)} />
    );

    await addFirstMember(user);
    expect(latest!.crew[0].hours).toBeNull();
  });

  it("brings yesterday's crew back on today's hours, not yesterday's", async () => {
    localStorage.setItem(
      "btn.jobreport.lastCrew",
      JSON.stringify([{ id: "c1", name: "Ana", roles: [], hours: 12 }])
    );
    const user = userEvent.setup();
    let latest: JobReport | null = null;
    render(<Harness initial={STANDARD} onReport={(r) => (latest = r)} />);

    await user.click(await screen.findByRole("button", { name: "Same crew as last report" }));

    expect(latest!.crew).toEqual([{ id: "c1", name: "Ana", roles: [], hours: 9 }]);
  });
});

describe("the crew total", () => {
  it("adds up what each person actually got", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={{
          ...STANDARD,
          crew: [
            { id: "a", name: "Ana", roles: [], hours: 9 },
            { id: "b", name: "Beto", roles: [], hours: 4 },
          ],
        }}
      />
    );

    expect(hoursFor("Ana")).toHaveValue(9);
    expect(hoursFor("Beto")).toHaveValue(4);
    expect(screen.getByText("13 hrs")).toBeInTheDocument();

    await user.clear(hoursFor("Beto"));
    await user.type(hoursFor("Beto"), "9");
    expect(screen.getByText("18 hrs")).toBeInTheDocument();
  });
});
