export const MAINTENANCE_HEADLINE = "MAINTENANCE MODE";
export const MAINTENANCE_SUBTEXT = "App not accessible";
export const MAINTENANCE_ANNOUNCEMENT = `${MAINTENANCE_HEADLINE} — ${MAINTENANCE_SUBTEXT}`;

export function MaintenanceOverlay() {
  return (
    <div className="maintenance-overlay" role="alertdialog" aria-modal="true" aria-labelledby="maintenance-title">
      <div className="maintenance-overlay-inner">
        <h1 id="maintenance-title">{MAINTENANCE_HEADLINE}</h1>
        <p>{MAINTENANCE_SUBTEXT}</p>
      </div>
    </div>
  );
}
