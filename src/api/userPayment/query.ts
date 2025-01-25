export const initialDataOfPayment = `SELECT
  u."refStId",
  u."refSCustId",
  u."refStFName",
  u."refStLName",
  u."refSeTo",
  rp."refPackageName",
  pt."refTime",
  u."refClassMode",
  rp."refFeesType",
  rp."refFees",
  rp."refPaId",
  rm."refTimeMembers"
FROM
  public.users u
  INNER JOIN public."refPackage" rp ON CAST(u."refSessionMode" AS INTEGER) = rp."refPaId"
  INNER JOIN public."refPaTiming" pt ON CAST(u."refTimingId" AS INTEGER) = pt."refTimeId"
  INNER JOIN public."refMembers" rm ON CAST(u."refSessionType" AS INTEGER) = rm."refTimeMembersID"
WHERE
  u."refStId" = 4;;
`;

export const otherPackage = `
SELECT
  rp.*,
  ARRAY_AGG(rm."refTimeMembers") AS refTimeMembersArray
FROM
  public."refPackage" rp
  INNER JOIN public."refMembers" rm ON rm."refTimeMembersID" = ANY (
    string_to_array(
      regexp_replace(rp."refMemberType", '[{}]', '', 'g'),
      ','
    )::INTEGER[]
  )
WHERE
  rp."refPaId" != $1
GROUP BY
  rp."refPaId";`;

export const verifyCoupon = `SELECT 
ofn."refOfferName",
    o.*, 
    CASE 
        WHEN CURRENT_DATE BETWEEN o."refStartAt" AND o."refEndAt" AND
        ((o."refOfferId" IN (1,2) AND o."refMin"<=$2) OR (o."refOfferId"=3 AND o."refMin"<=$3) )
        THEN true
        ELSE false
    END AS "isValid"
FROM public."refOffers" o 
LEFT JOIN public."refOfName" ofn
ON CAST (o."refOfferId" AS INTEGER) = ofn."refOfferId"
WHERE o."refCoupon" = $1;`;

export const invoiceAuditData = `SELECT
  rp."refPayId",
  rp."refPayDate",
  rp."refFeesPaid",
  rp."refFeesType",
  rp."refPagExp",
  rp."refPayFrom",
  rp."refPayTo",
  rpa."refPackageName"
  
FROM
  public."refPayment" rp
  INNER JOIN public.users u ON CAST(rp."refStId" AS INTEGER) = u."refStId"
  INNER JOIN public.branch b ON CAST(u."refBranchId" AS INTEGER) = b."refbranchId"
  INNER JOIN public."refUserCommunication" uc ON CAST(u."refStId" AS INTEGER) = uc."refStId"
  INNER JOIN public."refPackage" rpa ON CAST(rp."refPayId" AS INTEGER) = rpa."refPaId"
  WHERE rp."refStId"=$ AND rp."refPayStatus" is false;`;

export const downloadInvoice = `SELECT
  u."refStId",
  u."refSCustId",
  u."refStFName",
  u."refStLName",
  b."refBranchName",
  uc."refCtMobile",
  rp."refOrderId",
  rp."refPayDate",
  rp."refPayFrom",
  rp."refPayTo",
  rp."refPagExp",
  rp."refFeesType",
  rp."refPagFees",rp."refFeesPaid",
  rpa."refPackageName"
FROM
  public."refPayment" rp
  INNER JOIN public.users u ON CAST(rp."refStId" AS INTEGER) = u."refStId"
  INNER JOIN public.branch b ON CAST(u."refBranchId" AS INTEGER) = b."refbranchId"
  INNER JOIN public."refUserCommunication" uc ON CAST(u."refStId" AS INTEGER) = uc."refStId"
  INNER JOIN public."refPackage" rpa ON CAST(rp."refPayId" AS INTEGER) = rpa."refPaId"
  WHERE rp."refPayId"=$1;`;

export const pastFessCount = `SELECT COUNT(*) FROM public."refPayment" WHERE "refStId"=$1`;

export const paymentCount = `SELECT
  COUNT(*)
FROM
  public."refPayment" rp
WHERE
  TO_CHAR(rp."refPayDate"::TIMESTAMP, 'DD/MM/YYYY') = TO_CHAR(TO_TIMESTAMP($1, 'DD/MM/YYYY, HH:MI:SS AM'), 'DD/MM/YYYY');`;

export const newPayment = `INSERT into
  public."refPayment" rp (
    rp."refStId",
    rp."refOrderId",
    rp."refTransId",
    rp."refPagId",
    rp."refPayFrom",
    rp."refPayTo",
    rp."refPagExp",
    rp."refOffId",
    rp."refOffType",
    rp."refFeesType",
    rp."refPagFees",
    rp."refFeesPaid",
    rp."refCollectedBy",
    rp."refPayDate",
    rp."refPayStatus"
  )
Values
  ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15);`;

export const getCustId = `SELECT "refSCustId" FROM public.users WHERE "refStId" = $1`;
export const getbranchId = `SELECT
  u."refBranchId",uc."refCtWhatsapp",uc."refCtEmail"
FROM
  public.users u
  LEFT JOIN public."refUserCommunication" uc ON CAST (u."refStId" AS INTEGER) = uc."refStId"
WHERE
  u."refStId" = $1`;

export const getStudentCount = `SELECT COUNT(*)
FROM public.users
WHERE "refSCustId" NOT LIKE '%S%' 
  AND "refSCustId" LIKE 'UY' || $1 || '%';`;

export const refUtId_userId_Update = `Update public.users SET "refUtId"=5,"refSCustId"=$2 WHERE "refStId"=$1;`;
export const refUtIdUpdate = `Update public.users SET "refUtId"=5 WHERE "refStId"=$1;`;
export const updateHistoryQuery = `
  INSERT INTO public."refUserTxnHistory" (
    "transTypeId","transData","refStId", "transTime", "refUpdatedBy", "refActionBy"
  ) VALUES ($1, $2, $3, $4, $5,$6)
  RETURNING *;
`;