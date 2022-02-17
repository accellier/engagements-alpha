const moment = require("moment-timezone")

function fixDate(d){
  return moment.tz(new Date(d), "Australia/Sydney").format("DD/MM/YYYY")
}

// Unfortunately this approach can only get data on one course at a time.
// Need to do a seperate request to get all course IDs.

// Course ID to query on
const courseID = "Q291cnNlLTE4NQ=="

const req = await require("@pipedreamhq/platform").axios(this, {
  url: `https://${auths.canvas.domain}/api/graphql`,
  headers: {
    Authorization: `Bearer ${auths.canvas.oauth_access_token}`,
  },
  method: 'post',
  data: {
    query: `
        query GetEnrolments {
          course(id: "${courseID}") {
            usersConnection(filter: {enrollmentStates: active}) {
              nodes {
                _id
                shortName
                email
                createdAt
                updatedAt
                enrollments(currentOnly: true) {
                  lastActivityAt
                }
              }
            }
          }
        }
      `
  }
})

const students = []
/*loop through response for student details.
then because resp. returns any number of dates within each student
we have to loop through those, evaluating the most recent date
store it in "freshest" temporarily then push the most recent date into the array
*/
for (const e of req.data.course.usersConnection.nodes) {
        let freshest = new Date(Math.max(...e.enrollments.map(x => new Date(x.lastActivityAt))));
        students.push([`=HYPERLINK("https://accellier.instructure.com/accounts/1/users/${e._id}", "${e.shortName}")`, freshest, `=HYPERLINK("https://accellier.instructure.com/conversations?user_id=${e._id}&user_name=${e.shortName}#filter=type=inbox", "Send Message")`, `=HYPERLINK("https://app.hubspot.com/contacts/2700674/contact/email/${e.email}", "Hubspot")`])
}
//sort the array so the student who hasn't logged in the longest time ago is at the top.
//note: when a student has never logged in, API returns "null"
//Date(null) returns the 1970 epoch. I'll figure out a better way to handle it later.
students.sort((a, b) => a[1] > b[1] ? 1 : -1);
//make the dates a little easier to read. Probably don't need time stamp.
//using moment.js
for (const i of students){
  i[1] = fixDate(i[1])
}
return students
