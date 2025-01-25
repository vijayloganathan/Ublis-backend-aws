export const insertProfileAddressQuery = `
  INSERT INTO public."refUserAddress" (
    "refStId", 
    "refAdAdd1Type", 
    "refAdFlat1",
    "refAdAdd1", 
    "refAdArea1", 
    "refAdCity1",
     "refAdState1", 
     "refAdPincode1",
     "refAdAdd2Type",
     "refAdFlat2",
     "refAdAdd2",
     "refAdArea2",
     "refAdCity2",
     "refAdState2",
     "refAdPincode2"
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,$14,$15)
  RETURNING *;
`;

export const insertProfileGeneralHealth = `
  INSERT INTO
  public."refGeneralHealth" (
    "refStId", 
    "refHeight",
    "refWeight",
    "refBlood",
    "refBMI",
    "refRecentInjuries",
    "refRecentInjuriesReason",
    "refRecentFractures",
    "refRecentFracturesReason",
    "refOthers",
    "refElse",
    "refOtherActivities",
    "refPerHealthId",
    "refMedicalDetails",
    "refUnderPhysCare",
    "refDrName",
    "refHospital",
    "refBackpain",
    "refProblem",
    "refPastHistory",
    "refFamilyHistory",
    "refAnythingelse",
    "refBackPainValue",
    "refIfBP",
    "refBpType",
    "refBP"
  )
VALUES
  (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8,
    $9,
    $10,
    $11,
    $12,
    $13,
    $14,
    $15,
    $16,
    $17,
    $18,
    $19,
    $20,
    $21,
    $22,
    $23,
    $24,
    $25,
    $26
  )
RETURNING
  *;
`;

// export const insertProfilePersonalData = `
//     UPDATE public."users"
//   SET
//     "refStSex" = $1,
//     "refQualification" = $2,
//     "refOccupation" = $3,
//     "refguardian" = $4,
//     "refTimingId" = $5,
//     "refUtId" = $6,
//     "refStFName"=$7,
//     "refStLName"=$8,
//     "refStDOB"=$9,
//     "refStAge"=$10,
//     "refBranchId"=$11,
//     "refSessionType"=$12,
//     "refSPreferTimeId"=$13,
//     "refSessionMode"=$14,
//     "refMaritalStatus"=$15,
//     "refWeddingDate"=$16,
//     "refClassMode"=$17,
//     "refSCustId"=$18,
//     "refKidsCount"=$20,
//     "refDeliveryType"=$21
//   WHERE "refStId" = $19
//   RETURNING *;

// `;
export const insertProfilePersonalData = `UPDATE
  public."users"
SET
  "refStSex" = $1,
  "refQualification" = $2,
  "refOccupation" = $3,
  "refguardian" = $4,
  "refUtId" = $5,
  "refStFName" = $6,
  "refStLName" = $7,
  "refStDOB" = $8,
  "refStAge" = $9,
  "refBranchId" = $10,
  "refMaritalStatus" = $11,
  "refWeddingDate" = $12,
  "refKidsCount" = $14,
  "refDeliveryType" = $15,
  "refHealthIssue" = $16
WHERE
  "refStId" = $13
RETURNING
  *;`;

export const insertPackageData = `INSERT INTO
  public."refUserPackage" (
    "refStId",
    "refPaId",
    "refClMode",
    "refBatchId",
    "refWeekTiming",
    "refWeekDaysTiming",
    "refTherapy",
    "refClFrom",
    "refClTo"
  )
  Values
  ($1,$2,$3,$4,$5,$6,$7,$8,$9)`;

export const getStudentCount = `SELECT COUNT(*)
FROM public.users
WHERE "refSCustId" NOT LIKE '%S%' 
  AND "refSCustId" LIKE 'UY' || $1 || '%';`;

export const insertCommunicationData = `
  UPDATE public."refUserCommunication"
SET 
  "refCtWhatsapp" = $2,
  "refCtMobile"=$3,
  "refCtEmail"=$4,
  "refUcPreference"=$5,
  "refEmerContact"=$6
WHERE "refStId" = $1
RETURNING *;
`;

export const fetchProfileData = `
SELECT u."refStFName", u."refStLName", rud."refUserName", ruc."refCtMobile",ruc."refCtEmail", u."refStDOB", u."refStAge"
FROM users u
JOIN "refUserCommunication" ruc
ON u."refStId" = CAST(ruc."refStId" AS INTEGER)
JOIN "refUsersDomain" rud
ON u."refStId" = CAST(rud."refStId" AS INTEGER)
WHERE u."refStId" = $1;
`;

export const fetchCommunicationRef = `SELECT * FROM public."refCommType" `;

export const fetchPresentHealthProblem = `
  SELECT
  "refHealthId",
  "refHealth"
FROM
  public."refHealthIssues"
WHERE
  "refIsDeleted" is null
  OR "refIsDeleted" = 0
`;

