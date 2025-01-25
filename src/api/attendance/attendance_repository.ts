import { generateToken, decodeToken } from "../../helper/token";
import { encrypt } from "../../helper/encrypt";
import { executeQuery, getClient } from "../../helper/db";
import { attendanceQuery, getAttendance } from "../../helper/attendanceDb";
import {
  searchUser,
  userAttendance,
  getOfflineCount,
  packageListData,
  getAttendanceDatas,
  packageOptions,
  packageOptionsMonth,
  getAttendanceDataTiming,
  timingOptions,
  mapUserData,
  getUserData,
  getTodayPackageList,
  getUserCount,
  getPackageList,
  petUserAttendCount,
  getGenderCount,
} from "./query";
import {
  CurrentTime,
  getMatchingData,
  generateDateArray,
  getDateRange,
  mapAttendanceData,
  findNearestTimeRange,
} from "../../helper/common";

export class AttendanceRepository {
  public async attendanceOverViewV1(userData: any, decodedToken: any) {
    const tokenData = {
      id: decodedToken.id,
      branch: decodedToken.branch,
    };
    const token = generateToken(tokenData, true);

    try {
      let todayDate;
      if (userData.date.length > 0) {
        todayDate = userData.date;
      } else {
        todayDate = CurrentTime();
      }
      console.log("todayDate line ---- 48 \n", todayDate);

      const packageList = await executeQuery(getTodayPackageList, [todayDate]);
      console.log("packageList line ------ 51 \n", packageList);
      const refTimeIds = packageList.map((item: any) => item.refTimeId);
      console.log("refTimeIds line ------- 53 \n", refTimeIds);
      const getUserCountResult = await executeQuery(getUserCount, [refTimeIds]);
      console.log("getUserCountResult line -------55 \n", getUserCountResult);
      const timeRanges = getUserCountResult.map((item: any) => ({
        refTimeId: item.refTimeId,
        refTime: item.refTime,
        usercount: item.usercount,
      }));
      console.log("timeRanges line ------- 61 \n", timeRanges);
      const attendanceCounts = await attendanceQuery(getOfflineCount, [
        todayDate,
        JSON.stringify(timeRanges),
      ]);
      console.log("attendanceCounts line ---------- 66 \n", attendanceCounts);

      const genderCount = await executeQuery(getGenderCount, [
        JSON.stringify(attendanceCounts),
      ]);

      console.log("genderCount line -------- 72 \n", genderCount);
      const finalData = findNearestTimeRange(genderCount, todayDate);
      const results = {
        success: true,
        message: "OverView Attendance Count is passed successfully",
        token,
        attendanceCount: finalData,
      };
      return encrypt(results, true);
    } catch (error) {
      console.error("Error", error);
      const results = {
        success: false,
        message: "Error in passing the OverView Attendance",
        token,
      };
      return encrypt(results, true);
    }
  }

