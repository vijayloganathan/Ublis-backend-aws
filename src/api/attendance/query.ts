export const searchUser = `SELECT
  u."refStId",u."refSCustId",
  u."refStFName",
  u."refStLName",
  TO_CHAR(u."refStDOB", 'DD/MM/YYYY') AS "refStDOB",
  uc."refCtMobile",
  uc."refCtEmail",
  rp."refPackageName",
  pt."refTime" AS "weekDaysTiming",
  pt2."refTime" AS "weekEndTiming"
FROM
  public.users u
  INNER JOIN public."refUserCommunication" uc ON CAST(u."refStId" AS INTEGER) = uc."refStId"
  INNER JOIN public."refUsersDomain" ud ON CAST(u."refStId" AS INTEGER) = ud."refStId"
 	LEFT JOIN public."refUserPackage" up ON CAST (u."refStId" AS INTEGER) = up."refStId"
  LEFT JOIN public."refPackage" rp ON CAST (up."refPaId" AS INTEGER ) = rp."refPaId"
  LEFT JOIN public."refPaTiming" pt ON CAST (up."refWeekDaysTiming" AS INTEGER ) = pt."refTimeId"
  LEFT JOIN public."refPaTiming" pt2 ON CAST (up."refWeekTiming" AS INTEGER ) = pt2."refTimeId"
WHERE
  CONCAT(
    u."refSCustId",
    ' ',
    u."refStFName",
    ' ',
    uc."refCtMobile",
    ' ',
    uc."refCtEmail",
    ' ',
    ud."refUserName"
  ) LIKE '%' || $1 || '%';
`;

export const userAttendance = `WITH ordered_punch_times AS (
    SELECT 
        punch_time,
        TO_CHAR(punch_time AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YYYY, HH12:MI:SS AM') AS "formatted_punch_time",
        LAG(punch_time) OVER (PARTITION BY emp_code, TO_CHAR(punch_time AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YYYY') ORDER BY punch_time) AS prev_punch_time
    FROM 
        public.iclock_transaction
    WHERE 
        TO_CHAR(punch_time AT TIME ZONE 'Asia/Kolkata', 'Month/YYYY') = TO_CHAR(TO_TIMESTAMP($2, 'Month/YYYY'), 'Month/YYYY')
        AND emp_code = $1
)
SELECT 
    "formatted_punch_time"
FROM 
    ordered_punch_times
WHERE 
    prev_punch_time IS NULL OR EXTRACT(EPOCH FROM punch_time - prev_punch_time) > 4800
ORDER BY 
    punch_time;
`;
export const getOfflineCount = `WITH json_data AS (
  SELECT 
    jsonb_array_elements(
      $2::jsonb
    ) AS data
),
calculated_ranges AS (
  SELECT 
    data ->> 'refTimeId' AS refTimeId,
    data ->> 'refTime' AS refTime,
    data ->> 'usercount' AS usercount,
    split_part(data ->> 'refTime', ' to ', 1) AS startTime,
    to_char((split_part(data ->> 'refTime', ' to ', 1)::time - interval '30 minutes'), 'HH12:MI AM') AS rangeStartFormatted,
    to_char((split_part(data ->> 'refTime', ' to ', 1)::time + interval '30 minutes'), 'HH12:MI AM') AS rangeEndFormatted,
    (split_part(data ->> 'refTime', ' to ', 1)::time - interval '30 minutes')::time AS rangeStart,
    (split_part(data ->> 'refTime', ' to ', 1)::time + interval '30 minutes')::time AS rangeEnd
  FROM 
    json_data
),
adjusted_ranges AS (
  SELECT
    refTimeId,
    refTime,
    usercount,
    startTime,
    rangeStartFormatted,
    rangeEndFormatted,
    rangeStart,
    rangeEnd,
    LAG(rangeEnd) OVER (ORDER BY refTimeId) AS prevRangeEnd,
    CASE
      WHEN LAG(rangeEnd) OVER (ORDER BY refTimeId) IS NULL THEN (rangeStart - interval '30 minutes')
      ELSE LAG(rangeEnd) OVER (ORDER BY refTimeId)
    END AS adjustedStartTime
  FROM
    calculated_ranges
),
filtered_entries AS (
  SELECT 
    ict.punch_time,
    ict.emp_code,
    TO_CHAR(ict.punch_time AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YYYY, HH12:MI:SS AM') AS punch_time_ist,
    ar.refTimeId,
    ar.refTime,
    ar.usercount,
    ar.startTime,
    ar.adjustedStartTime,
    ar.rangeStartFormatted,
    ar.rangeEndFormatted,
    LAG(ict.punch_time) OVER (PARTITION BY ict.emp_code ORDER BY ict.punch_time) AS previous_punch_time
  FROM 
    public.iclock_transaction ict
  LEFT JOIN 
    adjusted_ranges ar
  ON 
    (ict.punch_time AT TIME ZONE 'Asia/Kolkata')::time 
    BETWEEN ar.adjustedStartTime AND ar.rangeEnd
  WHERE 
    ict.emp_code NOT LIKE '%S%'
    AND
    TO_CHAR(ict.punch_time AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YYYY') = TO_CHAR(TO_TIMESTAMP($1, 'DD/MM/YYYY, HH:MI:SS PM') AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YYYY')
),
unique_entries AS (
  SELECT 
    *,
    EXTRACT(EPOCH FROM (punch_time - previous_punch_time)) / 60 AS time_difference
  FROM 
    filtered_entries
  WHERE 
    previous_punch_time IS NULL OR 
    EXTRACT(EPOCH FROM (punch_time - previous_punch_time)) / 60 > 20
)
SELECT 
  ar.refTimeId,
  ar.refTime,
  ar.usercount,
  COALESCE(COUNT(ue.emp_code), 0) AS attendancecount,
  COALESCE(array_agg(ue.emp_code), '{}') AS emp_codes -- Aggregate emp_code into an array
FROM 
  adjusted_ranges ar
LEFT JOIN 
  unique_entries ue
ON 
  ar.refTimeId = ue.refTimeId
GROUP BY 
  ar.refTimeId, ar.refTime, ar.usercount
ORDER BY 
  ar.refTimeId;
`;

