import { generateToken, decodeToken } from "../../helper/token";
import { encrypt } from "../../helper/encrypt";
import {
  getCurrentStudentData,
  addTherapyAttendCount,
  updateHistoryQuery,
  studentMonthWiseReport,
} from "./query";
import { executeQuery } from "../../helper/db";
import { CurrentTime } from "../../helper/common";
import { classCount } from "../../helper/classCount";

export class ClassInfoRepository {
  public async overViewV1(userData: any, decodedToken: any): Promise<any> {
    const refStId = decodedToken.id;
    const tokenData = {
      id: decodedToken.id,
      branch: decodedToken.branch,
    };
    const token = generateToken(tokenData, true);
    try {
      const Data=await executeQuery(studentMonthWiseReport,["2025-02-01"])

      function countPackagesWithStudentTypes(data: any[]): { 
        package: { 
          name: string; 
          count: number; 
          studentType?: { 
            name: string; 
            count: number; 
            userType?: { 
              name: string; 
              count: number; 
              Gender?: { name: string; count: number }[] 
            }[] 
          }[] 
        }[] 
      } {
        const packageMap: Record<string, { count: number; studentTypes: Record<string, { count: number; userTypes: Record<string, { count: number; genders: Record<string, number> }> }> }> = {};
      
        data.forEach(item => {
          const packageName = item.refPackageName;
          const studentType = item.studentType;
          const userType = item.userType;
          const gender = item.refStSex;
      
          if (!packageMap[packageName]) {
            packageMap[packageName] = { count: 0, studentTypes: {} };
          }
      
          packageMap[packageName].count += 1;
      
          if (!packageMap[packageName].studentTypes[studentType]) {
            packageMap[packageName].studentTypes[studentType] = { count: 0, userTypes: {} };
          }
      
          packageMap[packageName].studentTypes[studentType].count += 1;
      
          if (!packageMap[packageName].studentTypes[studentType].userTypes[userType]) {
            packageMap[packageName].studentTypes[studentType].userTypes[userType] = { count: 0, genders: {} };
          }
      
          packageMap[packageName].studentTypes[studentType].userTypes[userType].count += 1;
          packageMap[packageName].studentTypes[studentType].userTypes[userType].genders[gender] = 
            (packageMap[packageName].studentTypes[studentType].userTypes[userType].genders[gender] || 0) + 1;
        });
      
        // Convert to desired format
        const packageArray = Object.entries(packageMap).map(([packageName, packageDetails]) => ({
          name: packageName,
          count: packageDetails.count,
          studentType: Object.entries(packageDetails.studentTypes).map(([studentTypeName, studentTypeDetails]) => ({
            name: studentTypeName,
            count: studentTypeDetails.count,
            userType: Object.entries(studentTypeDetails.userTypes).map(([userTypeName, userTypeDetails]) => ({
              name: userTypeName,
              count: userTypeDetails.count,
              Gender: Object.entries(userTypeDetails.genders).map(([genderName, count]) => ({
                name: genderName,
                count
              }))
            }))
          }))
        }));
      
        return { package: packageArray };
      }

      const count = countPackagesWithStudentTypes(Data)

      function countWeekTimingsWithStudentTypes(data: any[]): { 
        WeekTimings: { 
          name: string; 
          count: number; 
          studentType?: { 
            name: string; 
            count: number; 
            userType?: { 
              name: string; 
              count: number; 
              Gender?: { name: string; count: number }[] 
            }[] 
          }[] 
        }[] 
      } {
        const timingMap: Record<string, { count: number; studentTypes: Record<string, { count: number; userTypes: Record<string, { count: number; genders: Record<string, number> }> }> }> = {};
      
        data.forEach(item => {
          // Combine WeekDaysTiming and WeekEndTiming into a single array
          const timings = [item.WeekDaysTiming, item.WeekEndTiming].filter(Boolean); // Remove null/undefined values
      
          timings.forEach(timing => {
            const studentType = item.studentType;
            const userType = item.userType;
            const gender = item.refStSex;
      
            if (!timingMap[timing]) {
              timingMap[timing] = { count: 0, studentTypes: {} };
            }
      
            timingMap[timing].count += 1;
      
            if (!timingMap[timing].studentTypes[studentType]) {
              timingMap[timing].studentTypes[studentType] = { count: 0, userTypes: {} };
            }
      
            timingMap[timing].studentTypes[studentType].count += 1;
      
            if (!timingMap[timing].studentTypes[studentType].userTypes[userType]) {
              timingMap[timing].studentTypes[studentType].userTypes[userType] = { count: 0, genders: {} };
            }
      
            timingMap[timing].studentTypes[studentType].userTypes[userType].count += 1;
            timingMap[timing].studentTypes[studentType].userTypes[userType].genders[gender] = 
              (timingMap[timing].studentTypes[studentType].userTypes[userType].genders[gender] || 0) + 1;
          });
        });
      
        // Convert to desired format
        const timingArray = Object.entries(timingMap).map(([timingName, timingDetails]) => ({
          name: timingName,
          count: timingDetails.count,
          studentType: Object.entries(timingDetails.studentTypes).map(([studentTypeName, studentTypeDetails]) => ({
            name: studentTypeName,
            count: studentTypeDetails.count,
            userType: Object.entries(studentTypeDetails.userTypes).map(([userTypeName, userTypeDetails]) => ({
              name: userTypeName,
              count: userTypeDetails.count,
              Gender: Object.entries(userTypeDetails.genders).map(([genderName, count]) => ({
                name: genderName,
                count
              }))
            }))
          }))
        }));
      
        return { WeekTimings: timingArray };
      }
      
      
      const TimingCount = countWeekTimingsWithStudentTypes(Data)


      const results = {
        success: true,
        message: "Testing Success",
        token: token,
        overViewCount: TimingCount,
      };
      return encrypt(results, false);
    } catch (error) {
      const results = {
        success: false,
        message: "Testing Failed",
        token: token,
      };
      return encrypt(results, false);
    }
  }
  public async currentStudentDataV1(
    userData: any,
    decodedToken: any
  ): Promise<any> {
    const refStId = decodedToken.id;
    const tokenData = {
      id: decodedToken.id,
      branch: decodedToken.branch,
    };
    const token = generateToken(tokenData, true);
    try {
      const StudentData = await executeQuery(getCurrentStudentData, [
        decodedToken.branch,
      ]);
      const results = {
        success: true,
        message: "Current Student Data is Passed Successfully",
        token: token,
        data: StudentData,
      };
      return encrypt(results, true);
    } catch (error) {
      const results = {
        success: false,
        message: "Error In Passing the Current Student Data",
        token: token,
      };
      return encrypt(results, true);
    }
  }
  public async addUserTherapyCountV1(
    userData: any,
    decodedToken: any
  ): Promise<any> {
    const refStId = decodedToken.id;
    const tokenData = {
      id: decodedToken.id,
      branch: decodedToken.branch,
    };
    const token = generateToken(tokenData, true);
    try {
      await executeQuery(addTherapyAttendCount, [userData.refStId]);
      const transId = 39,
        transData = "student complete one therapy session",
        refUpdatedBy = "Therapist";

      const historyData = [
        transId,
        transData,
        userData.refStId,
        CurrentTime(),
        refUpdatedBy,
        decodedToken.id,
      ];

      const updateHistoryQueryResult = await executeQuery(
        updateHistoryQuery,
        historyData
      );

      const results = {
        success: true,
        message: "therapy Attend Count is added Successfully",
        token: token,
      };
      return encrypt(results, true);
    } catch (error) {
      const results = {
        success: false,
        message: "Error In Adding therapy attend Count",
        token: token,
      };
      return encrypt(results, true);
    }
  }
  public async studentMonthWiseReportV1(
    userData: any,
    decodedToken: any
  ): Promise<any> {
    const refStId = decodedToken.id;
    const tokenData = {
      id: decodedToken.id,
      branch: decodedToken.branch,
    };
    const token = generateToken(tokenData, true);
    try {
      let Data = await executeQuery(studentMonthWiseReport, [
        userData.refMonth,
      ]);

      console.log("Data", Data);

      for (let i = 0; i < Data.length; i++) {
        const count: any = await classCount(userData.refMonth, Data[i].refStId);
        Data[i] = {
          ...Data[i],
          totalClassCount: count.totalClassCount,
          classAttendanceCount: count.classAttendanceCount,
          reCount: count.reCount,
        };
      }

      const results = {
        success: true,
        message: "Month wise Student Report Passed Successfully",
        token: token,
        data: Data,
      };
      return encrypt(results, true);
    } catch (error) {
      console.log("error", error);
      const results = {
        success: false,
        message: "Error In passing Month wise Student Report Data",
        token: token,
      };
      return encrypt(results, true);
    }
  }
}
