import { triggerBackupEmailCheck } from "../../lib/scheduledBackupTrigger";

export default async () => {
  await triggerBackupEmailCheck();
};