export const getGenderCount = `WITH input_data AS (
  SELECT 
    jsonb_array_elements(
      $1::jsonb
    ) AS data
),
user_details AS (
  SELECT 
    data ->> 'reftimeid' AS refTimeId,
    data ->> 'reftime' AS refTime,
    data ->> 'usercount' AS usercount,
    data ->> 'attendancecount' AS attendancecount,
    jsonb_array_elements_text(data -> 'emp_codes') AS emp_code
  FROM 
    input_data
),
joined_users AS (
  SELECT 
    ud.refTimeId,
    ud.refTime,
    ud.usercount,
    ud.attendancecount,
    u."refSCustId",
    u."refStDOB",
    u."refStSex",
    DATE_PART('year', AGE(u."refStDOB")) AS age
  FROM 
    user_details ud
  LEFT JOIN 
    users u
  ON 
    ud.emp_code = u."refSCustId"
),
aggregated_counts AS (
  SELECT 
    refTimeId,
    refTime,
    usercount::int,
    attendancecount::int,
    COUNT(CASE WHEN age <= 16 THEN 1 END) AS kidscount, -- Count kids (age ≤ 16)
    COUNT(CASE WHEN age > 16 AND "refStSex" = 'male' THEN 1 END) AS malecount, -- Count males
    COUNT(CASE WHEN age > 16 AND "refStSex" = 'female' THEN 1 END) AS femalecount, -- Count females
    STRING_AGG(age::text, ', ') AS ages -- Collect all ages as a comma-separated string
  FROM 
    joined_users
  GROUP BY 
    refTimeId, refTime, usercount, attendancecount
)
SELECT 
  refTimeId,
  refTime,
  usercount,
  attendancecount,
  malecount,
  femalecount,
  kidscount
FROM 
  aggregated_counts
ORDER BY 
  refTimeId;
`;

// -----------  ATTENDANCE REWORK ----------------------------------

export const getUserData = `SELECT
  u."refStId",
  u."refSCustId",
  u."refStFName",
  u."refStLName",
  uc."refCtMobile",
  uc."refCtEmail",
  rp."refPackageName",
  pt."refTime" AS "weekDaysTiming",
  pt2."refTime" AS "weekEndTiming"
FROM
  public.users u
  INNER JOIN public."refUserCommunication" uc ON CAST (u."refStId" AS INTEGER) = uc."refStId"
  LEFT JOIN public."refUserPackage" up ON CAST (u."refStId" AS INTEGER) = up."refStId"
  LEFT JOIN public."refPackage" rp ON CAST (up."refPaId" AS INTEGER ) = rp."refPaId"
  LEFT JOIN public."refPaTiming" pt ON CAST (up."refWeekDaysTiming" AS INTEGER ) = pt."refTimeId"
  LEFT JOIN public."refPaTiming" pt2 ON CAST (up."refWeekTiming" AS INTEGER ) = pt2."refTimeId"
WHERE
  u."refStId" = $1`;

