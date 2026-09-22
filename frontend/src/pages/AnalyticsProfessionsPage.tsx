import { AnalyticsPageShell } from "../components/AnalyticsPageShell";
import { BarList } from "../components/charts/BarList";
import { ChartCard } from "../components/charts/ChartCard";
import { PieChart } from "../components/charts/PieChart";
import { StackedBars } from "../components/charts/StackedBars";
import { yearProfessionStacks } from "../components/charts/yearStacks";
import { useAnalyticsScope } from "../hooks/useAnalyticsScope";
import { titleCase } from "../utils/format";

export function AnalyticsProfessionsPage() {
  const { professions, toggleProfession } = useAnalyticsScope();

  return (
    <AnalyticsPageShell eyebrow="Professions" title="Profession report">
      {({ analytics }) => {
        const { colors, groups } = yearProfessionStacks(analytics);

        const leader = analytics.byProfession[0];
        const runnerUp = analytics.byProfession[1];

        return (
          <>
            <section
              className="kpi-row reveal-2"
              aria-label="Profession headlines"
            >
              <article className="kpi">
                <p className="kpi__label">Distinct roles</p>
                <p className="kpi__value">{analytics.professionCount}</p>
              </article>
              <article className="kpi">
                <p className="kpi__label">Leading role</p>
                <p className="kpi__value kpi__value--text">
                  {leader ? titleCase(leader.label) : "—"}
                </p>
              </article>
              <article className="kpi">
                <p className="kpi__label">Runner-up</p>
                <p className="kpi__value kpi__value--text">
                  {runnerUp ? titleCase(runnerUp.label) : "—"}
                </p>
              </article>
            </section>

            <div className="chart-grid reveal-3">
              <ChartCard
                title="Profession share"
                description="Pie view of how this report divides across roles. Click a slice to filter."
              >
                <PieChart
                  caption="Profession share"
                  selectedIds={professions}
                  onSelect={toggleProfession}
                  data={analytics.byProfession.map((entry) => ({
                    id: entry.label,
                    label: titleCase(entry.label),
                    value: entry.count,
                    color: colors.get(entry.label) ?? "#3b82f6",
                  }))}
                />
              </ChartCard>

              <ChartCard
                title="Headcount by profession"
                description="Absolute counts ranked largest to smallest. Click a row to toggle that profession."
              >
                <BarList
                  total={analytics.totalUsers}
                  selectedIds={professions}
                  onSelect={toggleProfession}
                  items={analytics.byProfession.map((entry) => ({
                    id: entry.label,
                    label: titleCase(entry.label),
                    value: entry.count,
                  }))}
                />
              </ChartCard>

              <ChartCard
                title="Who joined each year"
                description="Each bar uses the same profession order as the legend (top → bottom). Click a legend item to filter."
                span="full"
              >
                <StackedBars
                  groups={groups}
                  caption="Yearly profession intake"
                />
                <ul className="legend">
                  {analytics.byProfession.map((entry) => (
                    <li
                      className={`legend__item is-clickable${professions.some((item) => item.toLowerCase() === entry.label.toLowerCase()) ? " is-selected" : ""}`}
                      key={entry.label}
                      onClick={() => toggleProfession(entry.label)}
                    >
                      <span
                        className="legend__swatch"
                        style={{ background: colors.get(entry.label) }}
                        aria-hidden="true"
                      />
                      {titleCase(entry.label)}
                    </li>
                  ))}
                </ul>
              </ChartCard>
            </div>
          </>
        );
      }}
    </AnalyticsPageShell>
  );
}