  public async sessionAttendanceV1(
    userData: any,
    decodedToken: any
  ): Promise<any> {
    const tokenData = {
      id: decodedToken.id,
      branch: decodedToken.branch,
    };
    const token = generateToken(tokenData, true);
    try {
      const date = userData.date == "" ? CurrentTime() : userData.date;
      const sessionMode = userData.sessionMode == 1 ? "Online" : "Offline";
      const params = [decodedToken.branch, sessionMode, date];
      console.log("params line ---- 104 \n", params);

      let registerCount = await executeQuery(getPackageList, params);
      console.log("registerCount line -------- 107 \n", registerCount);
      const attendCount = await attendanceQuery(petUserAttendCount, [
        date,
        JSON.stringify(registerCount),
      ]);
      const results = {
        success: true,
        message: "Overall Attendance Count is passed successfully",
        token: token,
        attendanceCount: attendCount,
      };
      return encrypt(results, true);
    } catch (error) {
      console.log("error", error);
      const results = {
        success: false,
        message: "Error in passing the Session Attendance",
        token: token,
      };
      return encrypt(results, true);
    }
  }
  // completed
  public async userSearchV1(userData: any, decodedToken: any): Promise<any> {
    const tokenData = {
      id: decodedToken.id,
      branch: decodedToken.branch,
    };
    const token = generateToken(tokenData, true);
    try {
      const searchText = userData.searchText;
      let searchResult = await executeQuery(searchUser, [searchText]);
      const results = {
        success: true,
        message: "Searching For User",
        token: token,
        searchResult: searchResult,
      };
      return encrypt(results, true);
    } catch (error) {
      const results = {
        success: false,
        message: "Error in Searching User",
        token: token,
      };
      return encrypt(results, true);
    }
  }
  // Completed
  public async userDataV1(userData: any, decodedToken: any): Promise<any> {
    const tokenData = {
      id: decodedToken.id,
      branch: decodedToken.branch,
    };
    const token = generateToken(tokenData, true);
    try {
      let userData = await executeQuery(getUserData, [decodedToken.id]);
      const results = {
        success: true,
        message: "Passing The User Data",
        token: token,
        data: userData[0],
      };
      return encrypt(results, true);
    } catch (error) {
      const results = {
        success: false,
        message: "Error in sending User Data",
        token: token,
      };
      return encrypt(results, true);
    }
  }
  // Completed
  public async userAttendanceV1(
    userData: any,
    decodedToken: any
  ): Promise<any> {
    const tokenData = {
      id: decodedToken.id,
      branch: decodedToken.branch,
    };
    const token = generateToken(tokenData, true);
    try {
      function formatMonthYear(dateString: string) {
        // Manually parse the date string
        const [datePart, timePart] = dateString.split(", ");
        const [day, month, year] = datePart.split("/").map(Number);
        const date = new Date(year, month - 1, day);

        const months = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

        const monthName = months[date.getMonth()];
        const yearValue = date.getFullYear();
        return `${monthName} ${yearValue}`;
      }

      const custId = userData.refCustId;
      // const custId = "UY010002";
      let Month;
      if (userData.month == "") {
        Month = formatMonthYear(CurrentTime());
      } else {
        Month = userData.month;
      }
      const attendanceResult = await attendanceQuery(userAttendance, [
        custId,
        Month,
      ]);
      const results = {
        success: true,
        message: "User Attendance is passed successfully",
        token: token,
        attendanceResult: attendanceResult,
      };
      return encrypt(results, true);
    } catch (error) {
      console.log("error", error);
      const results = {
        success: false,
        message: "Error in passing the User Attendance",
        token: token,
      };
      return encrypt(results, true);
    }
  }
  public async attendanceReportOptionV1(
    userData: any,
    decodedToken: any
  ): Promise<any> {
    const tokenData = {
      id: decodedToken.id,
      branch: decodedToken.branch,
    };
    const token = generateToken(tokenData, true);
    try {
      let attendanceOptions;
      if (userData.reportType.code == 1) {
        const mode =
          userData.mode.length > 1
            ? "'Online', 'Offline'"
            : userData.mode[0] == 1
            ? "Online"
            : "Offline";
        if (userData.date == "") {
          attendanceOptions = await executeQuery(packageOptionsMonth, [
            decodedToken.branch,
          ]);
        } else {
          attendanceOptions = await executeQuery(packageOptions, [
            mode,
            userData.date,
            decodedToken.branch,
          ]);
        }
      } else {
        attendanceOptions = await executeQuery(timingOptions, []);
      }

      const results = {
        success: true,
        message: "Overall Attendance Options is passed successfully",
        token: token,
        options: attendanceOptions,
      };
      return encrypt(results, true);
    } catch (error) {
      console.log("error", error);
      const results = {
        success: false,
        message: "Error in passing the Session Attendance",
        token: token,
      };
      return encrypt(results, true);
    }
  }
  public async attendanceReportV1(
    userData: any,
    decodedToken: any
  ): Promise<any> {
    const tokenData = {
      id: decodedToken.id,
      branch: decodedToken.branch,
    };
    const token = generateToken(tokenData, true);

    try {
      let Data;
      const resultMap: any = {};
      let allCustomerIds: string[] = [];
      let finalData;
      if (userData.reportType.code == 1) {
        const sessionMod =
          userData.refSessionMod.length > 1
            ? "Online,Offline"
            : userData.refSessionMod[0] === 1
            ? "Online"
            : "Offline";

        console.log("sessionMod", sessionMod);
        console.log("userData.refPackageId", userData.refPackageId);
        Data = await executeQuery(packageListData, [
          sessionMod,
          userData.refPackageId,
        ]);

        Data.forEach((item: any) => {
          if (!resultMap[item.refPaId]) {
            resultMap[item.refPaId] = {
              refPaId: item.refPaId,
              refPackageName: item.refPackageName,
              users: [],
            };
          }
          if (item.refStId !== null) {
            resultMap[item.refPaId].users.push({
              refStId: item.refStId,
              refSCustId: item.refSCustId,
              refStFName: item.refStFName,
              refStLName: item.refStLName,
              refCtMobile: item.refCtMobile,
            });

            allCustomerIds.push(item.refSCustId);
          }
        });
        let date: string[] = [];

        if (userData.refRepDurationType == 1) {
          date[0] = userData.refRepDuration;
          date[1] = userData.refRepDuration;
        } else {
          [date[0], date[1]] = getDateRange(userData.refRepDuration);
        }

        const params = [date[0], date[1], allCustomerIds];
        const attendance = await attendanceQuery(getAttendanceDatas, params);
        attendance.forEach((att: any) => {
          const { emp_code, attendance: empAttendance } = att;

          Object.values(resultMap).forEach((packageItem: any) => {
            const user = packageItem.users.find(
              (user: any) => user.refSCustId === emp_code
            );

            if (user) {
              user.attendance = empAttendance;
            }
          });
        });

        finalData = Object.values(resultMap);
      } else {
        let dates: string[] = [];
        try {
          if (userData.refRepDurationType === 1) {
            dates[0] = userData.refRepDuration;
            dates[1] = userData.refRepDuration;
          } else {
            [dates[0], dates[1]] = getDateRange(userData.refRepDuration);
          }
          const params = [dates[0], dates[1]];
          const data = await attendanceQuery(getAttendanceDataTiming, params);
          const formattedAttendanceData = data.map(
            (item) => `${item.emp_code},${item.punch_time}`
          );
          const userMapData = await executeQuery(mapUserData, [
            formattedAttendanceData,
            userData.refPackageId,
          ]);
          console.log('userMapData line ------- 390', userMapData)
          finalData = mapAttendanceData(userMapData);
        } catch (error) {
          console.error("Error fetching or processing data:", error);
          throw error;
        }
      }

      const results = {
        success: true,
        message: "Attendance Report Data IS Passed Successfully",
        token: token,
        attendanceData: finalData,
      };
      return encrypt(results, true);
    } catch (error) {
      console.error(error);
      const results = {
        success: false,
        message: "Error in passing the Session Attendance Report Data",
        token: token,
      };
      return encrypt(results, true);
    }
  }
}
