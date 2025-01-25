// export const getSectionPageData = `SELECT
// rt."refTimeId",
// rt."refTime",
// rt."refTimeMode",
// rt."refTimeMembersID",
// rt."refTimeDays",
// rm."refTimeMembers",
// rb."refBranchName"
// FROM public."refTiming" rt
// LEFT JOIN public."refMembers" rm
// ON CAST (rt."refTimeMembersID" AS INTEGER) = rm."refTimeMembersID"
// LEFT JOIN public.branch rb
// ON CAST (rt."refbranchId" AS INTEGER) = rb."refbranchId"
// WHERE rt."refbranchId"=$1
// `;
export const getSectionPageData = `SELECT 
  rt."refTimeId",
  rt."refTime",
  rt."refTimeMode",
  rt."refTimeMembersID",
  rt."refTimeDays" AS "refTimeDaysId",
  rm."refTimeMembers",
  rb."refBranchName",
  sd."refDays" AS "refTimeDays"
FROM public."refTiming" rt
LEFT JOIN public."refMembers" rm
  ON CAST(rt."refTimeMembersID" AS INTEGER) = rm."refTimeMembersID"
LEFT JOIN public."branch" rb
  ON CAST(rt."refbranchId" AS INTEGER) = rb."refbranchId"
  INNER JOIN public."refSessionDays" sd
  ON CAST (rt."refTimeDays" AS INTEGER) = sd."refSDId"
WHERE rt."refbranchId" = $1
  AND (rt."refDeleteAt" is null OR rt."refDeleteAt" =0)
`;

export const getBranchData = `SELECT * FROM public.branch`;

export const getMemberList = `SELECT * FROM public."refMembers"`;

export const setNewSection = `insert into
  public."refTiming" (
    "refTime",
    "refTimeMode",
    "refTimeDays",
    "refTimeMembersID",
    "refbranchId"
  )
values
  (
    $1,$2,$3,$4,$5
  )`;

export const getSessionDays = `SELECT * FROM public."refSessionDays"`;

export const updateSection = `UPDATE public."refTiming" rt 
SET "refTime"=$1,"refTimeMode"=$2,"refTimeDays"=$3,"refTimeMembersID"=$4 
WHERE "refTimeId"=$5
RETURNING *;`;

// export const deleteSection = `UPDATE public."refTiming" rt
// SET rt."refDeleteAt"=1
// WHERE "refTimeId"=$1
// RETURNING *;`;
export const deleteSection = `update
  "public"."refTiming"
set
  "refDeleteAt" = 1
where
  "refTimeId" = $1;`;

// export const customClass = `SELECT * FROM public."refCustTime" WHERE "refBranchId"=$1 AND ("refDeleteAt" is null OR "refDeleteAt" =0)`;

export const customClass = `SELECT
  ct.*,
  b."refBranchName"
FROM
  public."refCustTime" ct
  LEFT JOIN public.branch b ON CAST (ct."refBranchId" AS INTEGER) = b."refbranchId"
WHERE
  "refBranchId" = $1
  AND (
    "refDeleteAt" is null
    OR "refDeleteAt" = 0
  )`;
// export const addCustomClass = `insert into
//   "public"."refCustTime" (
//     "refBranchId",
//     "refCustTimeData"

//   )
// values
//   ($1,$2)
//   RETURNING *;`;
export const addCustomClass = `insert into
  "public"."refCustTime"(
    "refBranchId",
    "refCustTimeData",
    "refClassCount",
    "refMonthDuration",
    "refClassDes"
    
  )
values
  ($1,$2,$3,$4,$5)
  RETURNING *;`;

export const editCustomClass = `update
  "public"."refCustTime"
set
  "refCustTimeData" = $1
where
  "refCustTimeId" = $2;`;

export const deleteCustomClass = `update
  "public"."refCustTime"
set
  "refDeleteAt" = 1
where
  "refCustTimeId" = $1;`;

export const getHealthIssue = `SELECT
  "refHealthId",
  "refHealth"
FROM
  public."refHealthIssues"
WHERE
  "refIsDeleted" is null
  OR "refIsDeleted" = 0`;

export const addNewHealthIssue = `insert into
  "public"."refHealthIssues" ("refHealth")
values
  ($1) RETURNING *;`;

export const editHealthIssue = `update
  "public"."refHealthIssues"
set
  "refHealth" = $1
where
  "refHealthId" = $2;`;

export const deleteHealthIssue = `UPDATE
  public."refHealthIssues"
SET
  "refIsDeleted" = 1
WHERE
  "refHealthId" = $1;`;

export const addPackageTimeQuery = `insert into
  "public"."refPaTiming" ("refTime")
values
  ($1);`;

export const editPackageTimeQuery = `UPDATE public."refPaTiming"
SET "refTime" = $1
WHERE "refTimeId" = $2;`;

export const getTimingData = `SELECT
  *
FROM
  public."refPaTiming"
WHERE
  "refDeleteAt" is null
  or "refDeleteAt" = 0;`;

