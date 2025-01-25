import cron from "node-cron";
import { BatchRepository } from "../api/batch/birthday-repository";

// Schedule the batch job to run at 9:00 AM daily
cron.schedule("0 10 * * *", async () => {
  console.log("Running daily batch job at 9:00 AM");

  try {
    const batchRepo1 = new BatchRepository();
    await batchRepo1.BirthdayRepositoryV1();
    const batchRepo2 = new BatchRepository();
    await batchRepo2.WeedingWishRepositoryV1();
    console.log("Daily batch job completed successfully");
  } catch (error) {
    console.error("Error in daily batch job:", error);
  }
});
