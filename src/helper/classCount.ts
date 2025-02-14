import { executeQuery, getClient } from "./db";
import { attendanceQuery, getAttendance } from "./attendanceDb";

const getTotalCount = `SELECT
u."refSCustId",
  (string_to_array(TRIM(BOTH '{}' FROM rp."refTotalClassCount"), ',')::int[])[
    EXTRACT(MONTH FROM TO_DATE($2, 'YYYY-MM-DD')) - EXTRACT(MONTH FROM TO_DATE(rp."refPayFrom", 'YYYY-MM-DD')) + 1
  ] AS "totalClassCount"
FROM public."refPayment" rp
LEFT JOIN public."users" u ON CAST (u."refStId" AS INTEGER) = rp."refStId"
WHERE 
  EXTRACT(MONTH FROM TO_DATE(rp."refPayFrom", 'YYYY-MM-DD')) <= EXTRACT(MONTH FROM TO_DATE($2, 'YYYY-MM-DD'))
  AND EXTRACT(MONTH FROM TO_DATE(rp."refPagExp", 'YYYY-MM-DD')) >= EXTRACT(MONTH FROM TO_DATE($2, 'YYYY-MM-DD'))
  AND rp."refStId"=$1;`;

const getAttendCount = `SELECT COUNT(*) AS "attendCount"
FROM (
    SELECT DISTINCT ON (
        DATE_TRUNC('minute', punch_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') 
        - INTERVAL '10 minutes'
    ) 
    TO_CHAR(punch_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YYYY, HH12:MI:SS AM') AS formatted_punch_time
    FROM public.iclock_transaction
    WHERE 
        emp_code = $1 
        AND EXTRACT(MONTH FROM punch_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = EXTRACT(MONTH FROM TO_DATE($2, 'YYYY-MM-DD'))
    ORDER BY 
        DATE_TRUNC('minute', punch_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') 
        - INTERVAL '10 minutes'
) AS subquery;`;

export const classCount = async (date: string, id: number) => {
  try {
    let count = {};
    const totalCount = await executeQuery(getTotalCount, [id, date]);

    if (totalCount.length > 0) {
      const attendCount = await attendanceQuery(getAttendCount, [
        totalCount[0].refSCustId,
        date,
      ]);
      console.log("attendCount", attendCount);
      count = {
        ...count,
        totalClassCount: totalCount[0].totalClassCount || 0,
        classAttendCount: attendCount[0].attendCount || 0,
        reCount: totalCount[0].totalClassCount - attendCount[0].attendCount || 0,
      };
    } else {
      count = {
        ...count,
        totalClassCount: 0,
        classAttendCount: 0,
        reCount: 0,
      };
      return count;
    }
    console.log('count line ---- 58', count)
    return count;
  } catch (error) {
    console.log(" -> Line Number ----------------------------------- 17");
    console.log("error", error);
  }
};
