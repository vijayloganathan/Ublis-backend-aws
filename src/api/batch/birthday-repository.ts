import { executeQuery, getClient } from "../../helper/db";
import { PoolClient } from "pg";
import { encrypt } from "../../helper/encrypt";
import { generateToken, generateToken1 } from "../../helper/token";
import { getBirthdayData, getWeedingData } from "./query";
import { sendEmail } from "../../helper/mail";
import {
  sendBirthdayWish,
  sendAnniversaryWish,
} from "../../helper/mailcontent";
import { getAdjustedTime } from "../../helper/common";

export class BatchRepository {
  public async BirthdayRepositoryV1(): Promise<any> {
    try {
      const getData = await executeQuery(getBirthdayData, []);
      if (getData.length > 0) {
        for (let i = 0; i < getData.length; i++) {
          const main = async () => {
            const mailOptions = {
              to: getData[i].refCtEmail,
              subject: "Birthday Wish From Ublis Yoga",
              html: sendBirthdayWish(
                getData[i].refStFName,
                getData[i].refStLName
              ),
            };

            // Call the sendEmail function
            try {
              await sendEmail(mailOptions);
            } catch (error) {
              console.error("Failed to send email:", error);
            }
          };

          main().catch(console.error);
        }
      }

      const results = {
        success: true,
        message: "Birthday Wish Mail Is Send Successfully",
        // token: generateToken1(this.decodedToken, true),
      };
      return encrypt(results, false);
    } catch (error) {
      console.log(error);
      const results = {
        success: false,
        message: "error In sending Birthday Wish Mail",
        // token: generateToken1(this.decodedToken, true),
      };
      return encrypt(results, false);
    }
  }
  public async WeedingWishRepositoryV1(): Promise<any> {
    try {
      const getData = await executeQuery(getWeedingData, []);
      if (getData.length > 0) {
        for (let i = 0; i < getData.length; i++) {
          const main = async () => {
            const mailOptions = {
              to: getData[i].refCtEmail,
              subject: "Wedding Wish From Ublis Yoga",
              html: sendAnniversaryWish(
                getData[i].refStFName,
                getData[i].refStLName
              ),
            };

            // Call the sendEmail function
            try {
              await sendEmail(mailOptions);
            } catch (error) {
              console.error("Failed to send email:", error);
            }
          };

          main().catch(console.error);
        }
      }

      const results = {
        success: true,
        message: "Birthday Wish Mail Is Send Successfully",
        // token: generateToken1(this.decodedToken, true),
      };
      return encrypt(results, false);
    } catch (error) {
      console.log(error);
      const results = {
        success: false,
        message: "error In sending Birthday Wish Mail",
        // token: generateToken1(this.decodedToken, true),
      };
      return encrypt(results, false);
    }
  }
}
