import { generateToken, decodeToken } from "../../helper/token";
import { encrypt } from "../../helper/encrypt";
import { google } from "googleapis";
import auth from "../../googleWorkspace/googleAuth";

const classroom = google.classroom({ version: "v1", auth });

export class GoogleWorkSpaceRepository {
  public async TestingV1(userData: any, decodedToken: any): Promise<any> {
    const refStId = decodedToken.id;
    const tokenData = {
      id: decodedToken.id,
      branch: decodedToken.branch,
    };
    const token = generateToken(tokenData, true);
    try {
      const name = "Sample Course Name";
      const section = "Section 101";
      const description = "This is a description for the course.";

      const List = await classroom.courses.list();
      console.log(' -> Line Number ----------------------------------- 22', );
      console.log('List', List.data)
      
      const response = await classroom.courses.create({
        requestBody: {
          name,
          section,
          description,
          room: "Online",
          ownerId: "me",
          courseState:"ACTIVE"
        },
      });
      console.log(" -> Line Number ----------------------------------- 18");
      console.log("Course created:", response.data);

      // Step 2: Update the course state to ACTIVE
      const courseId = response.data.id;  // Get the course ID from the creation response
      console.log('courseId', courseId)
      
      const results = {
        success: true,
        message: "Testing Success lllllll",
        token: token,
        // courseLink: courseId, // Return the updated link
      };
      return encrypt(results, false);
    } catch (error) {
      console.log('Error:', error);
      const results = {
        success: false,
        message: "Testing Failed",
        token: token,
      };
      return encrypt(results, false);
    }
  }
}