export const packageOptions = `SELECT
  rp."refPaId" AS "optionId",
  rp."refPackageName" AS "optionName"
FROM
  public."refPackage" rp
LEFT JOIN
  public."refSessionDays" rsd
ON
  rsd."refSDId" = ANY(string_to_array(REPLACE(REPLACE(rp."refSessionDays", '{', ''), '}', ''), ',')::INTEGER[])
WHERE
  rsd."refDays" IN (
    'All Days',
    CASE
      WHEN TO_CHAR(TO_TIMESTAMP($2, 'DD/MM/YYYY, HH12:MI:SS AM'), 'FMDay') IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
        THEN 'Weekdays'
      WHEN TO_CHAR(TO_TIMESTAMP($2, 'DD/MM/YYYY, HH12:MI:SS AM'), 'FMDay') IN ('Saturday', 'Sunday')
        THEN 'Weekend'
    END,
    TO_CHAR(TO_TIMESTAMP($2, 'DD/MM/YYYY, HH12:MI:SS AM'), 'FMDay')
  )
  AND
  rp."refBranchId" = $3
AND
  rp."refSessionMode" IN ('Offline & Online', $1)
  AND (
    rp."refDeleteAt" IS NULL
    OR rp."refDeleteAt" = 0
  )
GROUP BY
  rp."refPaId", rp."refPackageName";`;

export const packageOptionsMonth = `SELECT
  "refPaId" AS "optionId",
  "refPackageName" AS "optionName"
FROM
  public."refPackage"
WHERE
  "refBranchId" = $1
  AND (
    "refDeleteAt" is null
    OR "refDeleteAt" = 0
  );`;

export const timingOptions = `SELECT
  "refTimeId" AS "optionId",
  "refTime" AS "optionName"
FROM
  public."refPaTiming"
WHERE
  "refDeleteAt" is null
  OR "refDeleteAt" = 0;`;

export const packageListData = `SELECT
  u."refStId",
  u."refSCustId",
  u."refStFName",
  u."refStLName",
  uc."refCtMobile",
  rp."refPaId",
  rp."refPackageName"
FROM
  public."refPackage" rp
  LEFT JOIN public."refUserPackage" up ON CAST(up."refPaId" AS INTEGER) = rp."refPaId"
  LEFT JOIN public.users u ON CAST(u."refStId" AS INTEGER) = up."refStId"
  LEFT JOIN public."refUserCommunication" uc ON CAST(u."refStId" AS INTEGER) = uc."refStId"
WHERE
  rp."refSessionMode" IN ('Offline & Online', $1)
  AND (
    rp."refDeleteAt" IS NULL
    OR rp."refDeleteAt" = 0
  )
  AND rp."refPaId" = ANY ($2::INTEGER[])
GROUP BY
  rp."refPaId",
  rp."refPackageName",
  u."refStId",
  u."refSCustId",
  u."refStFName",
  u."refStLName",
  uc."refCtMobile";
`;

export const mapUserData = `
WITH raw_data AS (
    SELECT unnest($1::text[]) AS combined_data
),
user_data AS (
    SELECT
        split_part(rd.combined_data, ',', 1) AS user_id,
        split_part(rd.combined_data, ',', 2) AS date,
        split_part(rd.combined_data, ',', 3) AS time
    FROM raw_data rd
),
parsed_ref_time AS (
    SELECT
        "refTimeId",
        "refTime",
        split_part("refTime", ' to ', 1) AS start_time -- Extract start time
    FROM public."refPaTiming"
    WHERE "refTimeId" = ANY($2::int[]) -- Filter by refTimeId passed in the array
),
adjusted_times AS (
    SELECT
        ud.user_id,
        ud.date,
        ud.time,
        u."refSCustId",
        u."refStFName",
        u."refStLName",
        prt."refTimeId",
        prt."refTime",
  			uc."refCtMobile",
        TO_TIMESTAMP(TRIM(ud.time), 'HH12:MI:SS AM') AS user_timestamp,
        TO_TIMESTAMP(TRIM(prt.start_time), 'HH12:MI AM') AS ref_timestamp
    FROM user_data ud
    LEFT JOIN users u
        ON TRIM(ud.user_id) = TRIM(u."refSCustId")
  	LEFT JOIN public."refUserCommunication" uc
  			ON CAST (u."refStId" AS INTEGER) = uc."refStId"
    LEFT JOIN parsed_ref_time prt
        ON TRUE
)
SELECT
    at.user_id,
    at.date,
    at.time,
    at."refSCustId",
    at."refStFName",
    at."refStLName",
    at."refTimeId",
    at."refTime",
    at."refCtMobile"
FROM adjusted_times at
WHERE
    at.ref_timestamp BETWEEN at.user_timestamp - INTERVAL '30 minutes'
                          AND at.user_timestamp + INTERVAL '30 minutes';

`;

