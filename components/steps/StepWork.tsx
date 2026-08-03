"use client";

import { t } from "@/lib/i18n";
import type { JobReport, Lang } from "@/lib/types";
import { DescriptionField } from "../DescriptionField";
import { PhotosField } from "../PhotosField";
import { Section, TextArea } from "../ui";

export function StepWork({
  report,
  lang,
  update,
}: {
  report: JobReport;
  lang: Lang;
  update: (patch: Partial<JobReport>) => void;
}) {
  return (
    <div className="space-y-4">
      <Section title={t("stepWork", lang)}>
        <DescriptionField
          lang={lang}
          value={report.description}
          onChange={(description) => update({ description })}
        />
      </Section>

      <Section title={t("photos", lang)} hint={t("photosHint", lang)}>
        <PhotosField lang={lang} value={report.photos} onChange={(photos) => update({ photos })} />
      </Section>

      <Section title={t("notes", lang)} hint={t("optional", lang)}>
        <TextArea
          hideLabel
          label={t("notes", lang)}
          rows={3}
          value={report.notes}
          onChange={(notes) => update({ notes })}
        />
      </Section>
    </div>
  );
}
