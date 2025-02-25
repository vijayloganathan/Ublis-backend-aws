// import { google } from "googleapis";
// import { calendar_v3 } from "googleapis/build/src/apis/calendar";
// import dotenv from "dotenv";

// dotenv.config();

// // Authenticate with Google Service Account
// const auth = new google.auth.GoogleAuth({
//     keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY!,
//     scopes: [
//         "https://www.googleapis.com/auth/calendar.events"
//     ],
// });

// const calendar = google.calendar({ version: "v3", auth });

// export const createGoogleMeetLink = async () => {
//     try {
//         const event: calendar_v3.Schema$Event = {
//             summary: "Google Meet Meeting",
//             description: "Meeting created via API",
//             start: {
//                 dateTime: new Date().toISOString(),
//                 timeZone: "Asia/Kolkata",
//             },
//             end: {
//                 dateTime: new Date(new Date().getTime() + 30 * 60000).toISOString(),
//                 timeZone: "Asia/Kolkata",
//             },
//             conferenceData: {
//                 createRequest: {
//                     requestId: Math.random().toString(36).substring(2, 15),
//                     conferenceSolutionKey: { type: "hangoutsMeet" }, // Ensure correct type
//                 },
//             },
            
//         };

//         const response = await calendar.events.insert({
//             calendarId: 'primary', // Or your specific calendar ID
//             requestBody: event,
//             conferenceDataVersion: 1,
//         });
        
        

//         return response.data.hangoutLink;
//     } catch (error) {
//         console.error("Error creating meeting:", error);
//         throw new Error("Failed to create Google Meet link");
//     }
// };