export const getAttendanceDatas = `WITH
  filtered_data AS (
    SELECT
      emp_code,
      punch_time,
      TO_CHAR(punch_time AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YYYY, HH12:MI:SS AM') AS local_punch_time,
      LAG(punch_time) OVER (
        PARTITION BY emp_code
        ORDER BY punch_time
      ) AS prev_punch_time
    FROM
      public.iclock_transaction
    WHERE
      punch_time::date >= TO_DATE($1, 'DD/MM/YYYY')
      AND punch_time::date <= TO_DATE($2, 'DD/MM/YYYY')
      AND emp_code = ANY($3::text[])
  )
SELECT
  emp_code,
  json_agg(local_punch_time) AS attendance
FROM
  filtered_data
WHERE
  prev_punch_time IS NULL
  OR EXTRACT(
    EPOCH
    FROM
      punch_time - prev_punch_time
  ) > 1200
GROUP BY
  emp_code;


`;

export const getAttendanceDataTiming = `SELECT
  emp_code,
  TO_CHAR(punch_time AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YYYY, HH12:MI:SS AM') AS punch_time
FROM (
  SELECT
    emp_code,
    punch_time,
    LAG(punch_time) OVER (
      PARTITION BY emp_code, TO_CHAR(punch_time AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YYYY')
      ORDER BY punch_time
    ) AS prev_punch_time
  FROM
    public.iclock_transaction
  WHERE
    TO_CHAR(punch_time AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YYYY') BETWEEN TO_CHAR(TO_DATE($1, 'DD/MM/YYYY') AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YYYY') AND TO_CHAR(TO_DATE($2, 'DD/MM/YYYY') AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YYYY')
    AND emp_code NOT LIKE '%S%'
) subquery
WHERE
  prev_punch_time IS NULL OR EXTRACT(EPOCH FROM (punch_time - prev_punch_time)) > 1200
ORDER BY
  punch_time;




`;

//  Attendance OverView ----------------------------------------------------------------------

export const getTodayPackageList = `SELECT DISTINCT ON (pt."refTimeId")
  pt."refTimeId",
  pt."refTime"
FROM
  public."refPackage" rp
  INNER JOIN public."refSessionDays" sd ON sd."refSDId" = ANY (rp."refSessionDays"::INTEGER[])
  INNER JOIN public."refPaTiming" pt ON pt."refTimeId" = ANY (
    CASE
      WHEN EXTRACT(DOW FROM TO_TIMESTAMP($1, 'DD/MM/YYYY, HH12:MI:SS AM')) BETWEEN 1 AND 5 THEN rp."refWTimingId"::INTEGER[]
      WHEN EXTRACT(DOW FROM TO_TIMESTAMP($1, 'DD/MM/YYYY, HH12:MI:SS AM')) IN (0, 6) THEN rp."refWeTimingId"::INTEGER[]
      ELSE NULL
    END
  )
WHERE
  COALESCE(rp."refDeleteAt", 0) = 0
  AND sd."refDays" IN (
    'All Days',
    TRIM(
      TO_CHAR(
        TO_TIMESTAMP($1, 'DD/MM/YYYY, HH12:MI:SS AM'),
        'Day'
      )
    ),
    CASE
      WHEN EXTRACT(DOW FROM TO_TIMESTAMP($1, 'DD/MM/YYYY, HH12:MI:SS AM')) BETWEEN 1 AND 5 THEN 'Weekdays'
      WHEN EXTRACT(DOW FROM TO_TIMESTAMP($1, 'DD/MM/YYYY, HH12:MI:SS AM')) IN (0, 6) THEN 'Weekend'
      ELSE NULL
    END
  )
GROUP BY
  pt."refTimeId",
  pt."refTime";`;

