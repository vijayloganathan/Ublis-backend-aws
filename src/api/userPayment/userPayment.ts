import { generateToken, generateToken1, decodeToken } from "../../helper/token";
import { encrypt } from "../../helper/encrypt";
import { executeQuery, getClient } from "../../helper/db";
import { generateMailLink } from "../../helper/linkgenerate";

import {
  initialDataOfPayment,
  otherPackage,
  verifyCoupon,
  invoiceAuditData,
  downloadInvoice,
  pastFessCount,
  paymentCount,
  newPayment,
  getbranchId,
  getStudentCount,
  refUtId_userId_Update,
  refUtIdUpdate,
  updateHistoryQuery,
  getCustId,
} from "./query";

import {
  CurrentTime,
  getMatchingData,
  generateDateArray,
  getDateRange,
  mapAttendanceData,
  findNearestTimeRange,
  convertToFormattedDateTime,
} from "../../helper/common";

export class UserPaymentRepository {
  public async userPaymentV1(userData: any, decodedToken: any) {
    const tokenData = {
      id: decodedToken.id,
      branch: decodedToken.branch,
    };
    const token = generateToken(tokenData, true);

    try {
      const params = [userData.refUtId];

      const userInitialData = await executeQuery(initialDataOfPayment);

      const results = {
        success: true,
        userInitialData: userInitialData,
        message: "Userdata for payment passed successfully",
        token,
      };
      return encrypt(results, true);
    } catch (error) {
      console.error("Error", error);
      const results = {
        success: false,
        message: "Error in passing the user details for payment",
        token,
      };
      return encrypt(results, true);
    }
  }

  public async userOtherPaymentV1(userData: any, decodedToken: any) {
    const tokenData = {
      id: decodedToken.id,
      branch: decodedToken.branch,
    };
    const token = generateToken(tokenData, true);
    try {
      const userOtherPackageData = await executeQuery(otherPackage, [
        userData.refPaId,
      ]);
      const results = {
        success: true,
        userOtherPackageData: userOtherPackageData,
        message: "Data for other packages passed successfully",
        token,
      };
      return encrypt(results, true);
    } catch (error) {
      console.error("Error", error);
      const results = {
        success: false,
        message: "Error in passing the user details for payment",
        token,
      };
      return encrypt(results, true);
    }
  }

  public async userPaymentAPIV1(userData: any, decodedToken: any) {
    const tokenData = {
      id: decodedToken.id,
      branch: decodedToken.branch,
    };
    const token = generateToken(tokenData, true);

    try {
      const results = {
        success: true,
        message: "OverView Attendance Count is passed successfully",
        token,
      };
      return encrypt(results, true);
    } catch (error) {
      console.error("Error", error);
      const results = {
        success: false,
        message: "Error in passing the payment details",
        token,
      };
      return encrypt(results, true);
    }
  }