export const updateHistoryQuery = `
  INSERT INTO public."refUserTxnHistory" (
    "transTypeId","transData","refStId", "transTime", "refUpdatedBy", "refActionBy"
  ) VALUES ($1, $2, $3, $4, $5,$6)
  RETURNING *;
`;

export const fetchBranchList = `SELECT * FROM public.branch;`;

// export const BranchMemberList = `SELECT rt."refTimeMembersID", rm."refTimeMembers"
// FROM public."refTiming" rt
// JOIN public."refMembers" rm
//   ON CAST(rt."refTimeMembersID" AS integer) = rm."refTimeMembersID"
// WHERE rt."refbranchId" = $2
//   AND (
//     ($1 <= 16 AND rt."refTimeMembersID" = 3)
//     OR ($1 > 16 AND rt."refTimeMembersID" != 3)
//   )
// GROUP BY rt."refTimeMembersID", rm."refTimeMembers";`;
export const BranchMemberList = `SELECT *
FROM public."refMembers" rm
WHERE 
    ($1 <= 16 AND rm."refTimeMembersID" = 3)
    OR ($1 > 16 AND rm."refTimeMembersID" != 3)
 `;

// export const getSectionTimeData = `SELECT
//     ROW_NUMBER() OVER (ORDER BY to_timestamp(substring("refTime" from '^[0-9:]+ [APM]+'), 'HH12:MI AM')) AS "order",
//     rt."refTimeId",
//     rt."refTime",
//     rt."refTimeMode",
//     sd."refDays" AS "refTimeDays"
// FROM
//     public."refTiming" rt
//     INNER JOIN public."refSessionDays" sd ON CAST (rt."refTimeDays" AS INTEGER) = sd."refSDId"
// WHERE
//     "refTimeMembersID" = $1 AND (rt."refDeleteAt" is null
//     OR rt."refDeleteAt" = 0)
// ORDER BY
//     to_timestamp(
//         substring("refTime" from '^[0-9:]+ [APM]+'),
//         'HH12:MI AM'
//     ) ASC;`;

export const getSectionTimeData = `SELECT
  "refPaId","refPackageName"
FROM
  public."refPackage"
WHERE
  ("refSessionMode" IN ('Offline & Online', $1))
  AND "refBranchId" = $2
  AND $3 = ANY (
    string_to_array(
      trim(
        both '{}'
        FROM
          "refMemberType"
      ),
      ','
    )::int[]
  )
  AND ("refDeleteAt" is null OR "refDeleteAt" = 0)`;

export const PackageTiming = `SELECT "refWTimingId","refWeTimingId" FROM public."refPackage" WHERE "refPaId"=$1`;

// export const getCustTime = `SELECT
//   *
// FROM
//   public."refCustTime"
// WHERE
//   "refBranchId"=$1 AND ("refDeleteAt" IS NULL
//   OR "refDeleteAt" = 0)
// ORDER BY
//   "refMonthDuration" IS NULL,
//   "refMonthDuration",
//   "refClassCount" IS NULL,
//   "refClassCount";`;
export const getCustTime = `SELECT "refTimeId", "refTime"
FROM public."refPaTiming"
WHERE "refTimeId" = ANY($1)
ORDER BY 
  TO_TIMESTAMP(SPLIT_PART("refTime", ' ', 1) || ' ' || SPLIT_PART("refTime", ' ', 2), 'HH:MI AM') ASC;`;

export const storeMedicalDoc = `insert into
  "public"."refMedicalDocuments" ("refMedDocName", "refMedDocPath", "refStId")
values
  ($1, $2, $3);`;

export const deleteMedDoc = `delete from
  public."refMedicalDocuments"
where
  "refMedDocId" = $1`;

export const getMedDoc = `SELECt * FROM public."refMedicalDocuments" WHERE "refMedDocId"=$1`;

export const updateBranch = `UPDATE public.users
SET "refBranchId" = $1
WHERE "refStId" = $2;`;

export const checkUser = `SELECT * FROM public."refUserPackage" up WHERE "refStId"=$1`;

export const insertSession = `INSERT INTO
  public."refUserPackage" (
    "refStId",
    "refPaId",
    "refClMode",
    "refBatchId",
    "refWeekTiming",
    "refWeekDaysTiming",
    "refTherapy"
  )
VALUES
  ($1, $2, $3, $4, $5, $6,'false')`;

export const updateSessionData = `UPDATE public."refUserPackage"
SET "refPaId" = $2,
    "refClMode" = $3,
    "refBatchId" = $4,
    "refWeekTiming" = $5,
    "refWeekDaysTiming" = $6
WHERE "refStId" = $1;
`;

export const fetchBrowsher = `SELECT * FROM public.refbrowsher WHERE "refBranchId" = $1
`;