export const getUserCount = `
  SELECT
  pt."refTimeId",
  pt."refTime",
  COUNT(u.*) AS userCount
FROM
  public."refPaTiming" pt
  LEFT JOIN public."refUserPackage" up ON pt."refTimeId" IN (up."refWeekDaysTiming", up."refWeekTiming")
  LEFT JOIN public.users u ON u."refStId" = (up."refStId")
WHERE
  pt."refTimeId" = ANY ($1::INTEGER[])
GROUP BY
  pt."refTimeId",
  pt."refTime";
`;

export const getPackageList = `SELECT
  rp."refPaId",
  rp."refPackageName",
  COUNT(u.*) AS usercount,
  ARRAY_AGG(u."refSCustId") AS staff_ids
FROM
  public."refPackage" rp
  INNER JOIN public."refSessionDays" sd ON sd."refSDId" = ANY (rp."refSessionDays"::INTEGER[])
  LEFT JOIN public."refUserPackage" up ON CAST(rp."refPaId" AS INTEGER) = up."refPaId"
  INNER JOIN public.users u ON CAST(u."refStId" AS INTEGER) = up."refStId"
WHERE
  rp."refBranchId" = $1
  AND u."refSCustId" NOT LIKE '%S%'
  AND rp."refSessionMode" IN ('Offline & Online', $2)
  AND sd."refDays" IN (
    'All Days',
    TRIM(
      TO_CHAR(
        TO_TIMESTAMP($3, 'DD/MM/YYYY, HH12:MI:SS AM'),
        'Day'
      )
    ),
    CASE
      WHEN EXTRACT(
        DOW
        FROM
          TO_TIMESTAMP($3, 'DD/MM/YYYY, HH12:MI:SS AM')
      ) BETWEEN 1 AND 5  THEN 'Weekdays'
      WHEN EXTRACT(
        DOW
        FROM
          TO_TIMESTAMP($3, 'DD/MM/YYYY, HH12:MI:SS AM')
      ) IN (0, 6) THEN 'Weekend'
      ELSE NULL
    END
  )
GROUP BY
  rp."refPaId",
  rp."refPackageName";`;

export const petUserAttendCount = `WITH
  package_data AS (
    SELECT
      package ->> 'refPaId' AS refPaId,
      package ->> 'refPackageName' AS refPackageName,
      (package ->> 'usercount') AS usercount, -- Keep usercount as text
      jsonb_array_elements_text(package -> 'staff_ids') AS staff_id
    FROM
      jsonb_array_elements(
        $2::jsonb
      ) AS package
  ),
  ranked_data AS (
    SELECT
      ict.punch_time,
      ict.emp_code,
      pd.refPaId,
      pd.refPackageName,
      pd.usercount,
      TO_CHAR(
        ict.punch_time AT TIME ZONE 'Asia/Kolkata',
        'DD/MM/YYYY, HH12:MI:SS AM'
      ) AS punch_time_ist,
      LAG(ict.punch_time) OVER (
        PARTITION BY
          ict.emp_code
        ORDER BY
          ict.punch_time
      ) AS previous_punch_time
    FROM
      public.iclock_transaction ict
      JOIN package_data pd ON ict.emp_code = pd.staff_id
    WHERE
      ict.emp_code NOT LIKE '%S%'
      AND TO_CHAR(
        ict.punch_time AT TIME ZONE 'Asia/Kolkata',
        'DD/MM/YYYY'
      ) = TO_CHAR(
        TO_TIMESTAMP(
          $1,
          'DD/MM/YYYY, HH:MI:SS PM'
        ) AT TIME ZONE 'Asia/Kolkata',
        'DD/MM/YYYY'
      )
  ),
  user_attendance_count AS (
    SELECT
      pd.refPaId,
      pd.refPackageName,
      pd.usercount,
      COUNT(DISTINCT rd.emp_code) AS attendcount
    FROM
      package_data pd
      LEFT JOIN ranked_data rd ON pd.refPaId = rd.refPaId
    WHERE
      rd.previous_punch_time IS NULL -- Include the first punch time for each user
      OR EXTRACT(
        EPOCH
        FROM
          (rd.punch_time - rd.previous_punch_time)
      ) > 1200 -- Time difference > 20 mins
    GROUP BY
      pd.refPaId,
      pd.refPackageName,
      pd.usercount
  )
SELECT
  refPaId,
  refPackageName,
  usercount,
  COALESCE(attendcount, 0) AS match_count
FROM
  user_attendance_count;`;
