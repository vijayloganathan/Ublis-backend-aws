// import { generateToken } from "../../helper/token";
// import { encrypt } from "../../helper/encrypt";
// import { createGoogleMeetLink } from "../../googleWorkspace/googleAuth";

// export class GoogleWorkSpaceRepository {
//     public async TestingV1(userData: any, decodedToken: any): Promise<any> {
//         const tokenData = {
//             id: decodedToken.id,
//             branch: decodedToken.branch,
//         };
//         const token = generateToken(tokenData, true);

//         try {
//             const meetLink = await createGoogleMeetLink();

//             const results = {
//                 success: true,
//                 message: "Meeting Created Successfully",
//                 token: token,
//                 meetingUrl: meetLink,
//             };

//             return encrypt(results, false);
//         } catch (error) {
//             console.error("Google Meet API Error:", error);

//             const results = {
//                 success: false,
//                 message: "Meeting Creation Failed",
//                 token: token,
//             };

//             return encrypt(results, false);
//         }
//     }
// }
