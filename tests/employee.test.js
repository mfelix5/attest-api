const request = require("supertest");
const app = require("../src/app");
const Employee = require("../src/models/employee");
const {
  employeeOne,
  employeeTwo,
  employeeThree,
  employeeFour,
  userOne,
  userTwo,
  setupDatabase,
} = require("./fixtures/db");

beforeEach(setupDatabase);

test("Should create employee with the user's accountId", async () => {
  const response = await request(app)
    .post("/employees")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      firstName: "Test",
      lastName: "User",
      primaryPhone: "2342341234",
      phoneNumbers: [
        {
          number: "1234567890",
          isOwnPhone: true,
        },
      ],
    })
    .expect(201);
  const employee = await Employee.findById(response.body._id);
  expect(employee).not.toBeNull();
  expect(employee.accountId).toEqual(userOne.accountId);
});

test("Should only fetch employees that belong to a user's account", async () => {
  const response = await request(app)
    .get("/employees")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body.length).toEqual(2);
  expect(
    response.body.every(
      (employee) => employee.accountId === userOne.accountId.toString()
    )
  ).toBe(true);
});

test("Should filter employees that are active or inactive", async () => {
  const response = await request(app)
    .get("/employees?active=true")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const activeEmployees = response.body;
  expect(activeEmployees).toHaveLength(2);

  const response2 = await request(app)
    .get("/employees?active=false")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const inactiveEmployees = response2.body;
  expect(inactiveEmployees).toHaveLength(0);

  const response3 = await request(app)
    .get("/employees?active=true")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200);

  const activeEmployeesAccount2 = response3.body;
  expect(activeEmployeesAccount2).toHaveLength(1);
});

test("Should sort employees", async () => {
  const response1 = await request(app)
    .get("/employees?sortBy=firstName:asc")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response1.body).toHaveLength(2);
  const firstNames = response1.body.map(employee => employee.firstName);
  expect(firstNames).toEqual(["Fourth", "Third"])

  const response2 = await request(app)
    .get("/employees?sortBy=firstName:desc")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response2.body).toHaveLength(2);
  const firstNameArray = response2.body.map(employee => employee.firstName);
  expect(firstNameArray).toEqual(["Third", "Fourth"])

});

test("Should limit and paginate employees", async () => {
  const response1 = await request(app)
    .get("/employees?limit=0&sortBy=firstName:desc")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response1.body).toHaveLength(2);

  const response2 = await request(app)
    .get("/employees?limit=1&sortBy=firstName:desc")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response2.body).toHaveLength(1);
  const employee = response2.body[0];
  expect(employee._id).toEqual(employeeThree._id.toString());

  const response3 = await request(app)
    .get("/employees?limit=1&skip=1&sortBy=firstName:desc")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response3.body).toHaveLength(1);
  const returnedEmployee = response3.body[0];
  expect(returnedEmployee._id).toEqual(employeeFour._id.toString());
});

test("Should not delete employees from other accounts", async () => {
  await request(app)
    .delete(`/employees/${employeeOne._id}`)
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);

  const employee = await Employee.findById(employeeOne._id);
  expect(employee).not.toBeNull();
});

test("Should update valid employee fields", async () => {
  await request(app)
    .patch(`/employees/${employeeTwo._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      firstName: "Jess",
      active: false
    })
    .expect(200);
  const employee = await Employee.findById(employeeTwo._id);
  expect(employee.firstName).toEqual("Jess");
  expect(employee.active).toEqual(false);
});

test("Should not update invalid employee fields", async () => {
  await request(app)
  .patch(`/employees/${employeeThree._id}`)
  .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
  .send({
    badProperty: "Test",
  })
  .expect(400);
});