export const deleteCheck = `SELECT * 
FROM public."refPackage" 
WHERE ("refDeleteAt" IS NULL OR "refDeleteAt" = 0) 
  AND $1 = ANY(
      string_to_array(
          trim(both '{}' FROM "refTimingId"), ','
      )::INTEGER[]
  );`;

export const deleteTimingQuery = `UPDATE public."refPaTiming" SET "refDeleteAt"=1 WHERE "refTimeId"=$1;`;

export const addNewPackageQuery = `INSERT INTO
  public."refPackage" (
    "refPackageName",
    "refWTimingId",
    "refWeTimingId",
    "refSessionMode",
    "refSessionDays",
    "refMemberType",
    "refBranchId",
    "refFeesType",
    "refFees"
  )
VALUES
  (
    $1,
    $2::integer[],
    $3::integer[],
    $4,
    $5::integer[],
    $6::integer[],
    $7,
    $8,
    $9
  );
`;

export const getPackageData = `SELECT
  rp.*,
  array_to_json(
    string_to_array(
      trim(
        both '{}'
        FROM
          rp."refWTimingId"
      ),
      ','
    )::integer[]
  ) AS "refWTimingId",
  array_to_json(
    string_to_array(
      trim(
        both '{}'
        FROM
          rp."refWeTimingId"
      ),
      ','
    )::integer[]
  ) AS "refWeTimingId",
  array_to_json(
    string_to_array(
      trim(
        both '{}'
        FROM
          rp."refSessionDays"
      ),
      ','
    )::integer[]
  ) AS "refSessionDays",
  array_to_json(
    string_to_array(
      trim(
        both '{}'
        FROM
          rp."refMemberType"
      ),
      ','
    )::integer[]
  ) AS "refMemberType",
  JSONB_AGG(DISTINCT rptw."refTime") AS "wTimingDetails",
  JSONB_AGG(DISTINCT rpte."refTime") AS "weTimingDetails",
  JSONB_AGG(DISTINCT rs."refDays") AS "sessionDaysDetails",
  JSONB_AGG(DISTINCT rm."refTimeMembers") AS "memberTypeDetails",
  br."refBranchName"
FROM
  public."refPackage" rp
  LEFT JOIN public."refPaTiming" rptw ON rptw."refTimeId" = ANY (
    string_to_array(
      trim(
        both '{}'
        FROM
          rp."refWTimingId"
      ),
      ','
    )::integer[]
  )
  LEFT JOIN public."refPaTiming" rpte ON rpte."refTimeId" = ANY (
    string_to_array(
      trim(
        both '{}'
        FROM
          rp."refWeTimingId"
      ),
      ','
    )::integer[]
  )
  LEFT JOIN public."refSessionDays" rs ON rs."refSDId" = ANY (
    string_to_array(
      trim(
        both '{}'
        FROM
          rp."refSessionDays"
      ),
      ','
    )::integer[]
  )
  LEFT JOIN public."refMembers" rm ON rm."refTimeMembersID" = ANY (
    string_to_array(
      trim(
        both '{}'
        FROM
          rp."refMemberType"
      ),
      ','
    )::integer[]
  )
  LEFT JOIN public.branch br ON CAST(rp."refBranchId" AS INTEGER) = br."refbranchId"
WHERE
  rp."refBranchId" = $1 AND (rp."refDeleteAt" IS NULL OR rp."refDeleteAt" = 0)
GROUP BY
  rp."refPaId", br."refBranchName";`;

export const PackageDataUpdate = `UPDATE
  public."refPackage"
SET
  "refPackageName" = $1,
  "refWTimingId" = $2::integer[],
  "refWeTimingId" = $3::integer[],
  "refSessionMode" = $4,
  "refSessionDays" = $5::integer[],
  "refMemberType" = $6::integer[],
  "refFeesType" = $7,
  "refFees" = $8
WHERE
  "refPaId" = $9;
`;

export const deletePackage = `UPDATE public."refPackage" SET "refDeleteAt"=1 WHERE "refPaId"=$1;`;

export const getIntoVideoData = `SELECT
  vl.*,
  vla."refVdLang"
FROM
  public."refVideoLink" vl
  INNER JOIN public."refVideoLang" vla ON CAST(vl."refVdLangId" AS INTEGER) = vla."refVdLaId"`;

export const getBrowsherData = `SELECT
  *
FROM
  public.refbrowsher rb
  INNER JOIN public.branch b ON CAST(rb."refBranchId" AS INTEGER) = b."refbranchId"`;

export const getBranch = `SELECT b.* 
FROM public.branch b
LEFT JOIN public.refbrowsher rb 
ON CAST(rb."refBranchId" AS INTEGER) = b."refbranchId"
WHERE rb."refBranchId" IS NULL;`;

export const browsherUpdated = `update
  public."refbrowsher"
set
  "refBroLink" = $2,
  "refBranchId" = $3
where
  "refBroId" = $1;`;

export const browsherAdd = `insert into
  public."refbrowsher" (
    "refBranchId",
    "refBroLink"
  )
values
  ($1, $2);`;