  public async verifyCouponV1(userData: any, decodedToken: any): Promise<any> {
    const tokenData = {
      id: decodedToken.id,
      branch: decodedToken.branch,
    };
    const token = generateToken(tokenData, true);
    const couponData = userData.refCoupon;

    try {
      let updateData = {
        refFees: Math.round(Number(userData.refFees)),
        refExDate: userData.refExDate,
        refStartDate: userData.refStartDate,
        refEndDate: userData.refEndDate,
        refOfferValue: null,
        refOfferName: null,
      };
      const getTotalMonths = (startDate: string, endDate: string): number => {
        const formatDate = (dateStr: string) =>
          dateStr.split("T")[0].slice(0, 7);

        const [startYear, startMonth] = formatDate(startDate)
          .split("-")
          .map(Number);
        const [endYear, endMonth] = formatDate(endDate).split("-").map(Number);

        const totalMonths =
          (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
        return totalMonths;
      };
      const monthCount = getTotalMonths(
        updateData.refStartDate,
        updateData.refEndDate
      );
      const couponDataResult = await executeQuery(verifyCoupon, [
        String(couponData),
        updateData.refFees,
        monthCount,
      ]);

      if (couponDataResult.length === 0) {
        throw new Error("No coupon data found");
      }

      // Update offer details
      updateData.refOfferName = couponDataResult[0].refOfferName;

      if (couponDataResult[0].isValid === true) {
        switch (couponDataResult[0].refOfferId) {
          case 1: // Percentage discount
            const offerValue =
              (updateData.refFees / 100) * couponDataResult[0].refOffer;
            updateData.refFees = updateData.refFees - offerValue;
            updateData.refOfferValue = couponDataResult[0].refOffer;
            break;

          case 2: // Fixed amount discount
            updateData.refFees =
              updateData.refFees - couponDataResult[0].refOffer;
            updateData.refOfferValue = couponDataResult[0].refOffer;
            break;

          case 3: // Additional months offer
            const refOfferMonths = couponDataResult[0].refOffer;
            const currentDate = new Date(updateData.refExDate);
            currentDate.setMonth(currentDate.getMonth() + refOfferMonths);
            const newYear = currentDate.getFullYear();
            const newMonth = currentDate.getMonth() + 1;
            updateData.refExDate = `${newYear}-${
              newMonth < 10 ? "0" + newMonth : newMonth
            }`;
            updateData.refOfferValue = couponDataResult[0].refOffer;
            break;

          default:
            console.log("Coupon code may be expired or invalid");
            break;
        }
      } else {
        return encrypt(
          {
            success: false,
            message: "Coupon is Expired or Invalid",
            token: token,
          },
          true
        );
      }

      const refEndDate = new Date(updateData.refEndDate);
      let newYear = refEndDate.getFullYear();
      let newMonth = refEndDate.getMonth() + 1;
      updateData.refEndDate = `${newYear}-${
        newMonth < 10 ? "0" + newMonth : newMonth
      }`;
      const refStartDate = new Date(updateData.refStartDate);
      newYear = refStartDate.getFullYear();
      newMonth = refStartDate.getMonth() + 1;
      updateData.refStartDate = `${newYear}-${
        newMonth < 10 ? "0" + newMonth : newMonth
      }`;
      const refExDate = new Date(updateData.refExDate);
      newYear = refExDate.getFullYear();
      newMonth = refExDate.getMonth() + 1;
      updateData.refExDate = `${newYear}-${
        newMonth < 10 ? "0" + newMonth : newMonth
      }`;

      return encrypt(
        {
          success: true,
          message: "Coupon data is validated successfully",
          token: token,
          data: updateData,
        },
        true
      );
    } catch (error) {
      console.error("Error verifying coupon:", error);
      return encrypt(
        {
          success: false,
          message: "Error in Validating Coupon Data",
          token: token,
        },
        true
      );
    }
  }
  public async addPaymentV1(userData: any, decodedToken: any): Promise<any> {
    const tokenData = {
      id: decodedToken.id,
      branch: decodedToken.branch,
    };
    const token = generateToken(tokenData, true);
    let id;
    let by;
    if ((userData.refStId = "")) {
      id = decodedToken.id;
      by = "user";
    } else {
      id = userData.refStId;
      by = "Front Office";
    }
    try {
      const feesCount = await executeQuery(pastFessCount, [userData.refStId]);
      const countResult = await executeQuery(paymentCount, [CurrentTime()]);
      let newOrderId = convertToFormattedDateTime(CurrentTime());
      newOrderId = `${newOrderId}${(10000 + countResult[0].count).toString()}`;
      const transId = userData.transId ? userData.transId : "Offline";

      let Data = [
        id, //1
        newOrderId, //2
        transId, //3
        userData.pagID, //4
        userData.payFrom, //5
        userData.payTp, //6
        userData.pagExp, //7
        userData.offId, //8
        userData.OffType, //9
        userData.feesType, //10
        userData.pagFees, // 11
        userData.feesPaid, //12
        decodedToken.id, //13
        CurrentTime(), //14
        userData.payStatus, //15
      ];

      const storeFees = await executeQuery(newPayment, Data);

      if (userData.payStatus == false) {
        return Error;
      } else {
        const custId: any = executeQuery(getCustId, id);

        if (custId[0].refSCustId.startsWith("UY0")) {
          const refUtIdUpdateResult = await executeQuery(refUtIdUpdate, [
            userData.refStId,
          ]);
        } else {
          if (feesCount[0].count == 0) {
            const branch = await executeQuery(getbranchId, [userData.refStId]);
            let bId = branch[0].refBranchId.toString().padStart(2, "0");
            const studentCountResult = await executeQuery(getStudentCount, [
              bId,
            ]);
            const userCount = parseInt(studentCountResult[0].count, 10);
            const newCustomerId = `UY${bId}${(userCount + 1)
              .toString()
              .padStart(4, "0")}`;
            const refUtIdUpdateResult = await executeQuery(
              refUtId_userId_Update,
              [userData.refStId, newCustomerId]
            );

            const mailResult = await generateMailLink(id);
            console.log("mailResult", mailResult);
          } else {
            const refUtIdUpdateResult = await executeQuery(refUtIdUpdate, [
              userData.refStId,
            ]);
          }
        }
      }

      const history = [
        7, //Trance Id
         "Payment Success", // Trans Data
        userData.refStId, // trans For
        CurrentTime(), // time
        by, //updated By
        decodedToken.id, // updater Id
      ];
      const updateHistory = await executeQuery(updateHistoryQuery, history);

      if (!storeFees && !updateHistory) {
        return encrypt(
          {
            success: false,
            message: "error in storing the Fess data",
            token: token,
          },
          true
        );
      }

      return encrypt(
        {
          success: true,
          message: "fees Data Is Stored Successfully",
          token: token,
          data: newOrderId,
        },
        true
      );
    } catch (error) {
      console.error("Error:", error);
      const history = [
        8, //Trance Id
         "Payment Failed", // Trans Data
        userData.refStId, // trans For
        CurrentTime(), // time
        by, //updated By
        decodedToken.id, // updater Id
      ];
      const updateHistory = await executeQuery(updateHistoryQuery, history);

      return encrypt(
        {
          success: false,
          message: "Error in Storing Fees Data",
          token: token,
        },
        true
      );
    }
  }
  public async invoiceAuditDataV1(
    userData: any,
    decodedToken: any
  ): Promise<any> {
    const tokenData = {
      id: decodedToken.id,
      branch: decodedToken.branch,
    };
    const token = generateToken(tokenData, true);
    let id;
    if (userData == "") {
      id = decodedToken.id;
    } else {
      id = userData.refStId;
    }
    try {
      const auditData = await executeQuery(invoiceAuditData, [id]);
      return encrypt(
        {
          success: true,
          message: "Invoice Audit Data Passed",
          token: token,
          data: auditData[0],
        },
        true
      );
    } catch (error) {
      console.error("Error", error);
      return encrypt(
        {
          success: false,
          message: "Error in invoice audit data passing",
          token: token,
        },
        true
      );
    }
  }
  public async downloadInvoiceV1(
    userData: any,
    decodedToken: any
  ): Promise<any> {
    const tokenData = {
      id: decodedToken.id,
      branch: decodedToken.branch,
    };
    const token = generateToken(tokenData, true);
    try {
      const InvoiceData = await executeQuery(downloadInvoice, [
        userData.refPaId,
      ]);
      return encrypt(
        {
          success: true,
          message: "Downloading user invoice",
          token: token,
          data: InvoiceData[0],
        },
        true
      );
    } catch (error) {
      console.error("Error", error);
      return encrypt(
        {
          success: false,
          message: "Error in Downloading the user invoice",
          token: token,
        },
        true
      );
    }
  }
}
