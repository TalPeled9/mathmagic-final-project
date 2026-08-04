import 'dotenv/config';
import mongoose from 'mongoose';
import { config } from '../config/index';
import { getParentWeekReport, getReportWeekRange } from '../services/weeklyReportService';
import { renderWeeklyReportEmail } from '../emails/render';
import { formatWeekLabel } from '../services/weeklyReportDispatchService';

// Local template iteration without any HTTP round-trip:
//   npx tsx src/scripts/previewWeeklyReport.ts --parentId=<id> > preview.html
async function main() {
  const parentId = process.argv
    .find((arg) => arg.startsWith('--parentId='))
    ?.split('=')[1];

  if (!parentId) {
    console.error('Usage: tsx src/scripts/previewWeeklyReport.ts --parentId=<id>');
    process.exit(1);
  }

  await mongoose.connect(config.mongoUri);

  const range = getReportWeekRange();
  const report = await getParentWeekReport(parentId, range);
  if (!report) {
    console.error(`No parent found for id ${parentId}`);
    process.exit(1);
  }

  const { html } = await renderWeeklyReportEmail({
    parentName: report.parent.name,
    weekLabel: formatWeekLabel(range.weekStart, range.weekEnd),
    childStats: report.children,
    dashboardUrl: `${config.clientUrl}/parent`,
    unsubscribeUrl: `${config.clientUrl}/api/email-preferences/unsubscribe/preview`,
    logoUrl: `${config.clientUrl}/images/logo.png`,
  });

  process.stdout.write(html);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
